import React from 'react';
import { AlertTriangle, Rows3 } from 'lucide-react';
import { ICON, MONO, Panel, StatusDot } from './ui';
import { intensity, tonnes } from '../lib/format';

const ENGINE_LABELS = { gemini: 'Gemini', openai: 'OpenAI', rules: 'Rules engine' };

const VERIFICATION_TONE = {
  'third-party verified': 'emerald',
  'internal only': 'red',
  'not stated': 'amber',
};

function Row({ label, children, mono }) {
  const empty = children == null || children === '';
  return (
    <div className="grid grid-cols-[132px_1fr] gap-3 px-4 py-2 border-t border-zinc-100 first:border-t-0 text-[13px]">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={`min-w-0 truncate ${empty ? 'text-zinc-400' : 'text-zinc-900'} ${mono && !empty ? MONO : ''}`}>{empty ? 'Not stated' : children}</dd>
    </div>
  );
}

export default function EvidenceLedger({ scan }) {
  if (!scan) {
    return (
      <Panel title="Extracted metadata" icon={Rows3}>
        <p className="text-[13px] text-zinc-500">No declaration scanned. Load the Bharat Steel demo or submit a supplier declaration.</p>
      </Panel>
    );
  }

  const route = scan.production_route;
  const routeCode = route?.label?.match(/\(([^)]+)\)$/)?.[1];

  return (
    <Panel
      title="Extracted metadata"
      icon={Rows3}
      bodyClassName="py-1"
      actions={
        <span className={`${MONO} text-[11px] text-zinc-500`}>
          {ENGINE_LABELS[scan.meta.engine]}
          {scan.meta.model ? ` · ${scan.meta.model}` : ''}
        </span>
      }
    >
      <dl>
        <Row label="Supplier">{scan.supplier}</Row>
        <Row label="Product">{scan.product}</Row>
        <Row label="CN code" mono>{scan.cn_code}</Row>
        <Row label="Sector">{scan.sector_label}</Row>
        <Row label="Origin">{scan.origin_country}</Row>
        <Row label="Quantity" mono>{scan.quantity_tonnes != null ? tonnes(scan.quantity_tonnes) : null}</Row>
        <Row label="Declared intensity" mono>{scan.declared_emissions != null ? intensity(scan.declared_emissions) : null}</Row>
        <Row label="Production route">
          {route && (
            <>
              {routeCode ?? route.label}
              {route.benchmark != null && (
                <span className="text-zinc-500">
                  {' '}· EU benchmark <span className={MONO}>{route.benchmark.toFixed(3)}</span>
                </span>
              )}
            </>
          )}
        </Row>
        <Row label="Verification">
          <span className="inline-flex items-center gap-1.5">
            <StatusDot tone={VERIFICATION_TONE[scan.verification_status]} />
            {scan.verification_status}
          </span>
        </Row>
      </dl>

      {scan.meta.warnings.length > 0 && (
        <ul className="mx-4 my-2 space-y-1">
          {scan.meta.warnings.map((w) => (
            <li key={w} className="flex items-start gap-1.5 text-xs text-amber-700">
              <AlertTriangle {...ICON} className="shrink-0 mt-px" /> {w}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
