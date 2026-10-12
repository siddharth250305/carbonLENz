---
id: cbam.phase_in_schedule
title: CBAM 2026–2034 Phase-In, Default Markups, Certificate Prices & De Minimis
type: regulatory_constants
version: 1.0.0
last_reviewed: "2026-10-12"
jurisdiction: EU
sources:
  - id: reg_2023_956
    title: Regulation (EU) 2023/956 (CBAM Regulation), Annex IV phase-in
    url: https://eur-lex.europa.eu/eli/reg/2023/956/oj
  - id: impl_reg_2025_2621
    title: Implementing Regulation (EU) 2025/2621 (default values & markups)
    url: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en
  - id: reg_2025_2083
    title: Regulation (EU) 2025/2083 (CBAM Omnibus simplification)
    url: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en
  - id: ec_certificate_prices
    title: European Commission — Price of CBAM certificates
    url: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en

# Share of embedded emissions for which CBAM certificates must be surrendered.
phase_in_factors:
  2026: 0.025
  2027: 0.050
  2028: 0.100
  2029: 0.225
  2030: 0.485
  2031: 0.610
  2032: 0.735
  2033: 0.860
  2034: 1.000

# Markup applied on top of EU default values when actual verified data is not used.
# The last listed year applies to every later year.
default_markup:
  statutory:
    2026: 0.10
    2027: 0.20
    2028: 0.30
  sector_overrides:
    fertilisers: 0.01

markup_modes:
  fixed:
    label: Fixed +10% Baseline
    description: Holds the 2026 markup constant across 2026–2034 for a like-for-like comparison.
  statutory:
    label: Statutory Escalating Markup (+10% / +20% / +30%)
    description: Applies the year-by-year markup from Implementing Regulation (EU) 2025/2621.
default_markup_mode: fixed

certificate_prices:
  - id: 2026-Q1
    label: Q1 2026
    eur_per_tco2: 75.36
    published: "2026-04-07"
    source: ec_certificate_prices
  - id: 2026-Q2
    label: Q2 2026
    eur_per_tco2: 75.28
    published: "2026-07"
    source: ec_certificate_prices
default_price_id: 2026-Q1

de_minimis:
  threshold_tonnes: 50
  basis: cumulative net mass of CBAM goods imported per importer per calendar year
  excluded_sectors: [hydrogen, electricity]
  source: reg_2025_2083

obligations:
  annual_declaration_deadline: 30 September of the following year (first due 30 September 2027)
  quarterly_certificate_holding: 0.50
  materiality_threshold: 0.05
---

# CBAM Phase-In Schedule, Default Markups & Certificate Prices

## Phase-in (Regulation (EU) 2023/956, Annex IV)
From 2026, CBAM certificate obligations follow the phase-out of free allocation under the EU ETS. An importer surrenders certificates for only a **share** of embedded emissions, rising from **2.5% in 2026 to 100% in 2034**.

| Year | Factor |
|---|---|
| 2026 | 2.5% |
| 2027 | 5.0% |
| 2028 | 10.0% |
| 2029 | 22.5% |
| 2030 | 48.5% |
| 2031 | 61.0% |
| 2032 | 73.5% |
| 2033 | 86.0% |
| 2034 | 100.0% |

## Default value markups (Implementing Regulation (EU) 2025/2621)
If an importer cannot use verified actual emissions, it must use EU default values plus a markup:
- **2026:** +10%
- **2027:** +20%
- **2028 onward:** +30%
- **Fertilisers:** flat +1% in every year

CarbonLenz supports two scenario modes:
- **Fixed +10% Baseline:** holds the 2026 markup constant, for like-for-like comparisons in pitch and benchmark material.
- **Statutory Escalating Markup:** applies the year-by-year legal markup.

## Certificate price
CBAM certificates are priced from the EU ETS auction average and published by the Commission:
- **Q1 2026:** €75.36 / tCO₂ (published 7 April 2026)
- **Q2 2026:** €75.28 / tCO₂ (published July 2026)

New quarterly prices are added to `certificate_prices` above.

## De minimis exemption (Regulation (EU) 2025/2083)
An importer whose **cumulative** imports of CBAM goods stay at or below **50 tonnes per calendar year** is exempt. Hydrogen and electricity are excluded from the exemption. Because the threshold is cumulative per importer, a single shipment under 50 t does not by itself prove exemption.

## Other obligations
- Annual CBAM declaration due **30 September** of the following year (first due 30 September 2027).
- From 2027, authorised declarants must hold certificates covering at least **50%** of embedded emissions at the end of each quarter.
- **5%** materiality threshold per CN code for verification (Delegated Regulation (EU) 2025/2551).

## Cost formulas
```text
default_emission_intensity = EU_default_value × (1 + default_markup)
default_cost = quantity_tonnes × default_emission_intensity × phase_in_factor × certificate_price
actual_cost  = quantity_tonnes × supplier_declared_emissions × phase_in_factor × certificate_price
saving       = default_cost − actual_cost
```
