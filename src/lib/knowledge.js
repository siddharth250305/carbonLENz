// Browser copy of the OKF knowledge base, bundled at build time from the same Markdown files the server reads.
import { buildConstants } from '../../shared/okf.js';
import phaseIn from '../../server/knowledge/phase_in_schedule.md?raw';
import steel from '../../server/knowledge/cn_7208_steel.md?raw';
import sectorDefaults from '../../server/knowledge/sector_defaults.md?raw';
import annexVi from '../../server/knowledge/annex_vi_verification.md?raw';

export const constants = buildConstants({ phaseIn, steel, sectorDefaults, annexVi });
