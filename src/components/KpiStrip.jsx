import React from 'react';
import { MONO, RISK_TONE, StatusDot } from './ui';
import { eur, pct } from '../lib/format';

function Kpi({ label, value, suffix, children, valueClass = 'text-zinc-900' }) {
  return (
    <div className="bg-white px-4 py-3.5 min-w-0">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`${MONO} text-[22px] leading-7 font-medium tracking-tight ${valueClass}`}>{value}</span>
        {suffix && <span className={`${MONO} text-xs text-zinc-400`}>{suffix}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 lg:truncate">{children}</div>
    </div>
  );
}

export default function KpiStrip({ ramp, scan }) {
  const first = ramp.rows[0];
  const last = ramp.rows.at(-1);
  const v = scan?.validation;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 border border-zinc-200 rounded-lg overflow-hidden">
      <Kpi label="2026 default liability" value={eur(first.defaultCostEur)}>
        <span>
          Actual data <span className={MONO}>{eur(first.actualCostEur)}</span> · phase-in <span className={MONO}>{pct(first.phaseInFactor)}</span>
        </span>
      </Kpi>

      <Kpi label="2034 default exposure" value={eur(last.defaultCostEur)}>
        <span>
          Phase-in <span className={MONO}>100%</span> · markup <span className={MONO}>+{pct(last.markup, 0)}</span>
        </span>
      </Kpi>

      <Kpi label="Verified data arbitrage" value={eur(last.savingsEur)} suffix="/yr" valueClass={last.savingsEur >= 0 ? 'text-emerald-700' : 'text-red-600'}>
        <span>
          2034 · <span className={MONO}>{pct(last.savingsPct)}</span> below default-value liability
        </span>
      </Kpi>

      <Kpi label="Supplier risk score" value={v ? v.risk_score : '—'} suffix="/100">
        {v ? (
          <>
            <StatusDot tone={RISK_TONE[v.risk_level]} />
            <span>
              {v.risk_category} · {v.risk_status}
            </span>
          </>
        ) : (
          <>
            <StatusDot tone="zinc" />
            <span>Awaiting supplier evidence</span>
          </>
        )}
      </Kpi>
    </div>
  );
}
