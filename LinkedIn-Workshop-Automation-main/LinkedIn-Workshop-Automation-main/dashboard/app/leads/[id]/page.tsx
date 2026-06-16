import { getSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';

type Lead = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  linkedin_url: string;
  source: string;
  email: string | null;
  status: string;
  heyreach_id: string | null;
  created_at: string;
  updated_at: string;
};

type Event = {
  event_type: string;
  created_at: string;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const EVENT_ICON: Record<string, string> = {
  imported:           '📥',
  campaign_added:     '🚀',
  connection_sent:    '📤',
  connected:          '🤝',
  message_1_sent:     '💬',
  follow_up_sent:     '🔁',
  replied_positive:   '✅',
  replied_negative:   '❌',
  replied_ambiguous:  '❓',
  link_sent:          '🔗',
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (leadError || !lead) notFound();

  const { data: events } = await supabase
    .from('events')
    .select('event_type,created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: true });

  const l = lead as Lead;
  const fullName = [l.first_name, l.last_name].filter(Boolean).join(' ') || 'Unknown Lead';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/leads"
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--text-subtle)' }}
        >
          ← Leads
        </Link>
      </div>

      {/* Lead card */}
      <div className="rounded-xl p-6 space-y-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{fullName}</h1>
            {l.company && <p className="mt-0.5" style={{ color: 'var(--text-muted)' }}>{l.company}</p>}
          </div>
          <StatusBadge status={l.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm" style={{ borderTop: '1px solid var(--border-section)', paddingTop: '20px' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>Source</p>
            <p style={{ color: 'var(--text)' }}>
              {l.source === 'close_crm' ? 'Close CRM' : 'Sales Navigator'}
            </p>
          </div>
          {l.email && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>Email</p>
              <p style={{ color: 'var(--text)' }}>{l.email}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>Added</p>
            <p style={{ color: 'var(--text)' }}>{formatDate(l.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>Last Updated</p>
            <p style={{ color: 'var(--text)' }}>{formatDate(l.updated_at)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>LinkedIn Profile</p>
            <a
              href={l.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors break-all text-sm"
              style={{ color: '#2BCEF7' }}
            >
              {l.linkedin_url} ↗
            </a>
          </div>
          {l.heyreach_id && (
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-subtle)' }}>Heyreach ID</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-subtle)' }}>{l.heyreach_id}</p>
            </div>
          )}
        </div>
      </div>

      {/* Event timeline */}
      <div className="rounded-xl p-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-subtle)' }}>
          Event Timeline
        </h2>

        {!events || events.length === 0 ? (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>No events recorded yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px" style={{ background: 'rgba(43,206,247,0.1)' }} />
            <ol className="space-y-4">
              {(events as Event[]).map((ev, i) => (
                <li key={i} className="flex gap-4 items-start pl-1">
                  <div
                    className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm flex-shrink-0 border"
                    style={{ background: 'rgba(43,206,247,0.08)', borderColor: 'rgba(43,206,247,0.2)' }}
                  >
                    {EVENT_ICON[ev.event_type] ?? '•'}
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>
                      {ev.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{formatDate(ev.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
