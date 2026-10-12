import React, { useMemo, useState } from 'react';
import Header from './components/Header';
import KpiStrip from './components/KpiStrip';
import EvidenceScanner from './components/EvidenceScanner';
import EvidenceLedger from './components/EvidenceLedger';
import SupplierRiskCard from './components/SupplierRiskCard';
import ParametersBar from './components/ParametersBar';
import ExposureRampChart from './components/ExposureRampChart';
import RampTable from './components/RampTable';
import InvestorReport from './components/InvestorReport';
import { Cite } from './components/ui';
import { constants } from './lib/knowledge';
import { calculateRamp, resolveCertificatePrice } from '../shared/cbamEngine.js';

const defaultPrice = resolveCertificatePrice(constants, { priceId: constants.defaultPriceId });

export default function App() {
  const [quantity, setQuantity] = useState(1200);
  const [sector, setSector] = useState('steel');
  const [country, setCountry] = useState('India');
  const [declaredEmissions, setDeclaredEmissions] = useState(constants.sectors.steel.demoDeclared);
  const [markupMode, setMarkupMode] = useState(constants.defaultMarkupMode);
  const [priceId, setPriceId] = useState(constants.defaultPriceId);
  const [customPrice, setCustomPrice] = useState('');
  const [scan, setScan] = useState(null);
  const [syncedFromScan, setSyncedFromScan] = useState(false);

  const manual = (setter) => (value) => {
    setter(value);
    setSyncedFromScan(false);
  };

  const changeSector = (next) => {
    setSector(next);
    setDeclaredEmissions(constants.sectors[next].demoDeclared);
    setSyncedFromScan(false);
  };

  const handleScan = (result) => {
    setScan(result);
    if (result.sector_supported) setSector(result.sector);
    if (result.origin_country) setCountry(result.origin_country);
    if (result.quantity_tonnes != null) setQuantity(result.quantity_tonnes);
    if (result.declared_emissions != null) setDeclaredEmissions(result.declared_emissions);
    setSyncedFromScan(result.sector_supported);
  };

  // An invalid custom price falls back to the default quarter and is flagged in the parameters bar.
  const { price, priceError } = useMemo(() => {
    try {
      return { price: resolveCertificatePrice(constants, { priceId, customPrice }), priceError: null };
    } catch (err) {
      return { price: defaultPrice, priceError: err.message };
    }
  }, [priceId, customPrice]);

  const rampInputs = {
    quantityTonnes: Number(quantity) || 0,
    sector,
    country,
    declaredEmissions: Number(declaredEmissions) || 0,
    certificatePrice: price.eurPerTco2,
  };
  const ramp = calculateRamp(constants, { ...rampInputs, markupMode });
  // Both scenarios are computed so the 2034 arbitrage of each markup mode is visible side by side.
  const scenarioSavings2034 = {
    fixed: calculateRamp(constants, { ...rampInputs, markupMode: 'fixed' }).rows.at(-1).savingsEur,
    statutory: calculateRamp(constants, { ...rampInputs, markupMode: 'statutory' }).rows.at(-1).savingsEur,
  };

  return (
    <>
      <div className="min-h-screen print:hidden">
        <Header price={price} onExport={() => window.print()} />

        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-5">
          <KpiStrip ramp={ramp} scan={syncedFromScan ? scan : null} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 space-y-5 min-w-0">
              <EvidenceScanner onScan={handleScan} />
              <EvidenceLedger scan={scan} />
              <SupplierRiskCard scan={scan} />
            </div>

            <div className="lg:col-span-7 space-y-5 min-w-0">
              <ParametersBar
                sector={sector}
                setSector={changeSector}
                country={country}
                setCountry={manual(setCountry)}
                quantity={quantity}
                setQuantity={manual(setQuantity)}
                declaredEmissions={declaredEmissions}
                setDeclaredEmissions={manual(setDeclaredEmissions)}
                markupMode={markupMode}
                setMarkupMode={setMarkupMode}
                priceId={priceId}
                setPriceId={setPriceId}
                customPrice={customPrice}
                setCustomPrice={setCustomPrice}
                priceError={priceError}
                ramp={ramp}
                scenarioSavings2034={scenarioSavings2034}
                syncedSupplier={syncedFromScan ? scan?.supplier : null}
              />
              <ExposureRampChart ramp={ramp} />
              <RampTable ramp={ramp} price={price} />
            </div>
          </div>

          <footer className="pt-2 pb-6 text-xs text-zinc-400">
            <Cite>
              Phase-in per Reg. (EU) 2023/956 Annex IV. Default values and markups per Impl. Reg. (EU) 2025/2621. Verification per Delegated Reg. (EU) 2025/2551.
              De minimis per Reg. (EU) 2025/2083. Steel default values are illustrative for the CN 7208 pilot. Indicative estimates; not legal or tax advice.
            </Cite>
          </footer>
        </main>
      </div>

      <InvestorReport ramp={ramp} scan={scan} price={price} syncedFromScan={syncedFromScan} />
    </>
  );
}
