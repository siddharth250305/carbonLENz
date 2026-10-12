// AI evidence extractor: turns a messy supplier emissions declaration into structured CBAM evidence.
// Engines, in priority order: Gemini (GEMINI_API_KEY) → OpenAI (OPENAI_API_KEY) → deterministic rules.
// The rules engine needs no key, so the demo always works; it is also the fallback if an LLM call fails.
import { constants } from './knowledge/index.js';
import { VERIFICATION_STATUS } from './validator.js';

const LLM_TIMEOUT_MS = 25_000;

// Raw fields every engine returns (all nullable).
const RAW_FIELDS = {
  supplier_name: 'string',
  product_description: 'string',
  cn_code: 'string',
  origin_country: 'string',
  quantity_tonnes: 'number',
  declared_emissions: 'number',
  production_route: 'string',
  verification_statement: 'string',
  verifier_name: 'string',
  accreditation_number: 'string',
  accrediting_body: 'string',
  installation_id: 'string',
  methodology: 'string',
  direct_indirect_split: 'string',
  reporting_period: 'string',
  site_visit_date: 'string',
};

// Free-text fields an LLM must copy from the document; values not found in the source are dropped.
const GROUNDED_FIELDS = ['verifier_name', 'accreditation_number', 'accrediting_body', 'installation_id', 'site_visit_date'];

const FIELD_HINTS = {
  quantity_tonnes: 'Net mass in metric tonnes (convert kg to tonnes).',
  declared_emissions: 'Specific embedded emissions in tCO2e per tonne of product (convert kgCO2e/t to tCO2e/t).',
  cn_code: 'Combined Nomenclature code digits as written, e.g. "7208 10 00".',
  production_route: 'Production route as written, e.g. "Blast Furnace (BF-BOF)".',
  verification_statement: 'The sentence describing how the emissions data was verified, verbatim.',
  verifier_name: 'Name of an independent third-party verification body. Null if the data is only an internal/self declaration.',
  direct_indirect_split: 'Direct and indirect emissions values if both are stated, e.g. "Direct 1.62 / Indirect 0.28".',
};

const SYSTEM_PROMPT = `You extract structured evidence from supplier emissions declarations for the EU Carbon Border Adjustment Mechanism (CBAM).
Rules:
- Copy values exactly as stated in the document. Never invent, infer or guess a value.
- Return null for any field that is not explicitly stated.
- An internal or self declaration by the supplier is NOT a third-party verifier: leave verifier_name null in that case.
- Numbers must be plain numbers without units or thousands separators.`;

// ---------- Deterministic rules engine ----------

const LABEL_RULES = [
  ['verifier_name', /(third[- ]party\s+)?verifier(\s+name)?$|verification body|verified by|verifying (body|organi[sz]ation)/],
  ['accreditation_number', /accreditation\s*(no\.?|number|#|id|certificate|ref)/],
  ['accrediting_body', /accredit(ing|ation) body|accredited by|national accreditation/],
  ['site_visit_date', /site visit/],
  ['verification_statement', /verification|assurance/],
  ['installation_id', /installation|plant id|facility id|site id/],
  ['direct_indirect_split', /direct.*indirect|indirect.*direct|emissions split/],
  ['_indirect', /indirect emissions?/],
  ['_direct', /direct emissions?/],
  ['methodology', /methodolog|monitoring (method|approach|plan)|calculation (method|approach|basis)/],
  ['reporting_period', /reporting (period|year)|period covered|production period/],
  ['production_route', /production route|process route|^route$|production process/],
  ['declared_emissions', /emission|intensity|embedded|carbon footprint|\bsee\b|co2/],
  ['quantity_tonnes', /quantity|volume|tonnage|net mass|weight|amount/],
  ['origin_country', /origin|country/],
  ['cn_code', /^cn( code)?$|commodity code|hs code|tariff code/],
  ['product_description', /\bproduct\b|goods|item|description|material/],
  ['supplier_name', /supplier|company|manufacturer|producer|operator|exporter|seller|mill/],
];

const LINE = /^\s*[-*•]?\s*([^:\n]{2,60}?)\s*(?::|\s[-–—]\s)\s*(.+?)\s*$/;

const COUNTRY_ALIASES = {
  'türkiye': 'Turkey', turkiye: 'Turkey', 'republic of turkey': 'Turkey',
  prc: 'China', "people's republic of china": 'China',
  'republic of india': 'India', bharat: 'India',
  'south korea': 'South Korea', korea: 'South Korea', 'republic of korea': 'South Korea',
  uae: 'United Arab Emirates', 'viet nam': 'Vietnam',
};
const KNOWN_COUNTRIES = [
  'India', 'China', 'Turkey', 'Türkiye', 'Vietnam', 'Ukraine', 'Brazil', 'South Korea', 'Russia', 'Egypt',
  'Indonesia', 'Taiwan', 'Japan', 'Kazakhstan', 'South Africa', 'Malaysia', 'Thailand', 'Saudi Arabia',
  'Mexico', 'United Arab Emirates', 'Serbia', 'Norway', 'United Kingdom', 'United States',
];

function parseNumber(value) {
  const m = /-?\d[\d,]*(?:\.\d+)?/.exec(String(value));
  return m ? Number(m[0].replace(/,/g, '')) : null;
}

function parseQuantity(value) {
  const n = parseNumber(value);
  if (n == null) return null;
  return /\bkg\b|kilogram/i.test(value) ? n / 1000 : n;
}

function parseEmissions(value) {
  const n = parseNumber(value);
  if (n == null) return null;
  return /kg\s*co2/i.test(value) ? n / 1000 : n;
}

const CN_IN_TEXT = /\bCN(?:\s*code)?\s*[:#]?\s*(\d{4}(?:\s?\d{2}){0,2})\b/i;

function rulesExtract(text) {
  const raw = Object.fromEntries(Object.keys(RAW_FIELDS).map((k) => [k, null]));
  const set = (key, value) => {
    if (raw[key] == null && value != null && value !== '') raw[key] = value;
  };
  let direct = null;
  let indirect = null;

  for (const line of text.split(/\r?\n/)) {
    const m = LINE.exec(line);
    if (!m) continue;
    const label = m[1].toLowerCase().trim();
    const value = m[2].trim();
    const rule = LABEL_RULES.find(([, re]) => re.test(label));
    if (!rule) continue;
    const [key] = rule;

    if (key === '_direct') direct ??= value;
    else if (key === '_indirect') indirect ??= value;
    else if (key === 'quantity_tonnes') set(key, parseQuantity(value));
    else if (key === 'declared_emissions') set(key, parseEmissions(value));
    else if (key === 'product_description') {
      const cn = CN_IN_TEXT.exec(value);
      if (cn) set('cn_code', cn[1]);
      set(key, value.replace(/\s*\((?:[^)]*\bCN\b[^)]*)\)\s*/i, ' ').trim());
    } else set(key, value);
  }

  // Free-text fallbacks for emails and unlabeled prose.
  if (raw.cn_code == null) {
    const cn = CN_IN_TEXT.exec(text) || /\b((?:72|73|76)\d{2}|2523|2507|2808|2814|2834|3102|3105|2716)\s?(\d{2})\s?(\d{2})\b/.exec(text);
    if (cn) set('cn_code', cn[2] ? `${cn[1]} ${cn[2]} ${cn[3]}` : cn[1]);
  }
  if (raw.quantity_tonnes == null) {
    const q = /(\d[\d,]*(?:\.\d+)?)\s*(tonnes|tons|metric tons|mt|t|kg)\b/i.exec(text);
    if (q) set('quantity_tonnes', parseQuantity(q[0]));
  }
  if (raw.declared_emissions == null) {
    const e = /(\d+(?:\.\d+)?)\s*(t|kg)\s*CO2e?\s*(?:\/|per)\s*(?:t|tonne)\b/i.exec(text);
    if (e) set('declared_emissions', parseEmissions(e[0]));
  }
  if (raw.origin_country == null) {
    const o = /(?:made in|produced in|manufactured in|origin(?: is)?|from)\s+([A-Z][a-zü]+(?:\s[A-Z][a-z]+)?)/.exec(text);
    const known = o && KNOWN_COUNTRIES.find((c) => o[1].startsWith(c));
    set('origin_country', known || KNOWN_COUNTRIES.find((c) => new RegExp(`\\b${c}\\b`).test(text)) || null);
  }
  if (raw.supplier_name == null) {
    const s = /\b([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){0,4}\s+(?:Ltd|Limited|LLC|Inc|GmbH|AG|Corp|Corporation|Pvt\.? Ltd|PLC|S\.A\.|A\.Ş\.|Co\.,? Ltd))\.?/.exec(text);
    if (s) set('supplier_name', s[1]);
  }
  if (raw.verification_statement == null) {
    const v = /[^.\n]*\bverif[^.\n]*/i.exec(text);
    if (v) set('verification_statement', v[0].trim());
  }
  if (raw.installation_id == null) {
    const i = /installation\s*(?:id|identifier|no\.?|number)\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{3,})/i.exec(text);
    if (i) set('installation_id', i[1]);
  }
  if (raw.site_visit_date == null) {
    const d = /site visit[^\n\d]{0,40}(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i.exec(text);
    if (d) set('site_visit_date', d[1]);
  }
  if (raw.direct_indirect_split == null) {
    if (direct && indirect) set('direct_indirect_split', `Direct ${direct} / Indirect ${indirect}`);
    else {
      const di = /direct[^\n\d]{0,30}(\d+(?:\.\d+)?)[^\n]{0,60}?indirect[^\n\d]{0,30}(\d+(?:\.\d+)?)/i.exec(text);
      if (di) set('direct_indirect_split', `Direct ${di[1]} / Indirect ${di[2]}`);
    }
  }
  if (raw.production_route == null) {
    const route = findRoute(text);
    if (route) set('production_route', route.label);
  }
  return raw;
}

// ---------- LLM engines ----------

function geminiSchema() {
  const properties = Object.fromEntries(
    Object.entries(RAW_FIELDS).map(([k, t]) => [
      k,
      { type: t === 'number' ? 'NUMBER' : 'STRING', nullable: true, ...(FIELD_HINTS[k] && { description: FIELD_HINTS[k] }) },
    ]),
  );
  return { type: 'OBJECT', properties, required: Object.keys(RAW_FIELDS) };
}

function openAiSchema() {
  const properties = Object.fromEntries(
    Object.entries(RAW_FIELDS).map(([k, t]) => [
      k,
      { type: [t, 'null'], ...(FIELD_HINTS[k] && { description: FIELD_HINTS[k] }) },
    ]),
  );
  return { type: 'object', properties, required: Object.keys(RAW_FIELDS), additionalProperties: false };
}

async function geminiExtract({ text, pdf }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const parts = text
    ? [{ text: `Supplier declaration:\n"""\n${text}\n"""` }]
    : [{ inlineData: { mimeType: 'application/pdf', data: pdf.toString('base64') } }, { text: 'Extract the CBAM evidence from this supplier declaration.' }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: geminiSchema() },
    }),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Gemini API returned HTTP ${res.status}`);
  const data = await res.json();
  const out = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!out) throw new Error('Gemini returned no content');
  return { raw: JSON.parse(out), model };
}

async function openAiExtract({ text }) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Supplier declaration:\n"""\n${text}\n"""` },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'cbam_evidence', strict: true, schema: openAiSchema() } },
    }),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI API returned HTTP ${res.status}`);
  const data = await res.json();
  const out = data.choices?.[0]?.message?.content;
  if (!out) throw new Error('OpenAI returned no content');
  return { raw: JSON.parse(out), model };
}

/** Coerces LLM output to the raw schema and drops free-text values that do not appear in the source. */
function sanitizeLlmRaw(raw, sourceText, warnings) {
  const clean = {};
  const haystack = sourceText ? sourceText.toLowerCase().replace(/\s+/g, ' ') : null;
  for (const [key, type] of Object.entries(RAW_FIELDS)) {
    let v = raw?.[key] ?? null;
    if (type === 'number' && v != null) v = Number.isFinite(Number(v)) ? Number(v) : null;
    if (type === 'string' && v != null) v = String(v).trim() || null;
    if (v != null && haystack && GROUNDED_FIELDS.includes(key) && !haystack.includes(String(v).toLowerCase().replace(/\s+/g, ' '))) {
      warnings.push(`Dropped ${key} "${v}": not found verbatim in the document.`);
      v = null;
    }
    clean[key] = v;
  }
  return clean;
}

// ---------- Normalisation (shared by all engines) ----------

function findRoute(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  // Most specific aliases first so "scrap-eaf" wins over "eaf".
  const candidates = Object.values(constants.sectors.steel.routes)
    .flatMap((r) => r.aliases.map((a) => ({ route: r, alias: a })))
    .sort((a, b) => b.alias.length - a.alias.length);
  return candidates.find(({ alias }) => lower.includes(alias))?.route ?? null;
}

function formatCn(cn) {
  if (!cn) return null;
  const digits = String(cn).replace(/\D/g, '');
  if (digits.length < 4) return null;
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join(' ');
}

function normalizeCountry(country) {
  if (!country) return null;
  const c = String(country).trim().replace(/\.$/, '');
  const alias = COUNTRY_ALIASES[c.toLowerCase()];
  if (alias) return alias;
  return KNOWN_COUNTRIES.find((k) => k.toLowerCase() === c.toLowerCase()) ?? c.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function detectSector(cnCode, product) {
  const digits = (cnCode || '').replace(/\D/g, '');
  const all = [...Object.values(constants.sectors), ...Object.values(constants.unsupportedSectors).map((s) => ({ ...s, unsupported: true }))];
  if (digits) {
    const byCn = all
      .flatMap((s) => s.cnPrefixes.map((p) => ({ s, p })))
      .sort((a, b) => b.p.length - a.p.length)
      .find(({ p }) => digits.startsWith(p));
    if (byCn) return byCn.s;
  }
  const lower = (product || '').toLowerCase();
  return all.find((s) => s.keywords.some((k) => lower.includes(k))) ?? null;
}

function classifyVerification(statement, raw) {
  const s = (statement || '').toLowerCase();
  if (/internal|self[- ]?declar|supplier declaration|not (yet )?(been )?verified|unverified|no third|without verification/.test(s)) {
    return VERIFICATION_STATUS.INTERNAL;
  }
  if (/third[- ]party|independent|accredited|verified by|verification report|reasonable assurance|limited assurance/.test(s)) {
    return VERIFICATION_STATUS.THIRD_PARTY;
  }
  if (raw.verifier_name && raw.accreditation_number) return VERIFICATION_STATUS.THIRD_PARTY;
  return VERIFICATION_STATUS.NOT_STATED;
}

function normalize(raw, warnings) {
  const cnCode = formatCn(raw.cn_code);
  const sector = detectSector(cnCode, raw.product_description);
  const route = findRoute(raw.production_route);
  const origin = normalizeCountry(raw.origin_country);

  if (!sector) warnings.push('Could not determine the CBAM sector from the CN code or product description.');
  else if (sector.unsupported) warnings.push(`${sector.label} is a CBAM sector but is not yet costed by CarbonLenz.`);

  if (sector && !sector.unsupported && raw.declared_emissions != null) {
    const sectorData = constants.sectors[sector.key];
    const defaultValue = sectorData.countryDefaults[origin] ?? sectorData.fallbackDefault;
    if (raw.declared_emissions > defaultValue) {
      warnings.push(`Declared emissions (${raw.declared_emissions}) exceed the EU default value (${defaultValue}) for this product.`);
    }
  }

  return {
    supplier: raw.supplier_name,
    product: raw.product_description,
    cn_code: cnCode,
    sector: sector?.key ?? null,
    sector_label: sector?.label ?? null,
    sector_supported: Boolean(sector && !sector.unsupported),
    origin_country: origin,
    quantity_tonnes: raw.quantity_tonnes,
    declared_emissions: raw.declared_emissions,
    unit: 'tCO2e/t product',
    verification_status: classifyVerification(raw.verification_statement, raw),
    verification_statement: raw.verification_statement,
    production_route: route ? { key: route.key, label: route.label, benchmark: route.benchmark } : raw.production_route ? { key: null, label: raw.production_route, benchmark: null } : null,
    fields: {
      supplier_name: raw.supplier_name,
      product_description: raw.product_description,
      quantity_tonnes: raw.quantity_tonnes,
      declared_emissions: raw.declared_emissions,
      verifier_name: raw.verifier_name,
      accreditation_number: raw.accreditation_number,
      accrediting_body: raw.accrediting_body,
      installation_id: raw.installation_id,
      methodology: raw.methodology,
      direct_indirect_split: raw.direct_indirect_split,
      reporting_period: raw.reporting_period,
      site_visit_date: raw.site_visit_date,
    },
  };
}

/**
 * @param {{ text?: string, pdf?: Buffer, engine?: 'auto' | 'rules' }} input
 *   `pdf` is only used when `text` is empty (e.g. a scanned PDF) and Gemini is configured.
 */
export async function extractEvidence({ text = '', pdf, engine = 'auto' }) {
  const warnings = [];
  const engines = [];
  if (engine !== 'rules') {
    if (process.env.GEMINI_API_KEY) engines.push(['gemini', geminiExtract]);
    if (process.env.OPENAI_API_KEY && text) engines.push(['openai', openAiExtract]);
  }

  for (const [name, run] of engines) {
    if (!text && !(name === 'gemini' && pdf)) continue;
    try {
      const { raw, model } = await run({ text, pdf });
      return { extraction: normalize(sanitizeLlmRaw(raw, text, warnings), warnings), engine: name, model, warnings };
    } catch (err) {
      warnings.push(`${name} extraction failed (${err.message}); falling back.`);
    }
  }

  if (!text.trim()) throw new Error('No readable text found in the document (a scanned PDF needs GEMINI_API_KEY).');
  return { extraction: normalize(rulesExtract(text), warnings), engine: 'rules', model: null, warnings };
}
