/**
 * server/portfolio-data.js
 * --------------------------------------------------
 * Helper the PUBLIC route (GET /api/profile) uses, so that
 * whatever the admin panel saves shows up live on the actual
 * portfolio website immediately — no redeploy needed.
 *
 * Reads src/data/content.json fresh from disk on every request,
 * since that's the exact same file the admin panel (server/admin.js)
 * edits. This keeps there being a single source of truth.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Must match the same override logic as server/admin.js so the public
// site and the admin panel always read/write the exact same file.
const CONTENT_FILE = process.env.CONTENT_FILE_PATH || path.join(__dirname, '..', 'src', 'data', 'content.json');

export function getLivePortfolioData() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
}
