import React, { useRef, useState } from 'react';
import { AlertCircle, ClipboardPaste, FileSearch, FileText, Loader2, ScanLine, Upload, X } from 'lucide-react';
import { DEMO_DOCUMENT } from '../../shared/demoDocument.js';
import { Button, ICON, MONO, Panel, Segmented } from './ui';

const ACCEPT = '.pdf,.txt,.md,.csv,.eml,application/pdf,text/plain';
const MAX_BYTES = 10 * 1024 * 1024;

const MODES = [
  { value: 'paste', label: 'Paste text', icon: ClipboardPaste },
  { value: 'upload', label: 'Upload file', icon: Upload },
];

export default function EvidenceScanner({ onScan }) {
  const [mode, setMode] = useState('paste');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInput = useRef(null);

  const loadDemo = () => {
    setMode('paste');
    setText(DEMO_DOCUMENT);
    setError(null);
  };

  const pickFile = (f) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError('File exceeds the 10 MB limit.');
      return;
    }
    setFile(f);
    setError(null);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const canScan = !loading && (mode === 'paste' ? text.trim().length > 0 : Boolean(file));

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (mode === 'upload') {
        const form = new FormData();
        form.append('file', file);
        res = await fetch('/api/scan-evidence', { method: 'POST', body: form });
      } else {
        res = await fetch('/api/scan-evidence', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      }
      const data = await res.json().catch(() => ({ error: `Server returned HTTP ${res.status}` }));
      if (!res.ok) throw new Error(data.error || `Server returned HTTP ${res.status}`);
      onScan(data);
    } catch (err) {
      setError(err instanceof TypeError ? 'API unreachable. Start it with npm run server or npm run dev:all.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel
      title="Supplier evidence"
      icon={FileSearch}
      actions={
        <Button variant="ghost" icon={FileText} onClick={loadDemo} className="h-7 px-2 -mr-2">
          Load Bharat Steel demo
        </Button>
      }
    >
      <Segmented options={MODES} value={mode} onChange={setMode} ariaLabel="Evidence input" />

      <div className="mt-3">
        {mode === 'paste' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a supplier emissions declaration, email or monitoring report"
            rows={7}
            aria-label="Supplier declaration text"
            className={`w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-md ${MONO} text-xs leading-5 text-zinc-800 outline-none resize-y transition-colors focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 placeholder:font-sans placeholder:text-zinc-400`}
          />
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !file && fileInput.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !file && fileInput.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex flex-col items-center justify-center gap-1.5 h-[150px] rounded-md border border-dashed transition-colors ${
              dragging ? 'border-zinc-500 bg-zinc-50' : 'border-zinc-300 hover:bg-zinc-50'
            } ${file ? '' : 'cursor-pointer'}`}
          >
            <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => pickFile(e.target.files?.[0])} />
            {file ? (
              <div className="flex items-center gap-2.5 text-[13px] text-zinc-900">
                <FileText {...ICON} className="text-zinc-400" />
                <span className="truncate max-w-[220px]">{file.name}</span>
                <span className={`${MONO} text-xs text-zinc-400`}>{(file.size / 1024).toFixed(1)} KB</span>
                <button type="button" aria-label="Remove file" onClick={clearFile} className="text-zinc-400 hover:text-zinc-900 cursor-pointer">
                  <X {...ICON} />
                </button>
              </div>
            ) : (
              <>
                <Upload {...ICON} className="text-zinc-400" />
                <p className="text-[13px] text-zinc-700">Drop a PDF or text file, or click to browse</p>
                <p className="text-xs text-zinc-400">Text-layer PDF, max 10 MB. Image-only PDFs require GEMINI_API_KEY.</p>
              </>
            )}
          </div>
        )}
      </div>

      <Button variant="primary" icon={loading ? Loader2 : ScanLine} onClick={runScan} disabled={!canScan} className={`w-full mt-3 ${loading ? '[&>svg]:animate-spin' : ''}`}>
        {loading ? 'Scanning' : 'Scan and validate'}
      </Button>

      {error && (
        <p className="mt-2.5 flex items-start gap-1.5 text-xs text-red-600">
          <AlertCircle {...ICON} className="shrink-0 mt-px" /> {error}
        </p>
      )}
    </Panel>
  );
}
