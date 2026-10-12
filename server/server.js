import 'dotenv/config';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { calculateCBAMExposure, constants } from './cbamRules.js';
import { validateEvidence } from './validator.js';
import { extractEvidence } from './extractor.js';
import { DEMO_DOCUMENT } from '../shared/demoDocument.js';

const app = express();
const PORT = process.env.PORT || 5001;
const MAX_TEXT_CHARS = 50_000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const isPdf = (file) => file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
const isText = (file) => file.mimetype.startsWith('text/') || /\.(txt|md|csv|eml)$/i.test(file.originalname);

async function pdfToText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CarbonLenz Express API',
    version: '1.1.0',
    extraction_engines: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      rules: true,
    },
  });
});

// OKF knowledge base, as loaded by the server (single source of truth for all constants)
app.get('/api/knowledge', (req, res) => {
  res.json(constants);
});

// CBAM Ramp Exposure Calculation Endpoint
app.post('/api/calculate-ramp', (req, res) => {
  const { quantity, sector, country, declaredEmissions, priceId, customPrice, markupMode } = req.body;
  if (quantity == null || !sector) {
    return res.status(400).json({ error: 'Quantity and sector are required.' });
  }
  try {
    res.json(calculateCBAMExposure({
      quantity: Number(quantity),
      sector,
      country,
      declaredEmissions: declaredEmissions != null ? Number(declaredEmissions) : undefined,
      priceId,
      customPrice,
      markupMode,
    }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Annex VI validation of already-structured evidence
app.post('/api/validate-evidence', (req, res) => {
  const { fields, verification_status } = req.body;
  if (!fields || typeof fields !== 'object') {
    return res.status(400).json({ error: 'fields object is required.' });
  }
  res.json(validateEvidence({ fields, verification_status }));
});

// AI Evidence Scanner: demo flag, pasted text, or uploaded .txt/.pdf → extraction + validation + exposure
app.post('/api/scan-evidence', upload.single('file'), async (req, res) => {
  const body = req.body || {};
  const warnings = [];
  let text = '';
  let pdf;
  let source;

  try {
    if (body.demo === true || body.demo === 'true') {
      text = DEMO_DOCUMENT;
      source = 'demo';
    } else if (req.file) {
      source = `file:${req.file.originalname}`;
      if (isPdf(req.file)) {
        pdf = req.file.buffer;
        text = await pdfToText(pdf);
      } else if (isText(req.file)) {
        text = req.file.buffer.toString('utf8');
      } else {
        return res.status(415).json({ error: 'Unsupported file type. Upload a PDF or plain-text file.' });
      }
    } else if (typeof body.text === 'string') {
      text = body.text;
      source = 'text';
    }

    text = text.trim();
    if (!text && !pdf) {
      return res.status(400).json({ error: 'Provide supplier declaration text, a file, or { "demo": true }.' });
    }
    if (text.length > MAX_TEXT_CHARS) {
      text = text.slice(0, MAX_TEXT_CHARS);
      warnings.push(`Document truncated to the first ${MAX_TEXT_CHARS.toLocaleString()} characters.`);
    }

    const result = await extractEvidence({ text, pdf, engine: body.engine === 'rules' ? 'rules' : 'auto' });
    warnings.push(...result.warnings);
    const { extraction } = result;
    const validation = validateEvidence(extraction);

    let exposure = null;
    if (extraction.sector_supported && extraction.quantity_tonnes != null && extraction.declared_emissions != null) {
      exposure = calculateCBAMExposure({
        quantity: extraction.quantity_tonnes,
        sector: extraction.sector,
        country: extraction.origin_country,
        declaredEmissions: extraction.declared_emissions,
        priceId: body.priceId,
        customPrice: body.customPrice,
        markupMode: body.markupMode,
      });
    }

    res.json({
      ...extraction,
      present_fields: validation.present_fields,
      missing_fields: validation.missing_fields,
      validation,
      exposure,
      meta: { engine: result.engine, model: result.model, source, characters: text.length, warnings },
    });
  } catch (err) {
    res.status(422).json({ error: err.message, warnings });
  }
});

// Serve the production build (npm run build) so `npm run server` alone runs the full app
const distDir = fileURLToPath(new URL('../dist', import.meta.url));
if (existsSync(distDir)) app.use(express.static(distDir));

// Upload errors (e.g. file too large) → 400 instead of an HTML error page
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  next(err);
});

app.listen(PORT, () => {
  console.log(`CarbonLenz API listening on http://localhost:${PORT}`);
});
