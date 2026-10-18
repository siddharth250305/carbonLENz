# Extraction evaluation

Scores the evidence extractor against a hand-labelled set.

```bash
node eval/run-eval.js          # deterministic rules engine, no API key needed
node eval/run-eval.js --llm    # Gemini engine, needs GEMINI_API_KEY in .env (aborts if any call falls back)
```

## Data

`dataset.js` holds 23 **synthetic** supplier declarations (fictional companies, written by hand, not real certificates)
with a ground-truth value for each of the 12 Annex VI evidence fields (`null` where the document is silent).
Layouts: labelled lists, kg unit conversion, prose emails, pipe tables, OCR-style typos, German labels, distractor
numbers, internal (unverified) declarations. 276 field slots in total.

## Scoring

Per (document, field) slot: **correct**, **wrong** value, **missed** (truth stated, extractor null) or
**spurious** (truth is null, extractor returned a value, i.e. a guess).
`precision = correct / (correct + wrong + spurious)`, `recall = correct / (correct + wrong + missed)`.
Numbers match exactly; product, methodology and reporting period match at token F1 >= 0.8; the rest match after
case and whitespace normalisation.

## Result: deterministic rules engine (`results-rules.json`)

| | |
|---|---|
| Precision | 95.7% |
| Recall | 78.4% |
| Correct / wrong / missed / spurious | 134 / 5 / 32 / 1 |

Recall is lowest on prose emails and unlabelled paragraphs (30-50%). Every wrong value is a confident error, not a null:

- `1,640 kgCO2e per tonne` read as `0.64`, and `1,980` as `0.98` (thousands separator in prose)
- `1,70` (decimal comma) read as `170`
- a reference number in a header line taken as the supplier name
- the first of two quantities (`Ordered` vs `Shipped`) taken
- `Verifier: None - internal declaration` returned as a verifier name

## Limits

Small, synthetic, written by the project author after reading the extractor, and one extractor only.
The Gemini run (`--llm`) has not been done yet.
