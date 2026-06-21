// RiskWaiver360 — reset demo data.
// Restores the clean demo seed by copying backend/seed/*.json over
// backend/data/*.json. Run before a fresh presentation:  npm run reset-demo
const fs = require('fs');
const path = require('path');

const SEED_DIR = path.join(__dirname, '..', 'seed');
const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES = [
  'users.json',
  'policies.json',
  'assets.json',
  'exceptions.json',
  'approvals.json',
  'exception_history.json',
  'alerts.json',
];

if (!fs.existsSync(SEED_DIR)) {
  console.error(`[reset-demo] Seed folder not found: ${SEED_DIR}`);
  process.exit(1);
}
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let copied = 0;
for (const file of FILES) {
  const src = path.join(SEED_DIR, file);
  if (!fs.existsSync(src)) {
    console.warn(`[reset-demo] Skipped (not in seed): ${file}`);
    continue;
  }
  fs.copyFileSync(src, path.join(DATA_DIR, file));
  copied += 1;
}

console.log(`Demo data reset successfully. (${copied} file(s) restored)`);
