const express = require('express');
const { generate } = require('../services/alertEngine');

const router = express.Router();

// GET /api/alerts — recomputed live alerts. Optional ?severity= & ?type= filters.
router.get('/', (req, res) => {
  let alerts = generate();
  const { severity, type } = req.query;
  if (severity) alerts = alerts.filter((a) => a.severity === severity);
  if (type) alerts = alerts.filter((a) => a.type === type);
  res.json(alerts);
});

module.exports = router;
