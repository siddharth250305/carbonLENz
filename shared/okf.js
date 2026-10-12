// Open Knowledge Format (OKF) loader: Markdown files with YAML frontmatter.
// Shared by the Node server (reads files from disk) and the browser (Vite ?raw imports),
// so every CBAM constant has exactly one source: server/knowledge/*.md.
import { parse as parseYaml } from 'yaml';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseOkf(markdown) {
  const match = FRONTMATTER.exec(markdown);
  if (!match) throw new Error('OKF document is missing YAML frontmatter');
  return { meta: parseYaml(match[1]), body: match[2].trim() };
}

function numericKeys(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [Number(k), v]));
}

/**
 * Builds the runtime constants object from the four OKF documents.
 * @param {{ phaseIn: string, steel: string, sectorDefaults: string, annexVi: string }} sources raw Markdown
 */
export function buildConstants(sources) {
  const phaseIn = parseOkf(sources.phaseIn).meta;
  const steel = parseOkf(sources.steel).meta;
  const other = parseOkf(sources.sectorDefaults).meta;
  const annexVi = parseOkf(sources.annexVi).meta;

  const routes = Object.fromEntries(
    Object.entries(steel.production_routes).map(([key, r]) => [
      key,
      { key, label: r.label, aliases: r.aliases, benchmark: r.benchmark },
    ]),
  );

  const sectors = {
    steel: {
      key: 'steel',
      label: steel.sector_label,
      productLabel: steel.product_label,
      cnPrefixes: steel.cn_prefixes,
      keywords: steel.keywords,
      cnCodes: steel.cn_codes,
      routes,
      countryDefaults: steel.country_defaults,
      fallbackDefault: steel.fallback_default,
      demoDeclared: steel.demo_declared_emissions,
      defaultValueStatus: steel.default_value_status,
    },
  };
  for (const [key, s] of Object.entries(other.sectors)) {
    sectors[key] = {
      key,
      label: s.sector_label,
      productLabel: s.product_label,
      cnPrefixes: s.cn_prefixes,
      keywords: s.keywords,
      cnCodes: [],
      routes: {},
      countryDefaults: {},
      fallbackDefault: s.fallback_default,
      demoDeclared: s.demo_declared_emissions,
      defaultValueStatus: other.default_value_status,
    };
  }

  const unsupportedSectors = Object.fromEntries(
    Object.entries(other.unsupported_sectors).map(([key, s]) => [
      key,
      { key, label: s.sector_label, cnPrefixes: s.cn_prefixes, keywords: s.keywords },
    ]),
  );

  return {
    phaseIn: numericKeys(phaseIn.phase_in_factors),
    years: Object.keys(phaseIn.phase_in_factors).map(Number).sort((a, b) => a - b),
    markup: {
      statutory: numericKeys(phaseIn.default_markup.statutory),
      sectorOverrides: phaseIn.default_markup.sector_overrides || {},
    },
    markupModes: phaseIn.markup_modes,
    defaultMarkupMode: phaseIn.default_markup_mode,
    certificatePrices: phaseIn.certificate_prices.map((p) => ({
      id: p.id,
      label: p.label,
      eurPerTco2: p.eur_per_tco2,
      published: p.published,
    })),
    defaultPriceId: phaseIn.default_price_id,
    deMinimis: {
      thresholdTonnes: phaseIn.de_minimis.threshold_tonnes,
      excludedSectors: phaseIn.de_minimis.excluded_sectors,
    },
    obligations: phaseIn.obligations,
    sectors,
    unsupportedSectors,
    annexVi: {
      fields: annexVi.fields,
      riskFactors: annexVi.risk_factors,
      riskBands: annexVi.risk_bands,
      maxScore: annexVi.max_score,
      noDeclaredEmissionsMinScore: annexVi.no_declared_emissions_min_score,
    },
  };
}
