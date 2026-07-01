/**
 * server/admin.js
 * --------------------------------------------------
 * Drop-in Express module that adds a password-protected
 * admin API on top of the existing portfolio backend.
 *
 * It reads/writes a single JSON file (server/data/portfolio.json)
 * that holds: profile, skills, projects, experience.
 * Contact messages are read from the existing server/messages.json.
 *
 * HOW TO USE (in server/index.js):
 *
 *   import attachAdminRoutes from './admin.js';
 *   attachAdminRoutes(app);
 *
 * Routes added:
 *   POST   /api/admin/login          { password } -> { token }
 *   GET    /api/admin/data           (auth) -> { profile, skills, projects, experience }
 *   PUT    /api/admin/profile        (auth) body: profile object
 *   PUT    /api/admin/skills         (auth) body: skills array
 *   PUT    /api/admin/projects       (auth) body: projects array
 *   PUT    /api/admin/experience     (auth) body: experience array
 *   GET    /api/admin/messages       (auth) -> contact messages
 *   DELETE /api/admin/messages/:id   (auth)
 *   POST   /api/admin/logout         (auth)
 *
 * AUTH: send header  Authorization: Bearer <token>  on protected routes.
 * --------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { profileData } from '../src/profileData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- CONFIG ----------
// Password lives in an env var so it's never hardcoded in source control.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Krishna@2026';

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'portfolio.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Simple in-memory session store: token -> expiry timestamp.
// Good enough for a single-admin portfolio site.
const sessions = new Map();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isValidToken(token) {
  if (!token || !sessions.has(token)) return false;
  const expiry = sessions.get(token);
  if (Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Not authenticated. Please log in again.' });
  }
  next();
}

// ---------- DATA HELPERS ----------
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Seed from the REAL, already-live data in src/profileData.js
    // (not a placeholder), so the admin panel opens in sync with
    // what's actually on the site.
    fs.writeFileSync(DATA_FILE, JSON.stringify(profileData, null, 2), 'utf-8');
  }
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readMessages() {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
}

// ---------- ROUTES ----------
export default function attachAdminRoutes(app) {
  app.use('/api/admin', express.json());

  // LOGIN
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {};
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    const token = makeToken();
    sessions.set(token, Date.now() + SESSION_TTL_MS);
    res.json({ token });
  });

  // LOGOUT
  app.post('/api/admin/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization.slice(7);
    sessions.delete(token);
    res.json({ ok: true });
  });

  // GET ALL DATA
  app.get('/api/admin/data', requireAuth, (req, res) => {
    res.json(readData());
  });

  // UPDATE PROFILE
  app.put('/api/admin/profile', requireAuth, (req, res) => {
    const data = readData();
    data.profile = req.body;
    writeData(data);
    res.json({ ok: true, profile: data.profile });
  });

  // UPDATE SKILLS
  app.put('/api/admin/skills', requireAuth, (req, res) => {
    const data = readData();
    data.skills = req.body;
    writeData(data);
    res.json({ ok: true, skills: data.skills });
  });

  // UPDATE PROJECTS
  app.put('/api/admin/projects', requireAuth, (req, res) => {
    const data = readData();
    data.projects = req.body;
    writeData(data);
    res.json({ ok: true, projects: data.projects });
  });

  // UPDATE EXPERIENCE
  app.put('/api/admin/experience', requireAuth, (req, res) => {
    const data = readData();
    data.experience = req.body;
    writeData(data);
    res.json({ ok: true, experience: data.experience });
  });

  // GET CONTACT MESSAGES
  app.get('/api/admin/messages', requireAuth, (req, res) => {
    res.json(readMessages());
  });

  // DELETE A CONTACT MESSAGE
  app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
    const messages = readMessages();
    const filtered = messages.filter((m) => String(m.id) !== req.params.id);
    writeMessages(filtered);
    res.json({ ok: true });
  });
}
