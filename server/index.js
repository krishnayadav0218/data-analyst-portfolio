import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profile } from './profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const app = express();
const port = process.env.PORT || 5000;
const messagesPath = path.join(__dirname, 'messages.json');

app.use(cors());
app.use(express.json());

app.get('/api/profile', (_req, res) => {
  res.json(profile);
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message, source = 'Local contact form', service = 'General inquiry' } = req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const entry = {
    id: randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    message: String(message).trim(),
    source: String(source).trim(),
    service: String(service).trim(),
    receivedAt: new Date().toISOString(),
  };

  try {
    let existing = [];
    try {
      existing = JSON.parse(await fs.readFile(messagesPath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    existing.push(entry);
    await fs.writeFile(messagesPath, JSON.stringify(existing, null, 2));
    return res.status(201).json({ ok: true, message: 'Message saved successfully.' });
  } catch {
    return res.status(500).json({ error: 'Could not save message.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(rootDir, 'dist')));
  app.use((_req, res) => {
    res.sendFile(path.join(rootDir, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Portfolio backend running on http://localhost:${port}`);
});
