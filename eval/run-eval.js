// Scores the evidence extractor against the hand-labelled set in eval/dataset.js.
//
//   node eval/run-eval.js            deterministic rules engine (no API key needed)
//   node eval/run-eval.js --llm      Gemini engine (needs GEMINI_API_KEY in .env); aborts if any call falls back
//
// Per (document, field) slot: correct / wrong value / missed (truth stated, extractor null) /
// spurious (truth is null, extractor returned a value, i.e. a guess).
//   precision = correct / (correct + wrong + spurious)      recall = correct / (correct + wrong + missed)
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { extractEvidence } from '../server/extractor.js';
import { DATASET, FIELDS } from './dataset.js';

const useLlm = process.argv.includes('--llm');
const FREE_TEXT = new Set(['product_description', 'methodology', 'reporting_period']);

const norm = (s) => String(s).toLowerCase().replace(/[.,;]+$/g, '').replace(/\s+/g, ' ').trim();
const tokens = (s) => String(s).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
// Numbers only, ignoring digits glued to letters (the "2" in tCO2e is not a value).
const numbers = (s) => (String(s).match(/(?<![A-Za-z])\d+(?:\.\d+)?/g) ?? []).map(Number);

function tokenF1(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const pool = [...tb];
  let overlap = 0;
  for (const t of ta) {
    const i = pool.indexOf(t);
    if (i >= 0) { overlap += 1; pool.splice(i, 1); }
  }
  if (!overlap) return 0;
  const p = overlap / ta.length;
  const r = overlap / tb.length;
  return (2 * p * r) / (p + r);
}

function matches(field, predicted, expected) {
  if (typeof expected === 'number') return typeof predicted === 'number' && Math.abs(predicted - expected) < 1e-9;
  if (field === 'direct_indirect_split') {
    const a = numbers(predicted);
    const b = numbers(expected);
    return a.length === b.length && a.every((n, i) => n === b[i]);
  }
  if (FREE_TEXT.has(field)) return tokenF1(predicted, expected) >= 0.8;
  return norm(predicted) === norm(expected);
}

const blank = () => ({ correct: 0, wrong: 0, missed: 0, spurious: 0, correctNull: 0 });
const total = blank();
const perField = Object.fromEntries(FIELDS.map((f) => [f, blank()]));
const perStyle = {};
const errors = [];
let engineUsed = null;
let modelUsed = null;

for (const doc of DATASET) {
  const { extraction, engine, model, warnings } = await extractEvidence({ text: doc.text, engine: useLlm ? 'auto' : 'rules' });
  if (useLlm && engine !== 'gemini') {
    console.error(`Aborting: ${doc.id} was handled by "${engine}", not Gemini.\n${warnings.join('\n')}`);
    process.exit(1);
  }
  engineUsed = engine;
  modelUsed = model;
  perStyle[doc.style] ??= blank();

  for (const field of FIELDS) {
    const expected = doc.truth[field];
    const predicted = extraction.fields[field] ?? null;
    let kind;
    if (expected == null && predicted == null) kind = 'correctNull';
    else if (expected == null) kind = 'spurious';
    else if (predicted == null) kind = 'missed';
    else kind = matches(field, predicted, expected) ? 'correct' : 'wrong';
    for (const bucket of [total, perField[field], perStyle[doc.style]]) bucket[kind] += 1;
    if (kind !== 'correct' && kind !== 'correctNull') errors.push({ doc: doc.id, style: doc.style, field, kind, expected, predicted });
  }
  if (useLlm) await new Promise((r) => setTimeout(r, 1200));
}

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : 'n/a');
const prec = (b) => pct(b.correct, b.correct + b.wrong + b.spurious);
const rec = (b) => pct(b.correct, b.correct + b.wrong + b.missed);
const f1 = (b) => {
  const p = b.correct / (b.correct + b.wrong + b.spurious || 1);
  const r = b.correct / (b.correct + b.wrong + b.missed || 1);
  return p + r ? `${((200 * p * r) / (p + r)).toFixed(1)}%` : '0.0%';
};

const slots = DATASET.length * FIELDS.length;
console.log(`Engine: ${engineUsed}${modelUsed ? ` (${modelUsed})` : ''}   Documents: ${DATASET.length}   Field slots: ${slots}`);
console.log(`Overall  precision ${prec(total)}   recall ${rec(total)}   F1 ${f1(total)}`);
console.log(`  correct ${total.correct}, wrong ${total.wrong}, missed ${total.missed}, spurious (guessed where document is silent) ${total.spurious}, correct null ${total.correctNull}\n`);

console.log('Per field');
console.log('field                   prec    recall  correct wrong missed spurious');
for (const f of FIELDS) {
  const b = perField[f];
  console.log(`${f.padEnd(23)} ${prec(b).padStart(6)}  ${rec(b).padStart(6)}  ${String(b.correct).padStart(7)} ${String(b.wrong).padStart(5)} ${String(b.missed).padStart(6)} ${String(b.spurious).padStart(8)}`);
}

console.log('\nPer layout');
for (const [style, b] of Object.entries(perStyle)) console.log(`${style.padEnd(78)} recall ${rec(b).padStart(6)}  prec ${prec(b).padStart(6)}`);

console.log('\nErrors');
for (const e of errors) console.log(`${e.doc} ${e.field.padEnd(22)} ${e.kind.padEnd(8)} expected=${JSON.stringify(e.expected)} got=${JSON.stringify(e.predicted)}`);

const out = new URL(`./results-${useLlm ? 'gemini' : 'rules'}.json`, import.meta.url);
writeFileSync(out, JSON.stringify({
  engine: engineUsed, model: modelUsed, documents: DATASET.length, slots,
  overall: { ...total, precision: prec(total), recall: rec(total), f1: f1(total) },
  perField, perStyle, errors,
}, null, 2));
console.log(`\nWrote ${out.pathname}`);
