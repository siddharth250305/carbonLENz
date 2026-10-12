---
id: cbam.cn.7208_7212.steel
title: Iron & Steel — Flat-Rolled Products (CN 7208–7212)
type: sector_rules
version: 1.0.0
last_reviewed: "2026-10-12"
sector: steel
sector_label: Iron and steel
product_label: Hot-Rolled Steel Coil (CN 7208)
cn_prefixes: ["72", "73"]
keywords: [steel, iron, coil, hot-rolled, cold-rolled, rebar, slab, billet]
sources:
  - id: impl_reg_2025_2621
    title: Implementing Regulation (EU) 2025/2621 (default values & benchmarks)
    url: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en
  - id: ec_cbam_sectors
    title: European Commission — CBAM sectors
    url: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-sectors_en

cn_codes:
  - code: "7208"
    description: Flat-rolled iron/non-alloy steel, width ≥ 600 mm, hot-rolled, not clad/plated/coated
  - code: "7209"
    description: Flat-rolled iron/non-alloy steel, width ≥ 600 mm, cold-rolled, not clad/plated/coated
  - code: "7210"
    description: Flat-rolled iron/non-alloy steel, width ≥ 600 mm, clad, plated or coated
  - code: "7211"
    description: Flat-rolled iron/non-alloy steel, width < 600 mm, not clad/plated/coated
  - code: "7212"
    description: Flat-rolled iron/non-alloy steel, width < 600 mm, clad, plated or coated

# EU benchmarks (tCO2e per tonne of product).
production_routes:
  bf_bof:
    label: Blast Furnace – Basic Oxygen Furnace (BF-BOF)
    aliases: [bf-bof, bf/bof, blast furnace, basic oxygen]
    benchmark: 1.370
  dri_eaf:
    label: Direct Reduced Iron – Electric Arc Furnace (DRI-EAF)
    aliases: [dri-eaf, dri/eaf, direct reduced iron, direct reduction]
    benchmark: 0.481
  scrap_eaf:
    label: Scrap – Electric Arc Furnace (Scrap-EAF)
    aliases: [scrap-eaf, scrap eaf, electric arc furnace, eaf]
    benchmark: 0.072

# Illustrative default values for CN 7208 (tCO2e / t), used for the steel pilot.
default_value_status: illustrative
country_defaults:
  India: 2.20
  China: 2.10
  Turkey: 0.90
fallback_default: 2.20
demo_declared_emissions: 1.90
---

# Iron & Steel — Flat-Rolled Products (CN 7208–7212)

## Scope
CN headings 7208–7212 cover flat-rolled products of iron or non-alloy steel. **7208** (hot-rolled, width ≥ 600 mm) is the steel pilot product: hot-rolled coil, as in the Bharat Steel Ltd demo.

| CN | Product |
|---|---|
| 7208 | Hot-rolled, width ≥ 600 mm |
| 7209 | Cold-rolled, width ≥ 600 mm |
| 7210 | Clad, plated or coated, width ≥ 600 mm |
| 7211 | Not clad/plated/coated, width < 600 mm |
| 7212 | Clad, plated or coated, width < 600 mm |

## Production routes and EU benchmarks
| Route | Benchmark (tCO₂e/t) |
|---|---|
| BF-BOF (Blast Furnace – Basic Oxygen Furnace) | 1.370 |
| DRI-EAF (Direct Reduced Iron – Electric Arc Furnace) | 0.481 |
| Scrap-EAF | 0.072 |

## Country default values (illustrative)
Used when the supplier provides no verified actual emissions data. These baseline values are illustrative for the CN 7208 pilot. Check them against the official default value tables before relying on them for compliance.

| Country | Default (tCO₂e/t) |
|---|---|
| India | 2.20 |
| China | 2.10 |
| Turkey | 0.90 |

Countries without a listed value fall back to **2.20 tCO₂e/t**.
