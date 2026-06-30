/**
 * server/portfolio-data.js
 * --------------------------------------------------
 * Helper your PUBLIC routes (e.g. GET /api/profile) should use,
 * so that whatever the admin panel saves shows up live on the
 * actual portfolio website immediately — no redeploy needed.
 *
 * Replace your old "require('./profile')" usage with this.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'portfolio.json');

function getLivePortfolioData() {
  if (!fs.existsSync(DATA_FILE)) {
    // Falls back to your original static file if admin panel
    // hasn't saved anything yet.
    return require('./profile');
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

module.exports = { getLivePortfolioData };

/**
 * Example usage in server/index.js:
 *
 *   const { getLivePortfolioData } = require('./portfolio-data');
 *
 *   app.get('/api/profile', (req, res) => {
 *     const data = getLivePortfolioData();
 *     res.json(data);   // { profile, skills, projects, experience }
 *   });
 */
