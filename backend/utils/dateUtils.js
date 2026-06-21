// RiskWaiver360 — date helpers
const DAY = 24 * 60 * 60 * 1000;

function now() {
  return new Date();
}

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Whole days from `from` until `to` (positive = to is in the future)
function daysBetween(to, from = now()) {
  const a = toDate(to);
  const b = toDate(from);
  if (!a || !b) return null;
  return Math.ceil((a.getTime() - b.getTime()) / DAY);
}

// Days remaining until expiry (negative = overdue)
function daysRemaining(expiryDate, ref = now()) {
  return daysBetween(expiryDate, ref);
}

function daysSince(date, ref = now()) {
  const d = toDate(date);
  if (!d) return null;
  return Math.floor((toDate(ref).getTime() - d.getTime()) / DAY);
}

function addDays(date, days) {
  const d = toDate(date) || now();
  return new Date(d.getTime() + days * DAY);
}

function isoNow() {
  return now().toISOString();
}

function formatDate(value) {
  const d = toDate(value);
  if (!d) return '—';
  return d.toISOString().slice(0, 10);
}

module.exports = {
  DAY,
  now,
  toDate,
  daysBetween,
  daysRemaining,
  daysSince,
  addDays,
  isoNow,
  formatDate,
};
