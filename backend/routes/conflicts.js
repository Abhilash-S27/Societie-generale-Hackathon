const express = require('express');
const { detectAll } = require('../services/conflictDetection');

const router = express.Router();

// GET /api/conflicts — all overlap/conflict/duplicate/accumulation findings.
// Optional filters: ?type= & ?severity=
router.get('/', (req, res) => {
  const result = detectAll();
  let findings = result.findings;
  const { type, severity } = req.query;
  if (type) findings = findings.filter((f) => f.type === type);
  if (severity) findings = findings.filter((f) => f.severity === severity);
  res.json({ ...result, findings });
});

module.exports = router;
