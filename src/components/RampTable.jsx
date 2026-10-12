import React from 'react';
import { Table2 } from 'lucide-react';
import { constants } from '../lib/knowledge';
import { Cite, MONO, Panel, StatusDot } from './ui';
import { eur, pct, pricePerTonne, tonnes } from '../lib/format';

export function deMinimisStatus(deMinimis, quantity) {
  if (!deMinimis.applicable) return { tone: 'zinc', text: 'De minimis exemption not applicable to this sector' };
  if (deMinimis.aboveThreshold) {
    return { tone: 'red', text: `Above ${deMinimis.thresholdTonnes} t de minimis threshold (${tonnes(quantity)})` };
  }
  return {
    tone: 'emerald',
    text: `Within ${deMinimis.thresholdTonnes} t de minimis threshold. Exempt only if cumulative annual CBAM imports ≤ ${deMinimis.thresholdTonnes} t`,
  };
}

const TH = 'px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 text-right whitespace-nowrap';
const TD = `px-3 py-2 text-right ${MONO} whitespace-nowrap`;

export default function RampTable({ ramp, price }) {
  const { rows, totals, inputs } = ramp;
  const dm = deMinimisStatus(ramp.deMinimis, inputs.quantityTonnes);

  return (
    <Panel
      title="Phase-in schedule"
      icon={Table2}
      actions={
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500 max-w-[340px]" title={dm.text}>
          <StatusDot tone={dm.tone} />
          <span className="truncate">{dm.text}</span>
        </span>
      }
      bodyClassName=""
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className={`${TH} text-left pl-4`}>Year</th>
              <th className={TH}>Phase-in</th>
              <th className={TH}>Markup</th>
              <th className={TH}>Default intensity</th>
              <th className={TH}>Default liability</th>
              <th className={TH}>Actual liability</th>
              <th className={`${TH} pr-4`}>Arbitrage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year} className="border-b border-zinc-100 hover:bg-zinc-50/60">
                <td className={`${TD} text-left pl-4 text-zinc-900 font-medium`}>{r.year}</td>
                <td className={`${TD} text-zinc-600`}>{pct(r.phaseInFactor)}</td>
                <td className={`${TD} text-zinc-600`}>+{pct(r.markup, 0)}</td>
                <td className={`${TD} text-zinc-600`}>{r.defaultIntensity.toFixed(2)}</td>
                <td className={`${TD} text-zinc-900`}>{eur(r.defaultCostEur)}</td>
                <td className={`${TD} text-zinc-900`}>{eur(r.actualCostEur)}</td>
                <td className={`${TD} pr-4 text-emerald-700`}>{eur(r.savingsEur)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50">
            <tr>
              <td className="pl-4 pr-3 py-2.5 text-[13px] font-medium text-zinc-900" colSpan={4}>
                Cumulative 2026–2034
              </td>
              <td className={`${TD} py-2.5 font-medium text-zinc-900`}>{eur(totals.defaultCostEur)}</td>
              <td className={`${TD} py-2.5 font-medium text-zinc-900`}>{eur(totals.actualCostEur)}</td>
              <td className={`${TD} py-2.5 pr-4 font-medium text-emerald-700`}>{eur(totals.savingsEur)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="px-4 py-2.5 border-t border-zinc-200 text-xs text-zinc-500">
        {constants.markupModes[inputs.markupMode].label} · certificate price <span className={MONO}>{price.label} {pricePerTonne(price.eurPerTco2)}</span> · intensities in{' '}
        <span className={MONO}>tCO₂e/t</span> · <Cite>Reg. (EU) 2023/956 Annex IV; Impl. Reg. (EU) 2025/2621</Cite>
      </p>
    </Panel>
  );
}
