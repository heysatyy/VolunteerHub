// server.js — VolunteerHub Backend (Node.js + Express + SQLite)
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/volunteers',  require('./routes/volunteers'));
app.use('/api/donations',   require('./routes/donations'));
app.use('/api/events',      require('./routes/events'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/allocations', require('./routes/allocations'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (_req, res) => res.redirect('/index.html'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Init SQLite first, then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ VolunteerHub running at http://localhost:${PORT}`);
    console.log(`📦 Database: SQLite (volunteerhub.db)`);
    console.log(`\n🔑 Default login:`);
    console.log(`   Email:    admin@volunteerhub.org`);
    console.log(`   Password: password\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
