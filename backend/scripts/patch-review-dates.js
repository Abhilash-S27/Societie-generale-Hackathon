// Patch last_reviewed_at for exceptions that lack it.
// Goal: ~75% of non-revoked exceptions should have a review in the past 30–150 days.
// Only touches records with null last_reviewed_at — never overwrites existing dates.
const fs  = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const SEED_DIR = path.join(__dirname, '../seed');

const exceptions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'exceptions.json'), 'utf8'));

const TERMINAL = new Set(['revoked', 'rejected', 'closed']);
const today    = new Date();

// For non-terminal exceptions that have no review date, assign one for ~75% of them.
// Distribute review dates realistically over the past 30–150 days.
let patched = 0;
const result = exceptions.map((e, i) => {
  if (e.last_reviewed_at) return e;          // already has a date — leave it
  if (TERMINAL.has(e.status)) return e;      // terminal — no review needed

  // Assign to ~75% (skip every 4th one in cycling pattern)
  if (i % 4 === 3) return e;                // leave ~25% unreviewed (realistic backlog)

  // Vary review dates: mix recent (< 90 days) and due-soon (90–150 days)
  // Pattern cycles so dates are distributed across the range
  const ranges = [20, 35, 50, 65, 80, 100, 120, 140];
  const daysAgo = ranges[i % ranges.length];
  const reviewDate = new Date(today);
  reviewDate.setDate(reviewDate.getDate() - daysAgo);

  patched++;
  return { ...e, last_reviewed_at: reviewDate.toISOString().split('T')[0] };
});

fs.writeFileSync(path.join(DATA_DIR, 'exceptions.json'), JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(SEED_DIR, 'exceptions.json'), JSON.stringify(result, null, 2));
console.log(`Patched ${patched} review dates. Total exceptions: ${result.length}`);

// Summary
const noReview = result.filter(e => !e.last_reviewed_at).length;
const hasReview = result.filter(e => e.last_reviewed_at).length;
console.log(`  No last_reviewed_at: ${noReview} | Has review date: ${hasReview}`);
