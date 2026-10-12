import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constants, calculateCBAMExposure } from '../server/cbamRules.js';
import { markupFor } from '../shared/cbamEngine.js';

const bharat = { quantity: 1200, sector: 'steel', country: 'India', declaredEmissions: 1.9 };
const row = (result, year) => result.rows.find((r) => r.year === year);

test('knowledge base loads the authoritative constants', () => {
  assert.equal(constants.phaseIn[2026], 0.025);
  assert.equal(constants.phaseIn[2034], 1.0);
  assert.equal(constants.years.length, 9);
  assert.equal(constants.certificatePrices.find((p) => p.id === '2026-Q1').eurPerTco2, 75.36);
  assert.equal(constants.certificatePrices.find((p) => p.id === '2026-Q2').eurPerTco2, 75.28);
  assert.equal(constants.defaultPriceId, '2026-Q1');
  assert.equal(constants.defaultMarkupMode, 'fixed');
  assert.deepEqual(constants.sectors.steel.countryDefaults, { India: 2.2, China: 2.1, Turkey: 0.9 });
  assert.equal(constants.sectors.steel.routes.bf_bof.benchmark, 1.37);
  assert.equal(constants.annexVi.fields.length, 12);
});

test('markup modes: fixed holds +10%, statutory escalates, fertilisers flat +1%', () => {
  const m = (year, sector, markupMode) => markupFor(constants, { year, sector, markupMode });
  assert.equal(m(2034, 'steel', 'fixed'), 0.1);
  assert.equal(m(2026, 'steel', 'statutory'), 0.1);
  assert.equal(m(2027, 'steel', 'statutory'), 0.2);
  assert.equal(m(2028, 'steel', 'statutory'), 0.3);
  assert.equal(m(2034, 'steel', 'statutory'), 0.3);
  assert.equal(m(2030, 'fertilisers', 'statutory'), 0.01);
});

test('Bharat Steel, fixed +10% baseline at Q1 2026 price (€75.36)', () => {
  const r = calculateCBAMExposure(bharat);
  assert.equal(r.certificatePrice.eurPerTco2, 75.36);
  assert.equal(row(r, 2026).defaultCostEur, 5471.14);
  assert.equal(row(r, 2026).actualCostEur, 4295.52);
  assert.equal(row(r, 2026).savingsEur, 1175.62);
  assert.equal(row(r, 2034).defaultCostEur, 218845.44);
  assert.equal(row(r, 2034).actualCostEur, 171820.8);
  assert.equal(row(r, 2034).savingsEur, 47024.64);
});

test('Bharat Steel, statutory escalating markup reaches +30% from 2028', () => {
  const r = calculateCBAMExposure({ ...bharat, markupMode: 'statutory' });
  assert.equal(row(r, 2026).defaultCostEur, 5471.14);
  assert.equal(row(r, 2034).defaultCostEur, 258635.52);
  assert.equal(row(r, 2034).savingsEur, 86814.72);
});

test('cumulative 9-year totals equal the sum of the rows', () => {
  const r = calculateCBAMExposure(bharat);
  const sum = r.rows.reduce((a, x) => a + x.savingsEur, 0);
  assert.ok(Math.abs(r.totals.savingsEur - sum) < 0.01);
  assert.ok(r.totals.defaultCostEur > r.totals.actualCostEur);
});

test('Q2 2026 and custom certificate prices', () => {
  assert.equal(row(calculateCBAMExposure({ ...bharat, priceId: '2026-Q2' }), 2034).actualCostEur, 171638.4);
  assert.equal(row(calculateCBAMExposure({ ...bharat, priceId: 'custom', customPrice: 100 }), 2034).actualCostEur, 228000);
  assert.throws(() => calculateCBAMExposure({ ...bharat, priceId: 'custom', customPrice: 0 }));
});

test('country defaults and fallback', () => {
  assert.equal(calculateCBAMExposure({ ...bharat, country: 'Turkey' }).defaultValue.value, 0.9);
  assert.equal(calculateCBAMExposure({ ...bharat, country: 'Brazil' }).defaultValue.value, 2.2);
  assert.equal(calculateCBAMExposure({ ...bharat, sector: 'aluminium', declaredEmissions: 4.5 }).defaultValue.value, 6.8);
});

test('50-tonne de minimis check', () => {
  assert.equal(calculateCBAMExposure(bharat).deMinimis.aboveThreshold, true);
  const small = calculateCBAMExposure({ ...bharat, quantity: 50 }).deMinimis;
  assert.equal(small.aboveThreshold, false);
  assert.equal(small.exemptIfOnlyImport, true);
});
