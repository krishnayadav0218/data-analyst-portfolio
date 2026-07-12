# Krishna Yadav Portfolio

Full-stack portfolio website for data analyst, BI analyst, and junior data scientist roles.

## Tech Stack

- React + Vite frontend
- Node.js + Express backend
- Local JSON inbox for contact form messages
- Lucide React icons

## Run Locally

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:5000/api/profile`

## Production Build

```bash
npm run build
set NODE_ENV=production
npm start
```

Production URL: `http://localhost:5000`

## Publish To Netlify

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist --functions=netlify/functions
```

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Useful Files

- Portfolio UI: `src/App.jsx`
- Styling: `src/App.css`
- Backend API: `server/index.js`
- Netlify deploy config: `netlify.toml`
- Netlify functions: `netlify/functions`
- CV-based portfolio data: `server/profile.js`
- Saved contact messages: `server/messages.json`
