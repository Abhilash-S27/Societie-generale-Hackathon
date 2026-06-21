// RiskWaiver360 — JSON file persistence layer.
// Each "collection" is a separate JSON file under backend/data.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const COLLECTIONS = [
  'users',
  'policies',
  'assets',
  'exceptions',
  'approvals',
  'exception_history',
  'alerts',
];

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const c of COLLECTIONS) {
    if (!fs.existsSync(filePath(c))) {
      fs.writeFileSync(filePath(c), '[]', 'utf-8');
    }
  }
}

function read(name) {
  ensure();
  try {
    const raw = fs.readFileSync(filePath(name), 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error(`[dataStore] failed to read ${name}:`, err.message);
    return [];
  }
}

function write(name, data) {
  ensure();
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

function nextId(name, prefix) {
  const rows = read(name);
  let max = 0;
  for (const r of rows) {
    const id = String(r.id || '');
    const m = id.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const num = String(max + 1).padStart(4, '0');
  return `${prefix}-${num}`;
}

module.exports = { DATA_DIR, COLLECTIONS, read, write, nextId, ensure, filePath };
