'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { CustomSelect } from '@/components/CustomSelect';

type Lead = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  linkedin_url: string;
  source: string;
  status: string;
  updated_at: string;
};

type ApiResponse = {
  rows: Lead[];
  total: number;
  page: number;
  pageSize: number;
};

const STATUSES = [
  'imported', 'campaign_added', 'connection_sent', 'connected',
  'message_1_sent', 'follow_up_sent', 'replied_positive',
  'replied_negative', 'replied_ambiguous', 'link_sent',
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('de-DE');
}

const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
};

export default function LeadsPage() {
  const [data, setData]       = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [source, setSource]   = useState('');
  const [page, setPage]       = useState(1);
  const PAGE_SIZE = 25;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (status) params.set('status', status);
    if (source) params.set('source', source);
    try {
      const res = await fetch(`/api/leads?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, status, source]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setPage(1); }, [status, source]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = search
    ? rows.filter(r => {
        const q = search.toLowerCase();
        return (
          (r.first_name ?? '').toLowerCase().includes(q) ||
          (r.last_name  ?? '').toLowerCase().includes(q) ||
          (r.company    ?? '').toLowerCase().includes(q)
        );
      })
    : rows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: '#2BCEF7' }}>
            All Leads
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Lead Pipeline</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>
            {total > 0 ? `${total} leads in campaign` : 'No leads imported yet'}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium transition-colors mt-1 px-4 py-2 rounded-lg border"
          style={{ color: '#2BCEF7', borderColor: 'rgba(43,206,247,0.25)', background: 'rgba(43,206,247,0.05)' }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
          className="w-56 focus:border-[#2BCEF7]"
        />
        <div className="w-44">
          <CustomSelect
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            options={[
              { value: '', label: 'All statuses' },
              ...STATUSES.map(s => ({ value: s, label: s.replace(/_/g, ' ') })),
            ]}
          />
        </div>
        <div className="w-36">
          <CustomSelect
            value={source}
            onChange={setSource}
            placeholder="All sources"
            options={[
              { value: '', label: 'All sources' },
              { value: 'close_crm', label: 'Close CRM' },
              { value: 'sales_navigator', label: 'Sales Navigator' },
            ]}
          />
        </div>
        {(status || source || search) && (
          <button
            onClick={() => { setStatus(''); setSource(''); setSearch(''); }}
            className="px-3 py-2 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="py-20 text-center text-sm" style={{ color: 'var(--text-subtle)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm" style={{ color: 'var(--text-subtle)' }}>No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-section)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr
                    key={lead.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-row)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-row)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={e => ((e.target as HTMLElement).style.color = '#2BCEF7')}
                        onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text)')}
                      >
                        {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{lead.company ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border"
                        style={lead.source === 'close_crm'
                          ? { background: 'rgba(43,206,247,0.07)', color: '#2BCEF7', borderColor: 'rgba(43,206,247,0.2)' }
                          : { background: 'rgba(139,92,246,0.07)', color: '#a78bfa', borderColor: 'rgba(139,92,246,0.2)' }
                        }
                      >
                        {lead.source === 'close_crm' ? 'Close CRM' : 'Sales Nav'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--text-subtle)' }}>
                      {timeAgo(lead.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors text-xs"
                        style={{ color: 'var(--text-dim)' }}
                        onMouseEnter={e => ((e.target as HTMLElement).style.color = '#2BCEF7')}
                        onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-dim)')}
                        title="View on LinkedIn"
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>{total} leads · page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
