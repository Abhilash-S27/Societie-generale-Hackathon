const express = require('express');
const { auditReport } = require('../services/auditService');

const router = express.Router();

// GET /api/audit-report — full audit-ready report payload.
router.get('/', (req, res) => {
  res.json(auditReport());
});

module.exports = router;
