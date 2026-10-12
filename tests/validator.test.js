import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence, VERIFICATION_STATUS } from '../server/validator.js';

const bharatFields = {
  supplier_name: 'Bharat Steel Ltd',
  product_description: 'Hot-rolled steel coil',
  quantity_tonnes: 1200,
  declared_emissions: 1.9,
  verifier_name: null,
  accreditation_number: null,
  accrediting_body: null,
  installation_id: null,
  methodology: null,
  direct_indirect_split: null,
  reporting_period: null,
  site_visit_date: null,
};

const fullyVerified = {
  ...bharatFields,
  verifier_name: 'TÜV Example GmbH',
  accreditation_number: 'D-VS-12345-01-00',
  accrediting_body: 'DAkkS',
  installation_id: 'IN-INST-000123',
  methodology: 'Calculation-based, Impl. Reg. 2025/2547 Annex II',
  direct_indirect_split: 'Direct 1.62 / Indirect 0.28',
  reporting_period: '2026-01-01 to 2026-06-30',
  site_visit_date: '2026-07-14',
};

test('Bharat Steel demo scores 100/100 High Risk with the 8 expected missing fields', () => {
  const r = validateEvidence({ fields: bharatFields, verification_status: VERIFICATION_STATUS.INTERNAL });
  assert.equal(r.risk_score, 100);
  assert.equal(r.risk_level, 'high');
  assert.equal(r.risk_category, 'High risk');
  assert.equal(r.actual_emissions_accepted, false);
  assert.deepEqual(r.present_fields, ['supplier_name', 'product_description', 'quantity_tonnes', 'declared_emissions']);
  assert.deepEqual(r.missing_fields, [
    'verifier_name', 'accreditation_number', 'accrediting_body', 'installation_id',
    'methodology', 'direct_indirect_split', 'reporting_period', 'site_visit_date',
  ]);
  assert.equal(r.checklist.length, 12);
  assert.equal(r.recommended_actions[0].field, 'verifier_name');
  assert.match(r.recommended_actions[0].action, /accredited third-party verification/);
});

test('fully verified evidence is Low Risk and actual emissions are accepted', () => {
  const r = validateEvidence({ fields: fullyVerified, verification_status: VERIFICATION_STATUS.THIRD_PARTY });
  assert.equal(r.risk_score, 0);
  assert.equal(r.risk_level, 'low');
  assert.equal(r.actual_emissions_accepted, true);
  assert.equal(r.recommended_actions.length, 0);
});

test('band boundaries: 20 low, 25 medium, 51+ high', () => {
  // Missing direct/indirect split (15) + reporting period (5) = 20 → Low
  let r = validateEvidence({
    fields: { ...fullyVerified, direct_indirect_split: null, reporting_period: null },
    verification_status: VERIFICATION_STATUS.THIRD_PARTY,
  });
  assert.equal(r.risk_score, 20);
  assert.equal(r.risk_level, 'low');

  // Missing verifier name only (25) → Medium
  r = validateEvidence({ fields: { ...fullyVerified, verifier_name: null }, verification_status: VERIFICATION_STATUS.THIRD_PARTY });
  assert.equal(r.risk_score, 25);
  assert.equal(r.risk_level, 'medium');
});

test('missing declared emissions forces at least High Risk', () => {
  const r = validateEvidence({ fields: { ...fullyVerified, declared_emissions: null }, verification_status: VERIFICATION_STATUS.THIRD_PARTY });
  assert.equal(r.risk_score, 51);
  assert.equal(r.risk_level, 'high');
  assert.equal(r.recommended_actions[0].field, 'declared_emissions');
});
