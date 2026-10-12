import React from 'react';
import { constants } from '../lib/knowledge';
import { Cite, MONO, RISK_TONE, StatusDot } from './ui';
import { eur, pct, intensity, pricePerTonne, tonnes } from '../lib/format';
import { deMinimisStatus } from './RampTable';

// Print-only one-page audit report, rendered by "Export Audit PDF" (window.print()).
export default function InvestorReport({ ramp, scan, price, syncedFromScan }) {
  const { rows, totals, inputs } = ramp;
  const first = rows[0];
  const last = rows.at(-1);
  const sector = constants.sectors[inputs.sector];
  const v = scan && syncedFromScan ? scan.validation : null;
  const dm = deMinimisStatus(ramp.deMinimis, inputs.quantityTonnes);
  const generated = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD

  const shipment = [
    ['Supplier', v ? scan.supplier ?? 'Not stated' : 'Parameter scenario'],
    ['Product', v && scan.product ? scan.product : sector.productLabel],
    ['CN code', v && scan.cn_code ? scan.cn_code : '—', true],
    ['Origin', inputs.country],
    ['Annual quantity', tonnes(inputs.quantityTonnes), true],
    ['Declared intensity', intensity(inputs.declaredEmissions), true],
  ];

  const kpis = [
    ['2026 default liability', eur(first.defaultCostEur), `Actual data ${eur(first.actualCostEur)}`],
    ['2034 default exposure', eur(last.defaultCostEur), `Actual data ${eur(last.actualCostEur)}`],
    ['Verified data arbitrage', `${eur(last.savingsEur)}/yr`, `2034 · ${pct(last.savingsPct)} below default`],
    ['Cumulative arbitrage', eur(totals.savingsEur), '2026–2034'],
  ];

  return (
    <article className="hidden print:block text-zinc-900 text-[11px] leading-snug">
      <header className="flex items-end justify-between pb-3 border-b border-zinc-900">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">CarbonLenz</div>
          <h1 className="text-lg font-semibold tracking-tight">CBAM Exposure and Verification Audit</h1>
        </div>
        <div className={`${MONO} text-[10px] text-zinc-500 text-right`}>
          <div>Generated {generated}</div>
          <div>EU CBAM definitive regime</div>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-x-6 gap-y-2 py-3 border-b border-zinc-200">
        {shipment.map(([k, val, mono]) => (
          <div key={k}>
            <dt className="text-[10px] uppercase tracking-wide text-zinc-500">{k}</dt>
            <dd className={`font-medium ${mono ? MONO : ''}`}>{val}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-4 border-b border-zinc-200">
        {kpis.map(([label, value, sub], i) => (
          <div key={label} className={`py-3 ${i > 0 ? 'pl-3 border-l border-zinc-200' : ''}`}>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
            <div className={`${MONO} text-base font-medium mt-0.5 ${i >= 2 ? 'text-emerald-700' : ''}`}>{value}</div>
            <div className={`${MONO} text-[10px] text-zinc-500`}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 py-3">
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">Annex VI verification</h2>
          {v ? (
            <>
              <div className="flex items-center gap-2">
                <span className={`${MONO} text-xl font-medium`}>{v.risk_score}/100</span>
                <StatusDot tone={RISK_TONE[v.risk_level]} />
                <span className="font-medium">
                  {v.risk_category} · {v.risk_status}
                </span>
              </div>
              <p className="text-zinc-600 mt-1">
                <span className={MONO}>{v.present_fields.length}/{v.checklist.length}</span> evidence fields present · verification status: {scan.verification_status}.{' '}
                {v.summary_action}
              </p>
              <ol className="mt-2 space-y-1">
                {v.recommended_actions.slice(0, 5).map((a) => (
                  <li key={a.priority} className="flex gap-2">
                    <span className={`${MONO} text-zinc-400`}>{String(a.priority).padStart(2, '0')}</span>
                    <span><Cite>{a.action}</Cite></span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-zinc-600">No supplier declaration assessed for this scenario.</p>
          )}
          <p className="flex items-center gap-1.5 mt-2 text-zinc-600">
            <StatusDot tone={dm.tone} /> {dm.text}
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">Phase-in schedule</h2>
          <table className={`w-full ${MONO} text-[10px]`}>
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-300">
                <th className="text-left font-medium py-1">Year</th>
                <th className="text-right font-medium py-1">Phase-in</th>
                <th className="text-right font-medium py-1">Markup</th>
                <th className="text-right font-medium py-1">Default</th>
                <th className="text-right font-medium py-1">Actual</th>
                <th className="text-right font-medium py-1">Arbitrage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="border-b border-zinc-100">
                  <td className="py-0.5">{r.year}</td>
                  <td className="py-0.5 text-right">{pct(r.phaseInFactor)}</td>
                  <td className="py-0.5 text-right">+{pct(r.markup, 0)}</td>
                  <td className="py-0.5 text-right">{eur(r.defaultCostEur)}</td>
                  <td className="py-0.5 text-right">{eur(r.actualCostEur)}</td>
                  <td className="py-0.5 text-right">{eur(r.savingsEur)}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="pt-1" colSpan={3}>Total</td>
                <td className="pt-1 text-right">{eur(totals.defaultCostEur)}</td>
                <td className="pt-1 text-right">{eur(totals.actualCostEur)}</td>
                <td className="pt-1 text-right">{eur(totals.savingsEur)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <footer className="pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 space-y-1">
        <p>
          Basis: certificate price {price.label} <span className={MONO}>{pricePerTonne(price.eurPerTco2)}</span> ·{' '}
          {constants.markupModes[inputs.markupMode].label} · EU default value <span className={MONO}>{intensity(ramp.defaultValue.value)}</span> (
          {ramp.defaultValue.basis}, {ramp.defaultValue.status}).
        </p>
        <p>
          Liability = quantity × emission intensity × phase-in factor × certificate price. Default intensity = EU default value × (1 + markup).{' '}
          <Cite>Sources: Reg. (EU) 2023/956 Annex IV; Impl. Reg. (EU) 2025/2621; Delegated Reg. (EU) 2025/2551; Reg. (EU) 2025/2083.</Cite> Indicative
          estimate; not legal or tax advice.
        </p>
      </footer>
    </article>
  );
}
