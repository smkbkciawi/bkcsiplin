const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const BLOCKED_PATHS = new Set([
  '/server.js',
  '/Code.gs',
  '/cloudflare-worker.js',
  '/package.json',
  '/package-lock.json',
  '/metadata.json',
  '/.env',
  '/.env.example'
]);

app.use((req, res, next) => {
  if (BLOCKED_PATHS.has(req.path)) {
    return res.status(404).send('Not found');
  }
  next();
});

app.use(express.static(path.join(__dirname), { dotfiles: 'ignore' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
