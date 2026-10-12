# CarbonLenz AI — Claude Code Handoff & Build Context (`progess.md` / `progress.md`)

> **Instructions for Claude Code:**
> Read this file first to gain complete context on the product vision, regulatory rules, existing codebase, and remaining MVP modules. **Before writing code, analyze the existing repository and present a clear, step-by-step implementation plan for the remaining features.**

---

## 1. Product Overview (Clean & Concise)

**Product Name:** CarbonLenz AI — CBAM Evidence Scanner & Exposure Platform  
**One-Line Pitch:** CarbonLenz helps EU importers uncover hidden carbon tax liabilities in their supply chain by scanning messy supplier emissions documents, validating compliance against EU CBAM regulations, and forecasting 2026–2034 financial exposure.

### Why It Matters
Under the EU **Carbon Border Adjustment Mechanism (CBAM)** definitive regime (effective Jan 1, 2026), EU importers of carbon-heavy goods (Steel, Aluminium, Cement, Fertilisers, Hydrogen, Electricity) must report embedded CO₂ emissions and surrender CBAM certificates.
- If a supplier provides **verified actual emissions data**, the importer pays only for actual emissions.
- If supplier evidence is **missing, incomplete, or unverified**, the importer is forced to use **EU Default Values** inflated by a punitive markup (+10% in 2026, +20% in 2027, +30% from 2028+).
- **The Ramp:** Certificate obligations phase in from **2.5% in 2026** to **100% in 2034**. A 1,200-tonne steel shipment from India costs **€5,469** in 2026 under defaults, escalating 40× to **€218,765/year** by 2034 (vs. **€171,821** with verified actual data — a **€46,944/year** saving).

### Core End-to-End User Flow
```
[1. Importer Input]
Upload supplier PDF / Paste messy declaration text / Click "Load Bharat Steel Demo"
       │
       ▼
[2. AI Evidence Extraction]
LLM Structured Outputs extracts: Supplier, Product, CN Code, Origin, Quantity,
Declared Emissions (tCO2e/t), Verification Status, Verifier Credentials, Methodology
       │
       ▼
[3. Google OKF Rules & Evidence Validator]
Checks extracted JSON against 12 mandatory EU Annex VI verification fields
──► Outputs: Missing Fields List + Supplier Risk Score (0–100) + Recommended Action
       │
       ▼
[4. Deterministic CBAM Calculator]
Maps product to CN Code & EU Default Value (Impl. Reg. 2025/2621)
Applies Punitive Markup (+10% / +20% / +30%), Certificate Price (€75.36), & 2026–2034 Phase-In
──► Outputs: Default Cost vs. Actual Cost + Annual Savings + 2026–2034 Exposure Ramp
       │
       ▼
[5. Investor / CFO Demo Report]
Interactive Dashboard + Printable 1-Page Executive Compliance Summary
```

---

## 2. What Is Already Built (Current Repository State)

The project uses a **Full-Stack Pure JavaScript (ES Modules)** architecture: **React 18 (Vite)** on the frontend and **Node.js + Express** on the backend.

### Existing File Tree
```
carbon-lens/
├── package.json                      # Dependencies: react, react-dom, recharts, lucide-react, express, cors, vite, tailwindcss
├── index.html                        # App shell with Google Fonts (Outfit & Inter)
├── tailwind.config.js                # Custom dark theme tokens (dark-bg, dark-card, brand-green, brand-cyan, etc.)
├── postcss.config.js                 # PostCSS configuration
├── README.md                         # Full project case study and architectural documentation
├── AI_resume.md                      # User's portfolio resume markdown
├── rules and guidelines 111.pdf      # Reference PDF in workspace
├── src/
│   ├── main.jsx                      # React DOM root mount
│   ├── index.css                     # Global styles, `.glass-card`, and `.metric-card` classes
│   ├── App.jsx                       # Main layout holding shared `quantity` and `sector` state
│   └── components/
│       ├── Header.jsx                # Top navigation bar with brand logo and section links
│       ├── QuickCalculator.jsx       # Interactive slider/dropdown calculator (2026 vs 2034 Default/Actual/Savings)
│       └── ExposureRampChart.jsx     # Recharts AreaChart visualizing 2026–2034 Default vs. Actual cost curves
└── server/
    ├── server.js                     # Express server on port 5001 (`GET /api/health`, `POST /api/calculate-ramp`)
    └── cbamRules.js                  # Deterministic 2026–2034 calculation logic & sector default constants
```

### ⚠️ Environment / Build Note to Fix First
- `package.json` currently has `"tailwindcss": "^4.3.2"` installed alongside a v3-style `postcss.config.js` (`tailwindcss: {}`). Running `vite build` throws a PostCSS plugin error unless either:
  1. `@tailwindcss/postcss` or `@tailwindcss/vite` is used, **OR**
  2. Standard CSS variables / utility classes in `src/index.css` are used without the broken PostCSS plugin, or Tailwind v3 is installed.
- **Action for Claude Code:** Check `postcss.config.js` and `src/index.css` first and ensure `npm run build` and `npm run dev` run cleanly with zero errors.

---

## 3. What Is Left to Build (Remaining MVP Scope)

Focus on making the **Steel Pilot Demo ("Bharat Steel Ltd")** 100% convincing, interactive, and end-to-end functional before expanding to multi-sector automation.

### Module A: Google OKF Knowledge Base (`server/knowledge/`)
Create structured **Open Knowledge Format (OKF)** files (Markdown with YAML frontmatter or structured JSON/YAML knowledge nodes) representing authoritative CBAM rules so the backend and AI layer have a deterministic, auditable source of truth:
1. `cn_7208_steel.md` — CN codes 7208–7212 (Hot-rolled flat steel), production routes (BF-BOF, DRI-EAF, Scrap-EAF), benchmarks, and country defaults (India, China, Turkey).
2. `annex_vi_verification.md` — The 12 mandatory verification fields and risk score weights.
3. `phase_in_schedule.md` — 2026–2034 CBAM factors, default markups (+10%, +20%, +30%), Q1/Q2 2026 certificate prices, and the 50-tonne *de minimis* exemption rule.

### Module B: AI Evidence Extractor & Validator Backend (`server/`)
1. **`POST /api/scan-evidence` endpoint in `server/server.js`:**
   - Accepts raw pasted supplier declaration text, uploaded PDF/text file, or a `"demo"` flag.
   - Uses LLM Structured Outputs (Gemini API / OpenAI API if API key is provided in `.env`, with a **deterministic fallback parser / mock extractor** so the demo works out-of-the-box even without an API key).
   - Returns strict JSON matching the schema below.
2. **Evidence Validator (`server/validator.js`):**
   - Evaluates the extracted JSON against the mandatory Annex VI verification checklist.
   - Computes the **Supplier Risk Score (0–100)** and risk category (`Low Risk`, `Medium Risk`, `High Risk`).
   - Generates prioritized **Recommended Supplier Actions** (e.g., *"Request EU-accredited third-party verification report (ISO 14064 / Impl. Reg. 2025/2551)"*, *"Provide installation ID and direct/indirect emissions split"*).

### Module C: Evidence Scanner UI (`src/components/EvidenceScanner.jsx`)
- **3 Input Modes:**
  1. **Load Demo Document Button:** Pre-fills the exact "Bharat Steel Ltd" messy supplier declaration with one click.
  2. **Paste Text Tab:** Textarea to paste any supplier declaration or email.
  3. **Upload File Tab:** Drag-and-drop PDF / `.txt` file upload zone.
- **"Scan & Validate Evidence" Button:** Calls `/api/scan-evidence`, displays extracted structured fields (Supplier, Product, CN Code, Origin, Quantity, Declared Emissions, Verification Status), and syncs the extracted `quantity`, `sector`, and `declaredEmissions` with the rest of the dashboard!

### Module D: Supplier Risk & Missing Evidence UI (`src/components/SupplierRiskCard.jsx`)
- Displays the **0–100 Risk Score** with color-coded status badge (🟢 0–20 Low, 🟡 21–50 Medium, 🔴 51+ High).
- Displays a visual **Annex VI Evidence Checklist** showing which fields are present (✅) vs. missing (❌).
- Lists the **Recommended Next Actions** for the procurement/compliance team.

### Module E: 2026–2034 Ramp Table & Investor Demo Report (`src/components/RampTable.jsx` & `src/components/InvestorReport.jsx`)
- **Ramp Table:** Clean year-by-year table (2026 to 2034) showing Phase-In %, Default Markup %, Default Cost (€), Actual Cost (€), and Annual Savings (€), plus cumulative 9-year totals.
- **50-Tonne De Minimis Check:** Badge indicating whether the shipment exceeds the 50-tonne annual exemption threshold.
- **One-Page Investor / CFO Report View:** Clean summary card with a **"Print / Export PDF Report"** button (`window.print()` with `@media print` styling).

---

## 4. Authoritative CBAM Reference Data & Exact Specifications

Use these exact verified numbers and schemas in your implementation:

### 4.1 Exact Demo Input & Output Specification ("Bharat Steel Ltd")

**Sample Input Text:**
```text
Supplier: Bharat Steel Ltd
Product: Hot-rolled steel coil (CN 7208 10 00)
Origin: India
Quantity: 1,200 tonnes
Declared emissions: 1.9 tCO2e/t product
Production route: Blast Furnace (BF-BOF)
Verification: Internal supplier declaration only
```

**Expected Extracted JSON Schema:**
```json
{
  "supplier": "Bharat Steel Ltd",
  "product": "Hot-rolled steel coil",
  "cn_code": "7208 10 00",
  "sector": "steel",
  "sector_label": "Iron and steel",
  "origin_country": "India",
  "quantity_tonnes": 1200,
  "declared_emissions": 1.9,
  "unit": "tCO2e/t product",
  "verification_status": "internal only",
  "present_fields": ["supplier_name", "product_description", "quantity_tonnes", "declared_emissions"],
  "missing_fields": [
    "verifier_name",
    "accreditation_number",
    "accrediting_body",
    "installation_id",
    "methodology",
    "direct_indirect_split",
    "reporting_period",
    "site_visit_date"
  ]
}
```

### 4.2 Authoritative Regulatory Constants

| Parameter | Official Value | Legal Source |
|---|---|---|
| **Q1 2026 Certificate Price** | **€75.36 / tCO₂** | EC Publication (7 April 2026), Impl. Reg. 2025/2548 |
| **Q2 2026 Certificate Price** | **€75.28 / tCO₂** | EC Publication (July 2026) |
| **De Minimis Threshold** | **50 tonnes / year** (cumulative mass; excludes H₂ & electricity) | Regulation (EU) 2025/2083 (Omnibus Amendment) |
| **Annual Declaration Deadline** | **30 September** of following year (first due 30 Sep 2027) | Regulation (EU) 2025/2083 (amended from 31 May) |
| **Quarterly Certificate Holding** | **≥ 50%** of cumulative emissions at end of each quarter (from 2027) | Regulation (EU) 2025/2083 (reduced from 80%) |
| **Default Value Markup** | **2026:** +10% \| **2027:** +20% \| **2028+:** +30% (Fertilisers: flat +1%) | Implementing Regulation (EU) 2025/2621 |
| **Steel Benchmarks (EU)** | **BF-BOF:** 1.370 \| **DRI-EAF:** 0.481 \| **Scrap-EAF:** 0.072 tCO₂e/t | Implementing Regulation (EU) 2025/2621 |
| **Demo Steel Default Values** | **India:** 2.20 \| **China:** 2.10 \| **Turkey:** 0.90 tCO₂e/t | Illustrative baseline for CN 7208 |
| **Materiality Threshold** | **5%** per CN code | Delegated Regulation (EU) 2025/2551 & Annex VI |

### 4.3 Phase-In Schedule (Regulation EU 2023/956, Annex IV)
```javascript
export const PHASE_IN_SCHEDULE = {
  2026: 0.025, // 2.5%
  2027: 0.050, // 5.0%
  2028: 0.100, // 10.0%
  2029: 0.225, // 22.5%
  2030: 0.485, // 48.5%
  2031: 0.610, // 61.0%
  2032: 0.735, // 73.5%
  2033: 0.860, // 86.0%
  2034: 1.000, // 100.0%
};
```

### 4.4 Core Calculation Formulas & Reference Numbers
```text
default_emission_intensity = EU_default_value * (1 + default_markup)
default_cost = quantity_tonnes * default_emission_intensity * phase_in_factor * certificate_price
actual_cost  = quantity_tonnes * supplier_declared_emissions * phase_in_factor * certificate_price
saving       = default_cost - actual_cost
```

*Note on worked example numbers (using fixed +10% markup baseline = 2.42 tCO₂e/t across the ramp for consistent comparison, or dynamic annual markup +10%/+20%/+30% — support a toggle or clearly label in the table):*
- **2026 (2.5% factor, +10% markup → 2.42 tCO₂e/t):**
  - Default Cost: `1,200 × 2.42 × 0.025 × 75.36 = €5,469.12`
  - Actual Cost: `1,200 × 1.90 × 0.025 × 75.36 = €4,295.76`
  - Saving: `€1,173.36` (21.5% reduction)
- **2034 (100% factor):**
  - At 2.42 tCO₂e/t (+10% baseline): Default = `€218,764.80`, Actual = `€171,820.80`, Saving = `€46,944.00`
  - At 2.86 tCO₂e/t (+30% 2028+ markup): Default = `€258,547.20`, Actual = `€171,820.80`, Saving = `€86,726.40`

### 4.5 Supplier Risk Scoring Model (Annex VI Validator)
| Missing / Risk Factor | Field Key | Weight (Points) |
|---|---|---|
| Missing third-party verifier name | `verifier_name` | +25 |
| Missing calculation methodology | `methodology` | +20 |
| Missing factory installation ID | `installation_id` | +20 |
| Missing direct vs. indirect emissions split | `direct_indirect_split` | +15 |
| Internal declaration only (unverified) | `verification_status` | +10 |
| Missing verifier accreditation number | `accreditation_number` | +10 |
| Missing reporting period / site visit date | `reporting_period` | +5 (capped at 100) |

- **0–20:** 🟢 Low Risk (Verified & Compliant — Actual emissions accepted)
- **21–50:** 🟡 Medium Risk (Incomplete Evidence — Audit remediation required)
- **51–100:** 🔴 High Risk (Non-Compliant — Importer forced onto punitive EU Default Values)

*(Note: For the Bharat Steel Ltd demo, missing verifier (+25), methodology (+20), installation ID (+20), direct/indirect split (+15), internal only (+10), accreditation (+10) = **100 / 100 High Risk 🔴**).*

---

## 5. Additional Resources & Links

- **EC CBAM Official Portal:** `https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en`
- **EC CBAM Sectors Guidance:** `https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-sectors_en`
- **EC Legislation, Default Values & Templates:** `https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en`
- **EC Certificate Prices:** `https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en`
- **EC Verification Rules:** `https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-verification_en`
- **Regulation (EU) 2023/956 (EUR-Lex):** `https://eur-lex.europa.eu/eli/reg/2023/956/oj`

---

## 6. How Claude Code Should Proceed

1. **Inspect & Plan:** Review the existing files in `src/` and `server/`, and present a concise implementation plan to the user.
2. **Fix Build/CSS Setup:** Ensure Tailwind CSS / PostCSS in `postcss.config.js` and `src/index.css` builds cleanly via `npm run build`.
3. **Build Backend & OKF Layer:** Create the OKF knowledge files in `server/knowledge/` and add the `/api/scan-evidence` and validation endpoints in `server/`.
4. **Build Frontend Modules:** Implement `EvidenceScanner.jsx`, `SupplierRiskCard.jsx`, `RampTable.jsx`, and `InvestorReport.jsx`, and wire them into `App.jsx`.
5. **Verify End-to-End:** Test both the Express backend and Vite frontend to confirm the "Bharat Steel Ltd" demo flow works seamlessly from scan to report.
