# CarbonLenz AI — CBAM Evidence Scanner & Exposure Platform

CarbonLenz scans messy supplier emissions declarations, checks them against the EU CBAM Annex VI verification checklist, and forecasts 2026–2034 certificate exposure under EU default values vs. verified actual data.

See [`carbonlenz.md`](carbonlenz.md) for the full product case study.

## Quick start

```bash
npm install
npm run dev:all        # Express API on :5001 + Vite on :5173 (proxies /api)
```

Open http://localhost:5173, click **Load Bharat Steel demo**, then **Scan and validate**. **Export Audit PDF** prints the one-page audit report.

Single-process alternative: `npm run build && npm run server`, then open http://localhost:5001.

| Script | What it does |
|---|---|
| `npm run dev:all` | API (auto-restart on change) + Vite dev server |
| `npm run dev` / `npm run dev:server` | Frontend only / API only |
| `npm run build` | Production build to `dist/` (served by the API if present) |
| `npm test` | Engine, validator and extractor unit tests (`node --test`) |

### AI extraction (optional)
Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (primary, also reads scanned PDFs) and/or `OPENAI_API_KEY`. With no key, or if an LLM call fails, the deterministic rules engine extracts the evidence, so the demo always works. LLM output for verifier, accreditation, installation and site-visit fields is dropped if the value does not appear verbatim in the document.

## Architecture

```
server/knowledge/*.md   OKF knowledge base: Markdown + YAML frontmatter, the single source of every constant
shared/okf.js           Parses the OKF files into a constants object (used by server AND browser)
shared/cbamEngine.js    Pure, deterministic 2026–2034 cost engine (markup modes, prices, de minimis, totals)
server/extractor.js     Gemini → OpenAI → rules-engine evidence extraction
server/validator.js     Annex VI checklist, Supplier Risk Score (0–100), prioritised actions
server/server.js        Express API
src/                    React 18 + Vite + Tailwind v4 dashboard
```

The browser bundles the same OKF Markdown files at build time (`?raw` imports), so the calculator and the API can never disagree.

### API
| Route | Purpose |
|---|---|
| `GET /api/health` | Status and which extraction engines are configured |
| `GET /api/knowledge` | The loaded OKF constants |
| `POST /api/scan-evidence` | `{ "demo": true }`, `{ "text": "…" }`, or multipart `file` (.pdf/.txt). Returns extraction (progress.md §4.1 schema), `validation`, `exposure` and `meta`. Optional `markupMode`, `priceId`, `customPrice`, `engine: "rules"` |
| `POST /api/validate-evidence` | `{ fields, verification_status }` → Annex VI validation |
| `POST /api/calculate-ramp` | `{ quantity, sector, country?, declaredEmissions?, priceId?, customPrice?, markupMode? }` → 2026–2034 ramp |

## Reference numbers (Bharat Steel Ltd: 1,200 t, India default 2.20, declared 1.90, Q1 2026 €75.36)

| | Default | Actual | Savings |
|---|---|---|---|
| 2026 (2.5%, +10%) | €5,471.14 | €4,295.52 | €1,175.62 |
| 2034, Fixed +10% Baseline | €218,845.44 | €171,820.80 | €47,024.64 |
| 2034, Statutory +30% | €258,635.52 | €171,820.80 | €86,814.72 |

Supplier risk: **100/100 High Risk** (8 of 12 Annex VI fields missing, internal declaration only).

Steel country default values are illustrative baselines for the CN 7208 pilot. Check them against the official Commission default value tables before relying on them for compliance.
