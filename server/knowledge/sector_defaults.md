---
id: cbam.sector_defaults.other
title: Illustrative Default Values — Aluminium, Cement, Fertilisers
type: sector_rules
version: 1.0.0
last_reviewed: "2026-10-12"
default_value_status: illustrative
sectors:
  aluminium:
    sector_label: Aluminium
    product_label: Unwrought Aluminium (CN 7601)
    cn_prefixes: ["76"]
    keywords: [aluminium, aluminum]
    fallback_default: 6.80
    demo_declared_emissions: 4.50
  cement:
    sector_label: Cement
    product_label: Portland Cement (CN 2523)
    cn_prefixes: ["2507", "2523"]
    keywords: [cement, clinker]
    fallback_default: 0.85
    demo_declared_emissions: 0.65
  fertilisers:
    sector_label: Fertilisers
    product_label: Urea Fertilisers (CN 3102)
    cn_prefixes: ["2808", "2814", "2834", "3102", "3105"]
    keywords: [fertiliser, fertilizer, urea, ammonia, nitric acid, ammonium nitrate]
    fallback_default: 2.10
    demo_declared_emissions: 1.40
unsupported_sectors:
  hydrogen:
    sector_label: Hydrogen
    cn_prefixes: ["280410"]
    keywords: [hydrogen]
  electricity:
    sector_label: Electricity
    cn_prefixes: ["2716"]
    keywords: [electricity, power import]
---

# Illustrative Default Values — Aluminium, Cement, Fertilisers

The steel pilot (see `cn_7208_steel.md`) is the main demo. These values let the calculator show the other CBAM goods sectors with one illustrative default per sector. None of them have country-specific values yet.

| Sector | Example CN | Default (tCO₂e/t) | Sample declared |
|---|---|---|---|
| Aluminium | 7601 | 6.80 | 4.50 |
| Cement | 2523 | 0.85 | 0.65 |
| Fertilisers | 3102 | 2.10 | 1.40 |

Fertilisers use a flat +1% default markup in every year (see `phase_in_schedule.md`).

Hydrogen and electricity are CBAM goods, but CarbonLenz does not cost them yet. The scanner flags them as unsupported.
