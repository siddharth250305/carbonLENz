import React from 'react';
import { FileDown } from 'lucide-react';
import { Button, MONO, StatusDot } from './ui';
import { pricePerTonne } from '../lib/format';

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="6" fill="#18181B" />
      <circle cx="16" cy="16" r="7" fill="none" stroke="#FAFAFA" strokeWidth="2.5" />
    </svg>
  );
}

export default function Header({ price, onExport }) {
  return (
    <header className="sticky top-0 z-30 h-12 bg-white border-b border-zinc-200">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Mark />
          <span className="text-[14px] font-semibold tracking-tight text-zinc-900">CarbonLenz</span>
        </div>

        <span className="hidden md:inline-flex items-center gap-2 h-6 px-2 rounded-md border border-zinc-200 bg-zinc-50 text-xs text-zinc-600">
          <StatusDot tone="emerald" />
          EU CBAM Definitive Regime
          <span className="text-zinc-300">·</span>
          <span className={MONO}>
            {price.label} {pricePerTonne(price.eurPerTco2)}
          </span>
        </span>

        <div className="ml-auto">
          <Button variant="primary" icon={FileDown} onClick={onExport}>
            Export Audit PDF
          </Button>
        </div>
      </div>
    </header>
  );
}
