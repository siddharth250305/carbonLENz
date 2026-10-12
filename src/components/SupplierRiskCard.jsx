import React, { useState } from 'react';
import { Check, X, Circle, ListChecks, ChevronDown } from 'lucide-react';
import { constants } from '../lib/knowledge';
import { Cite, ICON, MONO, Panel, RISK_TONE, StatusDot } from './ui';

// Risk points attributed to each field (a multi-field factor counts once, on its first field).
const FIELD_POINTS = Object.fromEntries(
  constants.annexVi.riskFactors.filter((f) => f.fields?.length).map((f) => [f.fields[0], f.points]),
);

const RISK_TEXT = { low: 'text-emerald-700', medium: 'text-amber-700', high: 'text-red-600' };
const COLLAPSED_ACTIONS = 5;

export default function SupplierRiskCard({ scan }) {
  const v = scan?.validation;
  const [showAll, setShowAll] = useState(false);
  const actions = v ? (showAll ? v.recommended_actions : v.recommended_actions.slice(0, COLLAPSED_ACTIONS)) : [];
  const hidden = v ? v.recommended_actions.length - actions.length : 0;
  const checklist = v?.checklist ?? constants.annexVi.fields.map((f) => ({ key: f.key, label: f.label, present: null }));

  return (
    <Panel
      title="Annex VI verification"
      icon={ListChecks}
      bodyClassName=""
      actions={
        <span className={`${MONO} text-xs text-zinc-500`}>
          {v ? v.present_fields.length : '–'}/{checklist.length} fields
        </span>
      }
    >
      <div className="flex items-start gap-4 px-4 py-3.5 border-b border-zinc-200">
        <div className="shrink-0">
          <div className="text-xs font-medium text-zinc-500">Risk score</div>
          <div className={`${MONO} text-[28px] leading-8 font-medium tracking-tight ${v ? RISK_TEXT[v.risk_level] : 'text-zinc-300'}`}>
            {v ? v.risk_score : '—'}
            <span className="text-sm text-zinc-400">/100</span>
          </div>
        </div>
        <div className="min-w-0 pt-0.5">
          {v ? (
            <>
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-900">
                <StatusDot tone={RISK_TONE[v.risk_level]} />
                {v.risk_category} · {v.risk_status}
              </div>
              <p className="text-xs text-zinc-500 mt-1">{v.summary_action}</p>
            </>
          ) : (
            <p className="text-xs text-zinc-500">
              Scored against 12 mandatory evidence fields. 0–20 low, 21–50 medium, 51–100 high.
            </p>
          )}
        </div>
      </div>

      <ul className="px-4 py-2">
        {checklist.map((c) => (
          <li key={c.key} className="flex items-center gap-2.5 py-1.5 text-[13px]">
            {c.present === null ? (
              <Circle {...ICON} className="text-zinc-300 shrink-0" aria-label="Pending" />
            ) : c.present ? (
              <Check {...ICON} className="text-emerald-600 shrink-0" aria-label="Present" />
            ) : (
              <X {...ICON} className="text-red-600 shrink-0" aria-label="Missing" />
            )}
            <span className={c.present === false ? 'text-zinc-500' : 'text-zinc-800'}>{c.label}</span>
            {FIELD_POINTS[c.key] != null && (
              <span className={`ml-auto ${MONO} text-xs ${c.present === false ? 'text-red-600' : 'text-zinc-300'}`}>
                +{FIELD_POINTS[c.key]}
              </span>
            )}
          </li>
        ))}
      </ul>

      {v?.recommended_actions.length > 0 && (
        <div className="border-t border-zinc-200">
          <h3 className="px-4 pt-3 pb-1 text-xs font-medium text-zinc-500">Remediation · supplier requests</h3>
          <ol className="px-4 pb-3">
            {actions.map((a) => (
              <li key={a.priority} className="flex gap-3 py-1.5 text-[13px] border-t border-zinc-100 first:border-t-0">
                <span className={`${MONO} text-xs text-zinc-400 pt-px w-5 shrink-0`}>{String(a.priority).padStart(2, '0')}</span>
                <span className="text-zinc-800 flex-1">
                  <Cite>{a.action}</Cite>
                </span>
                {a.points > 0 && <span className={`${MONO} text-xs text-zinc-500 pt-px`}>+{a.points}</span>}
              </li>
            ))}
          </ol>
          {(hidden > 0 || showAll) && v.recommended_actions.length > COLLAPSED_ACTIONS && (
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="flex items-center gap-1 w-full px-4 py-2 border-t border-zinc-100 text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer rounded-b-lg"
            >
              <ChevronDown {...ICON} className={showAll ? 'rotate-180' : ''} />
              {showAll ? 'Show fewer' : `Show all ${v.recommended_actions.length} requests`}
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}
