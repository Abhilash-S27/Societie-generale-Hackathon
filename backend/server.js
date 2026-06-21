// RiskWaiver360 — Express API server.
const express = require('express');
const cors = require('cors');

const store = require('./services/dataStore');
const { snapshot } = require('./services/alertEngine');

const dashboardRoutes = require('./routes/dashboard');
const exceptionsRoutes = require('./routes/exceptions');
const alertsRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/audit');
const lookupsRoutes = require('./routes/lookups');
const conflictsRoutes = require('./routes/conflicts');

const PORT = process.env.PORT || 4000;

const app = express();
// Restrict CORS to the local Vite frontend for the demo.
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin(origin, callback) {
    // Allow same-origin / non-browser tools (no Origin header) and the Vite dev origins.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

// Health.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RiskWaiver360 API', time: new Date().toISOString() });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exceptions', exceptionsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit-report', auditRoutes);
app.use('/api/lookups', lookupsRoutes);
app.use('/api/conflicts', conflictsRoutes);

// 404 + error handlers.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  // Log full detail server-side only; return a generic message to clients.
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Ensure data files exist, then refresh the persisted alert snapshot.
store.ensure();
try {
  snapshot();
} catch (e) {
  console.warn('[startup] alert snapshot skipped:', e.message);
}

app.listen(PORT, () => {
  console.log(`RiskWaiver360 API listening on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
