/**
 * server/admin.js
 * --------------------------------------------------
 * Password-protected admin API for the portfolio.
 *
 * IMPORTANT: this reads and writes `src/data/content.json` directly —
 * the SAME file the live site (App.jsx) is built from. There is no
 * separate/duplicate data file anymore, so what you edit here is
 * exactly what the site shows (no shape mismatch, no double source
 * of truth).
 *
 * Routes:
 *   POST   /api/admin/login          { password } -> { token }
 *   GET    /api/admin/data           (auth) -> full content.json
 *   PUT    /api/admin/profile        (auth) body: { name, role, location, email, phone, linkedin, github, instagram, headline, summary }
 *   PUT    /api/admin/skills         (auth) body: { CategoryName: ["item", ...], ... }
 *   PUT    /api/admin/projects       (auth) body: array of project objects
 *   PUT    /api/admin/education      (auth) body: array of { degree, school, years }
 *   PUT    /api/admin/certifications (auth) body: array of strings
 *   PUT    /api/admin/:section       (auth) generic route covering blog, metrics, focusAreas,
 *                                     testimonials, services, faqs, crmPipeline, adminStats
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- CONFIG ----------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'anubhav@0218';

// On platforms with ephemeral disks (e.g. Railway without a Volume),
// override these with CONTENT_FILE_PATH / MESSAGES_FILE_PATH env vars
// pointing at a mounted volume, so admin edits survive redeploys.
const CONTENT_FILE = process.env.CONTENT_FILE_PATH || path.join(__dirname, '..', 'src', 'data', 'content.json');
const MESSAGES_FILE = process.env.MESSAGES_FILE_PATH || path.join(__dirname, 'messages.json');

// If we're pointed at a volume path that hasn't been seeded yet, copy the
// repo's content.json into it once so the site has real data on first boot.
function ensureContentSeeded() {
  if (!fs.existsSync(CONTENT_FILE)) {
    const seedPath = path.join(__dirname, '..', 'src', 'data', 'content.json');
    fs.mkdirSync(path.dirname(CONTENT_FILE), { recursive: true });
    fs.copyFileSync(seedPath, CONTENT_FILE);
  }
}
ensureContentSeeded();

// Simple in-memory session store: token -> expiry timestamp.
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
// Always read fresh from disk so edits are reflected immediately,
// and so GET /api/profile (public route) always serves the latest saved copy.
function readData() {
  const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
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

const PROFILE_FIELDS = [
  'name', 'role', 'location', 'email', 'phone',
  'linkedin', 'github', 'instagram', 'headline', 'summary',
];

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

  // GET ALL DATA (the whole content.json, as-is)
  app.get('/api/admin/data', requireAuth, (req, res) => {
    res.json(readData());
  });

  // UPDATE PROFILE (only the flat identity/contact fields)
  app.put('/api/admin/profile', requireAuth, (req, res) => {
    const data = readData();
    const body = req.body || {};
    for (const key of PROFILE_FIELDS) {
      if (key in body) data[key] = body[key];
    }
    writeData(data);
    res.json({ ok: true });
  });

  // UPDATE SKILLS (object: { CategoryName: [items] })
  app.put('/api/admin/skills', requireAuth, (req, res) => {
    const data = readData();
    data.skills = req.body || {};
    writeData(data);
    res.json({ ok: true, skills: data.skills });
  });

  // UPDATE PROJECTS (array of project objects)
  app.put('/api/admin/projects', requireAuth, (req, res) => {
    const data = readData();
    data.projects = req.body || [];
    writeData(data);
    res.json({ ok: true, projects: data.projects });
  });

  // UPDATE EDUCATION (array of { degree, school, years })
  app.put('/api/admin/education', requireAuth, (req, res) => {
    const data = readData();
    data.education = req.body || [];
    writeData(data);
    res.json({ ok: true, education: data.education });
  });

  // UPDATE CERTIFICATIONS (array of strings)
  app.put('/api/admin/certifications', requireAuth, (req, res) => {
    const data = readData();
    data.certifications = req.body || [];
    writeData(data);
    res.json({ ok: true, certifications: data.certifications });
  });

  // GENERIC UPDATE for the remaining array/object sections. Maps the admin
  // panel's tab id -> the actual key in content.json (only 'blog' differs,
  // since the field is called blogPosts there).
  const SECTION_FIELD_MAP = {
    blog: 'blogPosts',
    metrics: 'metrics',
    focusAreas: 'focusAreas',
    testimonials: 'testimonials',
    services: 'services',
    faqs: 'faqs',
    crmPipeline: 'crmPipeline',
    adminStats: 'adminStats',
  };
  app.put('/api/admin/:section', requireAuth, (req, res) => {
    const field = SECTION_FIELD_MAP[req.params.section];
    if (!field) return res.status(404).json({ error: 'Unknown section.' });
    const data = readData();
    data[field] = req.body ?? [];
    writeData(data);
    res.json({ ok: true, [field]: data[field] });
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
