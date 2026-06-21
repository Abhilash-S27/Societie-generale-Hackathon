// RiskWaiver360 — tiny dependency-free CSV parser/serializer.
// Handles quoted fields, embedded commas/newlines, and escaped quotes ("").

function parseCSV(text) {
  const rows = [];
  let field = '';
  let cur = [];
  let inQuotes = false;
  const src = String(text || '').replace(/^﻿/, ''); // strip BOM

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      cur.push(field); field = '';
    } else if (c === '\r') {
      // ignore, handled by \n
    } else if (c === '\n') {
      cur.push(field); rows.push(cur); cur = []; field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows;
}

// Convert raw rows -> array of objects keyed by header row.
function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((r) => {
      const o = {};
      headers.forEach((h, i) => { o[h] = (r[i] != null ? String(r[i]).trim() : ''); });
      return o;
    });
}

function parseToObjects(text) {
  return rowsToObjects(parseCSV(text));
}

// Neutralize spreadsheet formula injection: a cell starting with = + - @ (or a
// leading tab/CR) is prefixed with a single quote so Excel/Sheets treats it as text.
function neutralizeFormula(s) {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function escapeCell(v) {
  const s = neutralizeFormula(v == null ? '' : String(v));
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// headers: string[]; rows: array of objects (or arrays).
function toCSV(headers, rows) {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    const arr = Array.isArray(row) ? row : headers.map((h) => row[h]);
    lines.push(arr.map(escapeCell).join(','));
  }
  return lines.join('\r\n');
}

module.exports = { parseCSV, rowsToObjects, parseToObjects, toCSV };
