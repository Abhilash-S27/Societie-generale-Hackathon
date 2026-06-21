const express = require('express');
const { dashboard } = require('../services/auditService');

const router = express.Router();

// GET /api/dashboard — summary metrics, chart data, hotspots, top risks.
router.get('/', (req, res) => {
  res.json(dashboard());
});

module.exports = router;
