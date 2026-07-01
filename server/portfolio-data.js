/**
 * server/portfolio-data.js
 * --------------------------------------------------
 * Helper the PUBLIC route (GET /api/profile) uses, so that
 * whatever the admin panel saves shows up live on the actual
 * portfolio website immediately — no redeploy needed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profileData } from '../src/profileData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'portfolio.json');

export function getLivePortfolioData() {
  if (!fs.existsSync(DATA_FILE)) {
    // Admin panel hasn't saved anything yet — fall back to the
    // original static data from src/profileData.js.
    return profileData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
