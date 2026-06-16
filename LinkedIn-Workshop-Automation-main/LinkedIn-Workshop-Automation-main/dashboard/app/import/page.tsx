'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';

type Source = 'close_crm' | 'sales_navigator';
type Status = 'idle' | 'uploading' | 'success' | 'error';

// ── Client-side CSV preview (does NOT affect what gets sent to n8n) ────────────

function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function findCol(headers: string[], candidates: string[]): number {
  // Exact match first
  for (const c of candidates) {
    const idx = headers.findIndex(h => h.trim().toLowerCase() === c.toLowerCase());
    if (idx !== -1) return idx;
  }
  // Partial match fallback
  for (const c of candidates) {
    const idx = headers.findIndex(h => h.trim().toLowerCase().includes(c.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizeUrl(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  return t.replace(/^http:\/\//i, 'https://').split('?')[0].replace(/\/+$/, '').toLowerCase();
}

function previewCSV(text: string, source: Source): { valid: number; skipped: number; urlColFound: boolean } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { valid: 0, skipped: 0, urlColFound: false };

  const headers = parseLine(lines[0]);

  const linkedinCandidates = source === 'close_crm'
    ? ['linkedin', 'linkedin url', 'linkedin_url', 'linkedin profile', 'linkedin profile url']
    : ['profile url', 'profileurl', 'profile_url', 'linkedin url', 'linkedin_url', 'linkedin'];

  const urlCol = findCol(headers, linkedinCandidates);

  let valid = 0;
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    const url = normalizeUrl(urlCol >= 0 ? row[urlCol] ?? '' : '');
    if (url && url.includes('linkedin.com')) { valid++; } else { skipped++; }
  }
  return { valid, skipped, urlColFound: urlCol >= 0 };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [file, setFile]         = useState<File | null>(null);
  const [source, setSource]     = useState<Source>('close_crm');
  const [preview, setPreview]   = useState<{ valid: number; skipped: number; urlColFound: boolean } | null>(null);
  const [status, setStatus]     = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(f: File, src: Source) {
    if (!f.name.endsWith('.csv')) {
      setErrorMsg('Only .csv files are accepted.');
      setStatus('error');
      setPreview(null);
      return;
    }
    setErrorMsg('');
    setStatus('idle');
    const text = await f.text();
    setPreview(previewCSV(text, src));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0] ?? null;
    if (f) { setFile(f); processFile(f, source); }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) { setFile(f); processFile(f, source); }
  }

  function onSourceChange(v: string) {
    const s = v as Source;
    setSource(s);
    if (file) processFile(file, s);
  }

  async function submit() {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    const fd = new FormData();
    fd.append('data', file, file.name);
    fd.append('source', source);

    try {
      const res = await fetch('/api/import-leads', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Import failed.');
        setStatus('error');
      } else {
        setStatus('success');
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  const dropBorder = dragging
    ? '2px dashed #2BCEF7'
    : file
    ? '2px dashed rgba(43,206,247,0.4)'
    : '2px dashed var(--border)';

  const canSubmit = !!file && status !== 'uploading' && (preview?.valid ?? 0) > 0;

  return (
    <div className="max-w-lg mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: '#2BCEF7' }}>
            Lead Import
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Import CSV</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>
            Upload a Close CRM or Sales Navigator export to add leads to the campaign.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium mt-1 px-4 py-2 rounded-lg border"
          style={{ color: '#2BCEF7', borderColor: 'rgba(43,206,247,0.25)', background: 'rgba(43,206,247,0.05)' }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-xl border p-6 space-y-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

        {/* Source */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
            Source
          </label>
          <CustomSelect
            value={source}
            onChange={onSourceChange}
            options={[
              { value: 'close_crm', label: 'Close CRM' },
              { value: 'sales_navigator', label: 'Sales Navigator' },
            ]}
          />
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {source === 'close_crm'
              ? 'Columns: First Name, Last Name, Company Name, LinkedIn, Email'
              : 'Columns: First Name, Last Name, Company, Profile URL'}
          </p>
        </div>

        {/* Drop zone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
            CSV File
          </label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="rounded-lg cursor-pointer flex flex-col items-center justify-center gap-2 py-10 px-4 text-center transition-colors"
            style={{ border: dropBorder, background: dragging ? 'rgba(43,206,247,0.04)' : 'var(--bg-input)' }}
          >
            {file ? (
              <>
                <div className="text-2xl">📄</div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{file.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB · click to change
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl" style={{ opacity: 0.4 }}>📂</div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Drop CSV here or <span style={{ color: '#2BCEF7' }}>click to browse</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>.csv files only</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        </div>

        {/* Preview badge — shown after file is selected */}
        {preview && status !== 'success' && (
          <div className="rounded-lg px-4 py-3 space-y-1 text-sm"
            style={{
              background: preview.valid > 0 ? 'rgba(43,206,247,0.06)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${preview.valid > 0 ? 'rgba(43,206,247,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: preview.valid > 0 ? '#2BCEF7' : '#f87171' }}>
                {!preview.urlColFound
                  ? 'LinkedIn URL column not found — check source selection'
                  : preview.valid > 0
                  ? <><strong>{preview.valid}</strong> lead{preview.valid !== 1 ? 's' : ''} ready to import</>
                  : 'No valid LinkedIn URLs found — check source format'}
              </span>
              {preview.skipped > 0 && (
                <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>
                  {preview.skipped} row{preview.skipped !== 1 ? 's' : ''} skipped
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            {errorMsg || 'Something went wrong.'}
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(43,206,247,0.06)', border: '1px solid rgba(43,206,247,0.2)', color: '#2BCEF7' }}
          >
            Import sent to n8n. Check the{' '}
            <Link href="/leads" style={{ textDecoration: 'underline' }}>Leads page</Link> in a few seconds.
          </div>
        )}

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canSubmit ? '#2BCEF7' : 'rgba(43,206,247,0.3)',
            color: '#070C14',
          }}
        >
          {status === 'uploading'
            ? 'Uploading…'
            : preview?.valid
            ? `Import ${preview.valid} Lead${preview.valid !== 1 ? 's' : ''}`
            : 'Import Leads'}
        </button>
      </div>

      {/* Info */}
      <div className="rounded-xl border p-4 space-y-2 text-xs"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <p className="font-semibold uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-subtle)' }}>
          What happens after import
        </p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>CSV is sent to n8n via webhook</li>
          <li>n8n parses and normalizes all LinkedIn URLs</li>
          <li>Duplicates already in the DB are skipped automatically</li>
          <li>New leads inserted → status <code className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-input)' }}>imported</code></li>
          <li>Each lead added to Heyreach campaign → status <code className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-input)' }}>campaign_added</code></li>
        </ol>
      </div>
    </div>
  );
}
