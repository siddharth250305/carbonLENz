import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractEvidence } from '../server/extractor.js';
import { validateEvidence } from '../server/validator.js';
import { DEMO_DOCUMENT } from '../shared/demoDocument.js';

const rules = (text) => extractEvidence({ text, engine: 'rules' });

test('Bharat Steel demo matches the progress.md §4.1 schema exactly', async () => {
  const { extraction, engine } = await rules(DEMO_DOCUMENT);
  const validation = validateEvidence(extraction);
  assert.equal(engine, 'rules');
  assert.deepEqual(
    {
      supplier: extraction.supplier,
      product: extraction.product,
      cn_code: extraction.cn_code,
      sector: extraction.sector,
      sector_label: extraction.sector_label,
      origin_country: extraction.origin_country,
      quantity_tonnes: extraction.quantity_tonnes,
      declared_emissions: extraction.declared_emissions,
      unit: extraction.unit,
      verification_status: extraction.verification_status,
      present_fields: validation.present_fields,
      missing_fields: validation.missing_fields,
    },
    {
      supplier: 'Bharat Steel Ltd',
      product: 'Hot-rolled steel coil',
      cn_code: '7208 10 00',
      sector: 'steel',
      sector_label: 'Iron and steel',
      origin_country: 'India',
      quantity_tonnes: 1200,
      declared_emissions: 1.9,
      unit: 'tCO2e/t product',
      verification_status: 'internal only',
      present_fields: ['supplier_name', 'product_description', 'quantity_tonnes', 'declared_emissions'],
      missing_fields: [
        'verifier_name', 'accreditation_number', 'accrediting_body', 'installation_id',
        'methodology', 'direct_indirect_split', 'reporting_period', 'site_visit_date',
      ],
    },
  );
  assert.equal(extraction.production_route.key, 'bf_bof');
  assert.equal(validation.risk_score, 100);
});

test('a fully verified declaration with different labels extracts every field', async () => {
  const { extraction } = await rules(`Manufacturer: Anatolia Çelik A.Ş.
Goods: Cold-rolled sheet
CN code: 72091610
Country of origin: Türkiye
Net mass: 450,000 kg
Specific embedded emissions: 850 kgCO2e/t
Direct emissions: 0.71 tCO2e/t
Indirect emissions: 0.14 tCO2e/t
Process route: Scrap-EAF
Monitoring methodology: Calculation-based approach per Impl. Reg. 2025/2547
Installation ID: TR-INST-00987
Reporting period: 2026-01-01 to 2026-06-30
Verification: Third-party verified, reasonable assurance
Verifier: Bureau Example Verification SAS
Accreditation number: 4-0123
Accrediting body: COFRAC
Site visit: 2026-07-20`);
  assert.equal(extraction.supplier, 'Anatolia Çelik A.Ş.');
  assert.equal(extraction.cn_code, '7209 16 10');
  assert.equal(extraction.sector, 'steel');
  assert.equal(extraction.origin_country, 'Turkey');
  assert.equal(extraction.quantity_tonnes, 450);
  assert.equal(extraction.declared_emissions, 0.85);
  assert.equal(extraction.production_route.key, 'scrap_eaf');
  assert.equal(extraction.verification_status, 'third-party verified');
  assert.equal(extraction.fields.direct_indirect_split, 'Direct 0.71 tCO2e/t / Indirect 0.14 tCO2e/t');
  const v = validateEvidence(extraction);
  assert.equal(v.risk_score, 0);
  assert.equal(v.risk_level, 'low');
});

test('free-text email without labels still yields the core fields', async () => {
  const { extraction } = await rules(`Hi team,
As requested, Shree Metals Pvt Ltd shipped 800 tonnes of hot rolled coil (CN 7208 39 00) from India last quarter.
Our internal estimate is 2.05 tCO2e per tonne. This has not yet been verified.
Regards`);
  assert.equal(extraction.supplier, 'Shree Metals Pvt Ltd');
  assert.equal(extraction.cn_code, '7208 39 00');
  assert.equal(extraction.origin_country, 'India');
  assert.equal(extraction.quantity_tonnes, 800);
  assert.equal(extraction.declared_emissions, 2.05);
  assert.equal(extraction.verification_status, 'internal only');
});

test('unsupported and undetectable sectors produce warnings', async () => {
  const h = await rules('Product: Green hydrogen\nQuantity: 20 tonnes');
  assert.equal(h.extraction.sector_supported, false);
  assert.match(h.warnings.join(' '), /not yet costed/);

  const u = await rules('Product: Mystery widgets');
  assert.equal(u.extraction.sector, null);
  assert.match(u.warnings.join(' '), /Could not determine/);
});
