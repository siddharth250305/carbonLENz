import React from 'react';
import { SlidersHorizontal, Link2 } from 'lucide-react';
import { constants } from '../lib/knowledge';
import { FieldLabel, ICON, MONO, Panel, Segmented, SuffixInput, inputClass } from './ui';
import { eur, intensity } from '../lib/format';

const MARKUP_OPTIONS = [
  { value: 'fixed', label: 'Fixed +10%' },
  { value: 'statutory', label: 'Escalating +10/20/30%' },
];

const numberOrBlank = (value) => (value === '' ? '' : Number(value));

export default function ParametersBar({
  sector,
  setSector,
  country,
  setCountry,
  quantity,
  setQuantity,
  declaredEmissions,
  setDeclaredEmissions,
  markupMode,
  setMarkupMode,
  priceId,
  setPriceId,
  customPrice,
  setCustomPrice,
  priceError,
  ramp,
  scenarioSavings2034,
  syncedSupplier,
}) {
  const countries = [...new Set([...Object.keys(constants.sectors.steel.countryDefaults), country, 'Other'])];

  return (
    <Panel
      title="Exposure parameters"
      icon={SlidersHorizontal}
      actions={
        syncedSupplier && (
          <span className="hidden sm:inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 max-w-[320px]" title={`Synced from evidence: ${syncedSupplier}`}>
            <Link2 {...ICON} className="text-zinc-400 shrink-0" />
            <span className="truncate">Synced · {syncedSupplier}</span>
          </span>
        )
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2">
          <FieldLabel htmlFor="p-sector">Sector / product</FieldLabel>
          <select id="p-sector" className={inputClass} value={sector} onChange={(e) => setSector(e.target.value)}>
            {Object.values(constants.sectors).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} · {s.productLabel}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="p-origin">Country of origin</FieldLabel>
          <select id="p-origin" className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="p-qty">Annual tonnage</FieldLabel>
          <SuffixInput id="p-qty" type="number" min="0" step="1" suffix="t" value={quantity} onChange={(e) => setQuantity(numberOrBlank(e.target.value))} />
        </div>

        <div>
          <FieldLabel htmlFor="p-declared">Declared intensity</FieldLabel>
          <SuffixInput
            id="p-declared"
            type="number"
            min="0"
            step="0.01"
            suffix="tCO₂e/t"
            value={declaredEmissions}
            onChange={(e) => setDeclaredEmissions(numberOrBlank(e.target.value))}
          />
        </div>
        <div>
          <FieldLabel htmlFor="p-price">Certificate price</FieldLabel>
          <select id="p-price" className={`${inputClass} ${MONO}`} value={priceId} onChange={(e) => setPriceId(e.target.value)}>
            {constants.certificatePrices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} · €{p.eurPerTco2.toFixed(2)}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="col-span-2">
          <FieldLabel>Default value markup</FieldLabel>
          <Segmented options={MARKUP_OPTIONS} value={markupMode} onChange={setMarkupMode} ariaLabel="Default value markup" className="w-full [&>button]:flex-1 [&>button]:justify-center" />
        </div>

        {priceId === 'custom' && (
          <div>
            <FieldLabel htmlFor="p-custom">Custom price</FieldLabel>
            <SuffixInput
              id="p-custom"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              suffix="€/tCO₂"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className={priceError ? 'border-red-400 focus:border-red-400' : ''}
            />
            {priceError && <p className="mt-1 text-xs text-red-600">Enter a positive price. Q1 2026 applied.</p>}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:justify-between gap-1.5 text-xs text-zinc-500">
        <span>
          EU default value <span className={MONO}>{intensity(ramp.defaultValue.value)}</span> · {ramp.defaultValue.basis} · {ramp.defaultValue.status}
        </span>
        <span>
          2034 arbitrage · fixed <span className={`${MONO} text-zinc-700`}>{eur(scenarioSavings2034.fixed)}</span> · escalating{' '}
          <span className={`${MONO} text-zinc-700`}>{eur(scenarioSavings2034.statutory)}</span>
        </span>
      </div>
    </Panel>
  );
}
