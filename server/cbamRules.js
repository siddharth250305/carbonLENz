// CBAM rules entry point for the server: OKF constants + the shared deterministic engine.
import { constants } from './knowledge/index.js';
import { calculateRamp, resolveCertificatePrice } from '../shared/cbamEngine.js';

export { constants };

export function calculateCBAMExposure({
  quantity,
  sector = 'steel',
  country,
  declaredEmissions,
  priceId,
  customPrice,
  markupMode = constants.defaultMarkupMode,
}) {
  const sectorData = constants.sectors[sector];
  if (!sectorData) throw new Error(`Unsupported sector: ${sector}`);
  if (!['fixed', 'statutory'].includes(markupMode)) throw new Error(`Unknown markupMode: ${markupMode}`);

  const price = resolveCertificatePrice(constants, { priceId, customPrice });
  const ramp = calculateRamp(constants, {
    quantityTonnes: quantity,
    sector,
    country,
    declaredEmissions: declaredEmissions ?? sectorData.demoDeclared,
    certificatePrice: price.eurPerTco2,
    markupMode,
  });

  return { sector: sectorData.label, certificatePrice: price, ...ramp };
}
