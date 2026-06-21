// RiskWaiver360 — minimal client-side CSV parser (for import preview).
// Handles quoted fields, embedded commas/newlines, and escaped quotes ("").

export function parseCSV(text) {
  const rows = [];
  let field = '';
  let cur = [];
  let inQuotes = false;
  const src = String(text || '').replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      cur.push(field); field = '';
    } else if (c === '\r') {
      // ignore
    } else if (c === '\n') {
      cur.push(field); rows.push(cur); cur = []; field = '';
    } else field += c;
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows;
}

export function parseCSVToObjects(text) {
  const rows = parseCSV(text);
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
