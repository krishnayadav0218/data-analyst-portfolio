/**
 * server/admin-secure.js
 * --------------------------------------------------
 * OPTIONAL UPGRADE — use this instead of admin.js when you
 * want stronger security:
 *   - bcrypt-hashed password (instead of plain-text comparison)
 *   - JWT session tokens (instead of in-memory random tokens)
 *   - rate-limiting on the login route (stops brute-force attempts)
 *
 * INSTALL:
 *   npm install bcryptjs jsonwebtoken express-rate-limit
 *
 * SETUP:
 *   1) Generate a bcrypt hash of your password once:
 *
 *        node -e "console.log(require('bcryptjs').hashSync('Krishna@2026', 10))"
 *
 *      Copy the output and put it in your .env file as ADMIN_PASSWORD_HASH.
 *
 *   2) Add to .env:
 *        ADMIN_PASSWORD_HASH=<paste hash here>
 *        JWT_SECRET=<any long random string>
 *
 *   3) In server/index.js, swap the import:
 *        import attachAdminRoutes from './admin-secure.js';
 *        attachAdminRoutes(app);
 *
 * Everything else (routes, data file, behavior) is identical to admin.js.
 * You do NOT need this right now — admin.js already matches the
 * AdminPanel.jsx frontend and needs zero extra setup.
 * --------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { profileData } from '../src/profileData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // bcrypt hash, never plain text
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-your-.env-file';
const TOKEN_EXPIRY = '12h';

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'portfolio.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Max 5 login attempts per 15 minutes, per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// ---------- DATA HELPERS (same as admin.js) ----------
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(profileData, null, 2), 'utf-8');
  }
}
function readData() { ensureDataFile(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8'); }
function readMessages() {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8')); } catch { return []; }
}
function writeMessages(messages) { fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8'); }

export default function attachAdminRoutes(app) {
  app.use('/api/admin', express.json());

  app.post('/api/admin/login', loginLimiter, async (req, res) => {
    const { password } = req.body || {};
    if (!ADMIN_PASSWORD_HASH) {
      return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD_HASH not set.' });
    }
    const valid = password && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!valid) return res.status(401).json({ error: 'Incorrect password.' });

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token });
  });

  app.post('/api/admin/logout', requireAuth, (req, res) => {
    // With stateless JWTs there's nothing to delete server-side;
    // the frontend just discards the token.
    res.json({ ok: true });
  });

  app.get('/api/admin/data', requireAuth, (req, res) => res.json(readData()));

  app.put('/api/admin/profile', requireAuth, (req, res) => {
    const data = readData(); data.profile = req.body; writeData(data);
    res.json({ ok: true, profile: data.profile });
  });
  app.put('/api/admin/skills', requireAuth, (req, res) => {
    const data = readData(); data.skills = req.body; writeData(data);
    res.json({ ok: true, skills: data.skills });
  });
  app.put('/api/admin/projects', requireAuth, (req, res) => {
    const data = readData(); data.projects = req.body; writeData(data);
    res.json({ ok: true, projects: data.projects });
  });
  app.put('/api/admin/experience', requireAuth, (req, res) => {
    const data = readData(); data.experience = req.body; writeData(data);
    res.json({ ok: true, experience: data.experience });
  });

  app.get('/api/admin/messages', requireAuth, (req, res) => res.json(readMessages()));
  app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
    const messages = readMessages().filter((m) => String(m.id) !== req.params.id);
    writeMessages(messages);
    res.json({ ok: true });
  });
}
