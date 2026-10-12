import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { MONO, Panel } from './ui';
import { eur, pct } from '../lib/format';

const COLORS = { default: '#dc2626', actual: '#059669', grid: '#f4f4f5', axis: '#a1a1aa' };
const AXIS_TICK = { fontSize: 11, fill: '#71717a', fontFamily: 'JetBrains Mono, monospace' };

function LegendItem({ color, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

function TrajectoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-200 rounded-md px-3 py-2 text-xs shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className={`${MONO} font-medium text-zinc-900 mb-1.5`}>
        {r.year} <span className="text-zinc-400">· phase-in {pct(r.phaseInFactor)}</span>
      </div>
      {[
        ['Default values', r.defaultCostEur, COLORS.default],
        ['Verified actual', r.actualCostEur, COLORS.actual],
      ].map(([label, value, color]) => (
        <div key={label} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
          <span className={`${MONO} text-zinc-900`}>{eur(value)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-6 mt-1 pt-1 border-t border-zinc-100">
        <span className="text-zinc-500">Arbitrage</span>
        <span className={`${MONO} text-emerald-700`}>{eur(r.savingsEur)}</span>
      </div>
    </div>
  );
}

export default function ExposureRampChart({ ramp }) {
  const first = ramp.rows[0];
  const last = ramp.rows.at(-1);
  const multiple = first.defaultCostEur > 0 ? Math.round(last.defaultCostEur / first.defaultCostEur) : 0;

  return (
    <Panel
      title="Liability trajectory 2026–2034"
      icon={TrendingUp}
      actions={
        <div className="hidden sm:flex items-center gap-4">
          <LegendItem color={COLORS.default}>Default values</LegendItem>
          <LegendItem color={COLORS.actual}>Verified actual</LegendItem>
        </div>
      }
      bodyClassName="pt-4 pb-3 pr-4"
    >
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ramp.rows} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} tickMargin={8} />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => (v >= 1000 ? `€${Math.round(v / 1000)}k` : `€${v}`)}
            />
            <Tooltip content={<TrajectoryTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }} />
            <Line type="linear" dataKey="defaultCostEur" stroke={COLORS.default} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />
            <Line type="linear" dataKey="actualCostEur" stroke={COLORS.actual} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="pl-4 mt-2 text-xs text-zinc-500">
        Default-value liability rises <span className={MONO}>{multiple}×</span> from <span className={MONO}>{eur(first.defaultCostEur)}</span> (2026) to{' '}
        <span className={MONO}>{eur(last.defaultCostEur)}</span> (2034) as the phase-in factor moves from <span className={MONO}>{pct(first.phaseInFactor)}</span> to{' '}
        <span className={MONO}>100%</span>.
      </p>
    </Panel>
  );
}
