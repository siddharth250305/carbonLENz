// Deterministic CBAM cost engine. Pure functions, no I/O: used by both server and browser.
// All constants come from the OKF knowledge base via buildConstants() in ./okf.js.

export const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

/**
 * Default-value markup for a year.
 * 'statutory' follows the year-by-year schedule (last listed year applies onward);
 * 'fixed' holds the first-year (2026) markup constant across the ramp.
 * Sector overrides (fertilisers: flat +1%) apply in both modes.
 */
export function markupFor(constants, { year, sector, markupMode }) {
  const override = constants.markup.sectorOverrides[sector];
  if (override != null) return override;

  const schedule = constants.markup.statutory;
  const listed = Object.keys(schedule).map(Number).sort((a, b) => a - b);
  const lookupYear = markupMode === 'statutory' ? year : listed[0];
  let markup = schedule[listed[0]];
  for (const y of listed) if (y <= lookupYear) markup = schedule[y];
  return markup;
}

/** EU default value (tCO2e/t, before markup) for a sector and origin country. */
export function resolveDefaultValue(constants, { sector, country }) {
  const s = constants.sectors[sector];
  if (!s) throw new Error(`Unknown sector: ${sector}`);
  const countryValue = country ? s.countryDefaults[country] : undefined;
  return {
    value: countryValue ?? s.fallbackDefault,
    basis: countryValue != null ? `${country} default` : `${s.label} fallback default`,
    status: s.defaultValueStatus,
  };
}

/** Certificate price in EUR/tCO2 for a quarter id, or a custom price when priceId === 'custom'. */
export function resolveCertificatePrice(constants, { priceId, customPrice }) {
  if (priceId === 'custom') {
    const p = Number(customPrice);
    if (!Number.isFinite(p) || p <= 0) throw new Error('Custom certificate price must be a positive number');
    return { id: 'custom', label: 'Custom', eurPerTco2: p };
  }
  const id = priceId || constants.defaultPriceId;
  const price = constants.certificatePrices.find((p) => p.id === id);
  if (!price) throw new Error(`Unknown certificate price id: ${id}`);
  return price;
}

export function deMinimisCheck(constants, { quantityTonnes, sector }) {
  const { thresholdTonnes, excludedSectors } = constants.deMinimis;
  const applicable = !excludedSectors.includes(sector);
  return {
    thresholdTonnes,
    applicable,
    aboveThreshold: quantityTonnes > thresholdTonnes,
    // Threshold is cumulative per importer per year, so this only reflects the quantity given.
    exemptIfOnlyImport: applicable && quantityTonnes <= thresholdTonnes,
  };
}

/**
 * Full 2026–2034 exposure ramp.
 * Amounts are rounded to cents; intensities keep full precision.
 */
export function calculateRamp(constants, {
  quantityTonnes,
  sector,
  country,
  declaredEmissions,
  certificatePrice,
  markupMode = constants.defaultMarkupMode,
}) {
  const quantity = Number(quantityTonnes);
  const declared = Number(declaredEmissions);
  const price = Number(certificatePrice);
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('quantityTonnes must be a non-negative number');
  if (!Number.isFinite(declared) || declared < 0) throw new Error('declaredEmissions must be a non-negative number');
  if (!Number.isFinite(price) || price <= 0) throw new Error('certificatePrice must be a positive number');

  const defaultValue = resolveDefaultValue(constants, { sector, country });

  const rows = constants.years.map((year) => {
    const phaseInFactor = constants.phaseIn[year];
    const markup = markupFor(constants, { year, sector, markupMode });
    const defaultIntensity = defaultValue.value * (1 + markup);
    const defaultCost = quantity * defaultIntensity * phaseInFactor * price;
    const actualCost = quantity * declared * phaseInFactor * price;
    return {
      year,
      phaseInFactor,
      markup,
      defaultIntensity,
      defaultCostEur: round2(defaultCost),
      actualCostEur: round2(actualCost),
      savingsEur: round2(defaultCost - actualCost),
      savingsPct: defaultCost > 0 ? (defaultCost - actualCost) / defaultCost : 0,
    };
  });

  const sum = (key) => round2(rows.reduce((acc, r) => acc + r[key], 0));

  return {
    inputs: { quantityTonnes: quantity, sector, country, declaredEmissions: declared, certificatePrice: price, markupMode },
    defaultValue,
    rows,
    totals: {
      defaultCostEur: sum('defaultCostEur'),
      actualCostEur: sum('actualCostEur'),
      savingsEur: sum('savingsEur'),
    },
    deMinimis: deMinimisCheck(constants, { quantityTonnes: quantity, sector }),
  };
}
