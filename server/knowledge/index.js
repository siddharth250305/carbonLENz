// Loads the OKF knowledge base from disk once at startup.
import { readFileSync } from 'node:fs';
import { buildConstants } from '../../shared/okf.js';

const read = (name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');

export const constants = buildConstants({
  phaseIn: read('phase_in_schedule.md'),
  steel: read('cn_7208_steel.md'),
  sectorDefaults: read('sector_defaults.md'),
  annexVi: read('annex_vi_verification.md'),
});
