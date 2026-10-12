---
id: cbam.annex_vi.verification
title: Annex VI Verification Evidence Checklist & Supplier Risk Model
type: validation_rules
version: 1.0.0
last_reviewed: "2026-10-12"
sources:
  - id: del_reg_2025_2551
    title: Delegated Regulation (EU) 2025/2551 (verification & accreditation)
    url: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-verification_en
  - id: reg_2023_956_annex_vi
    title: Regulation (EU) 2023/956, Annex VI (verification principles)
    url: https://eur-lex.europa.eu/eli/reg/2023/956/oj

# The 12 mandatory evidence fields checked in a supplier emissions declaration.
fields:
  - key: supplier_name
    label: Supplier / operator name
    group: identity
    action: Confirm the legal name of the producing operator.
  - key: product_description
    label: Product description
    group: identity
    action: Provide a product description that matches the CN code declared at import.
  - key: quantity_tonnes
    label: Quantity (tonnes)
    group: identity
    action: State the net mass of goods covered by the declaration.
  - key: declared_emissions
    label: Declared specific embedded emissions (tCO₂e/t)
    group: emissions
    action: Provide specific embedded emissions per tonne of product. Without them, EU default values apply.
  - key: verifier_name
    label: Third-party verifier name
    group: verification
    action: Request an EU-accredited third-party verification report (ISO 14064-3 / Delegated Reg. (EU) 2025/2551).
  - key: accreditation_number
    label: Verifier accreditation number
    group: verification
    action: Obtain the verifier's accreditation certificate number.
  - key: accrediting_body
    label: Accrediting body
    group: verification
    action: Confirm the national accreditation body (EA member or recognised equivalent) that accredited the verifier.
  - key: installation_id
    label: Installation ID
    group: installation
    action: Provide the installation ID registered in the CBAM Registry, with the plant address.
  - key: methodology
    label: Monitoring / calculation methodology
    group: emissions
    action: Document the monitoring methodology (calculation- or measurement-based) and the system boundaries used.
  - key: direct_indirect_split
    label: Direct vs. indirect emissions split
    group: emissions
    action: Provide the direct and indirect emissions split, including electricity consumption and emission factor.
  - key: reporting_period
    label: Reporting period
    group: verification
    action: State the reporting period (production dates) the emissions data covers.
  - key: site_visit_date
    label: Verifier site visit date
    group: verification
    action: Provide the date of the verifier's physical site visit to the installation.

# Points added to the Supplier Risk Score (capped at max_score).
# A factor triggers when ANY of its fields is missing, or when its condition holds.
risk_factors:
  - id: missing_verifier
    label: Missing third-party verifier name
    fields: [verifier_name]
    points: 25
  - id: missing_methodology
    label: Missing calculation methodology
    fields: [methodology]
    points: 20
  - id: missing_installation_id
    label: Missing factory installation ID
    fields: [installation_id]
    points: 20
  - id: missing_direct_indirect_split
    label: Missing direct vs. indirect emissions split
    fields: [direct_indirect_split]
    points: 15
  - id: unverified_declaration
    label: Internal declaration only (unverified)
    condition: verification_status_not_third_party
    points: 10
    action: Replace the internal supplier declaration with an independently verified emissions report.
  - id: missing_accreditation
    label: Missing verifier accreditation number
    fields: [accreditation_number]
    points: 10
  - id: missing_reporting_evidence
    label: Missing reporting period / site visit date
    fields: [reporting_period, site_visit_date]
    points: 5

# CarbonLenz rule: without declared emissions, the importer has no actual value to use at all.
no_declared_emissions_min_score: 51
max_score: 100

risk_bands:
  - max: 20
    level: low
    label: Low risk
    status: Verified, compliant
    summary: Actual embedded emissions may be declared. Retain the verification report for audit.
  - max: 50
    level: medium
    label: Medium risk
    status: Incomplete evidence
    summary: Remediation required before actual embedded emissions may be declared.
  - max: 100
    level: high
    label: High risk
    status: Non-compliant
    summary: EU default values plus markup apply until verified evidence is supplied.
---

# Annex VI Verification Evidence Checklist & Supplier Risk Model

## Purpose
In the CBAM definitive regime, an importer can use a supplier's **actual** embedded emissions only if they are verified by an accredited verifier. Otherwise the importer must use **EU default values plus a markup**. This checklist decides whether a supplier declaration carries enough evidence to be accepted.

## The 12 evidence fields
| # | Field | Group |
|---|---|---|
| 1 | Supplier / operator name | Identity |
| 2 | Product description | Identity |
| 3 | Quantity (tonnes) | Identity |
| 4 | Declared specific embedded emissions | Emissions |
| 5 | Third-party verifier name | Verification |
| 6 | Verifier accreditation number | Verification |
| 7 | Accrediting body | Verification |
| 8 | Installation ID | Installation |
| 9 | Monitoring / calculation methodology | Emissions |
| 10 | Direct vs. indirect emissions split | Emissions |
| 11 | Reporting period | Verification |
| 12 | Verifier site visit date | Verification |

## Supplier Risk Score (0–100)
| Risk factor | Points |
|---|---|
| Missing third-party verifier name | +25 |
| Missing calculation methodology | +20 |
| Missing factory installation ID | +20 |
| Missing direct vs. indirect emissions split | +15 |
| Internal declaration only (unverified) | +10 |
| Missing verifier accreditation number | +10 |
| Missing reporting period / site visit date | +5 |

The score is capped at **100**. If no declared emissions value is present, the score is at least **51 (High Risk)**, because no actual value is available to use.

| Score | Category | Meaning |
|---|---|---|
| 0–20 | Low Risk | Verified & compliant: actual emissions accepted |
| 21–50 | Medium Risk | Incomplete evidence: audit remediation required |
| 51–100 | High Risk | Non-compliant: importer forced onto EU default values |

## Worked example: Bharat Steel Ltd
The declaration gives supplier, product, quantity and declared emissions, but is an internal declaration only. Score: 25 + 20 + 20 + 15 + 10 + 10 + 5 = 105, capped at **100 (High Risk)**.
