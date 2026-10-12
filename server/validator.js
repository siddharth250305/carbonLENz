// Annex VI evidence validator: checks extracted supplier evidence against the OKF checklist
// and computes the Supplier Risk Score (0–100), risk band and prioritised supplier actions.
import { constants } from './knowledge/index.js';

export const VERIFICATION_STATUS = {
  THIRD_PARTY: 'third-party verified',
  INTERNAL: 'internal only',
  NOT_STATED: 'not stated',
};

const CONDITIONS = {
  verification_status_not_third_party: (evidence) => evidence.verification_status !== VERIFICATION_STATUS.THIRD_PARTY,
};

export const isPresent = (value) =>
  value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '');

/**
 * @param {{ fields: Record<string, unknown>, verification_status: string }} evidence
 */
export function validateEvidence(evidence, annexVi = constants.annexVi) {
  const fieldsByKey = Object.fromEntries(annexVi.fields.map((f) => [f.key, f]));

  const checklist = annexVi.fields.map((f) => ({
    key: f.key,
    label: f.label,
    group: f.group,
    present: isPresent(evidence.fields?.[f.key]),
    value: evidence.fields?.[f.key] ?? null,
  }));
  const present = new Set(checklist.filter((c) => c.present).map((c) => c.key));

  const triggered = annexVi.riskFactors
    .map((factor) => {
      const missing = (factor.fields || []).filter((k) => !present.has(k));
      const hit = factor.condition ? CONDITIONS[factor.condition](evidence) : missing.length > 0;
      return hit ? { id: factor.id, label: factor.label, points: factor.points, missing_fields: missing } : null;
    })
    .filter(Boolean);

  let score = Math.min(annexVi.maxScore, triggered.reduce((acc, f) => acc + f.points, 0));
  const hasDeclaredEmissions = present.has('declared_emissions');
  if (!hasDeclaredEmissions) score = Math.max(score, annexVi.noDeclaredEmissionsMinScore);

  const band = annexVi.riskBands.find((b) => score <= b.max) ?? annexVi.riskBands.at(-1);

  // Actions: risk-weighted factors first (highest points first), then any other missing field.
  const actions = [];
  const seen = new Set();
  const addAction = (field, text, points, reason) => {
    if (seen.has(text)) return;
    seen.add(text);
    actions.push({ field, action: text, points, reason });
  };
  if (!hasDeclaredEmissions) {
    addAction('declared_emissions', fieldsByKey.declared_emissions.action, annexVi.noDeclaredEmissionsMinScore, 'No declared emissions value');
  }
  for (const f of [...triggered].sort((a, b) => b.points - a.points)) {
    const factor = annexVi.riskFactors.find((x) => x.id === f.id);
    if (factor.action) addAction(null, factor.action, f.points, f.label);
    // A factor's points are attributed once, to its first missing field.
    f.missing_fields.forEach((key, i) => addAction(key, fieldsByKey[key].action, i === 0 && !factor.action ? f.points : 0, f.label));
  }
  for (const c of checklist) {
    if (!c.present) addAction(c.key, fieldsByKey[c.key].action, 0, `Missing: ${c.label}`);
  }

  return {
    risk_score: score,
    risk_level: band.level,
    risk_category: band.label,
    risk_status: band.status,
    summary_action: band.summary,
    actual_emissions_accepted: band.level === 'low' && hasDeclaredEmissions,
    checklist,
    present_fields: checklist.filter((c) => c.present).map((c) => c.key),
    missing_fields: checklist.filter((c) => !c.present).map((c) => c.key),
    risk_factors: triggered,
    recommended_actions: actions.map((a, i) => ({ priority: i + 1, ...a })),
  };
}
