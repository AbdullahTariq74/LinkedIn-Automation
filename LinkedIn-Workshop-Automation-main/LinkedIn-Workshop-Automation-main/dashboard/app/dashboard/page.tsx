import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';

type Stats = {
  total: number;
  imported: number;
  campaign_added: number;
  connection_sent: number;
  connected: number;
  message_1_sent: number;
  follow_up_sent: number;
  replied_positive: number;
  replied_negative: number;
  replied_ambiguous: number;
  link_sent: number;
};

function pct(num: number, den: number): string {
  if (!den) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

export default async function DashboardPage() {
  const { data, error } = await getSupabase().rpc('get_campaign_stats');

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/40 p-6 text-red-400">
        Failed to load stats. Check Supabase connection.
      </div>
    );
  }

  const s: Stats = data;

  const totalConnectionSent =
    s.connection_sent + s.connected + s.message_1_sent + s.follow_up_sent +
    s.replied_positive + s.replied_negative + s.replied_ambiguous + s.link_sent;

  const totalConnected =
    s.connected + s.message_1_sent + s.follow_up_sent +
    s.replied_positive + s.replied_negative + s.replied_ambiguous + s.link_sent;

  const totalMessageSent =
    s.message_1_sent + s.follow_up_sent +
    s.replied_positive + s.replied_negative + s.replied_ambiguous + s.link_sent;

  const totalReplies =
    s.replied_positive + s.replied_negative + s.replied_ambiguous + s.link_sent;

  const totalPositive = s.replied_positive + s.link_sent;

  const acceptanceRate = totalConnectionSent ? Math.round((totalConnected / totalConnectionSent) * 100) : 0;
  const replyRate      = totalMessageSent    ? Math.round((totalReplies    / totalMessageSent)    * 100) : 0;

  const cards = [
    {
      label: 'Total Leads',
      value: s.total,
      sub: `${s.imported} imported · ${s.campaign_added} pending`,
      accent: '',
      glow: '',
    },
    {
      label: 'Connection Requests Sent',
      value: totalConnectionSent,
      sub: `${pct(totalConnectionSent, s.total)} of total leads`,
      accent: 'text-[#2BCEF7]',
      glow: 'shadow-[0_0_20px_rgba(43,206,247,0.08)]',
    },
    {
      label: 'Connections Accepted',
      value: totalConnected,
      sub: `out of ${totalConnectionSent} requests sent`,
      accent: 'text-[#2BCEF7]',
      glow: 'shadow-[0_0_20px_rgba(43,206,247,0.08)]',
    },
    {
      label: 'Acceptance Rate',
      value: `${acceptanceRate}%`,
      sub: `${totalConnected} accepted / ${totalConnectionSent} sent`,
      accent: 'text-[#2BCEF7]',
      glow: 'shadow-[0_0_20px_rgba(43,206,247,0.08)]',
    },
    {
      label: 'Messages Sent',
      value: totalMessageSent,
      sub: `${s.message_1_sent} msg 1 · ${s.follow_up_sent} follow-ups`,
      accent: 'text-violet-400',
      glow: '',
    },
    {
      label: 'Replies Received',
      value: totalReplies,
      sub: `out of ${totalMessageSent} messages sent`,
      accent: 'text-[#FF892D]',
      glow: 'shadow-[0_0_20px_rgba(255,137,45,0.08)]',
    },
    {
      label: 'Reply Rate',
      value: `${replyRate}%`,
      sub: `${totalReplies} replies / ${totalMessageSent} messages`,
      accent: 'text-[#FF892D]',
      glow: 'shadow-[0_0_20px_rgba(255,137,45,0.08)]',
    },
    {
      label: 'Positive Replies',
      value: totalPositive,
      sub: `${s.replied_positive} pending link · ${s.link_sent} sent`,
      accent: 'text-[#FA947A]',
      glow: 'shadow-[0_0_20px_rgba(250,148,122,0.08)]',
    },
    {
      label: 'Landing Page Links Sent',
      value: s.link_sent,
      sub: 'workshop URL delivered to lead',
      accent: 'text-[#FF892D]',
      glow: 'shadow-[0_0_20px_rgba(255,137,45,0.12)]',
    },
  ];

  const breakdown = [
    { label: 'Imported',          value: s.imported,          color: 'bg-white/20' },
    { label: 'Campaign Added',    value: s.campaign_added,    color: 'bg-[#2BCEF7]/50' },
    { label: 'Connection Sent',   value: s.connection_sent,   color: 'bg-[#2BCEF7]/70' },
    { label: 'Connected',         value: s.connected,         color: 'bg-[#2BCEF7]' },
    { label: 'Message 1 Sent',    value: s.message_1_sent,    color: 'bg-violet-500' },
    { label: 'Follow-up Sent',    value: s.follow_up_sent,    color: 'bg-violet-400' },
    { label: 'Replied Positive',  value: s.replied_positive,  color: 'bg-[#FA947A]' },
    { label: 'Link Sent',         value: s.link_sent,         color: 'bg-[#FF892D]' },
    { label: 'Replied Negative',  value: s.replied_negative,  color: 'bg-red-500' },
    { label: 'Replied Ambiguous', value: s.replied_ambiguous, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--brand-cyan)' }}>
            Live Campaign
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Campaign Overview</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>Workshop_June30_2026_DE · Michael Ohlmer · June 30, 2026</p>
        </div>
        <Link
          href="/leads"
          className="text-sm font-medium transition-colors mt-1 px-4 py-2 rounded-lg border"
          style={{ color: 'var(--brand-cyan)', borderColor: 'rgba(43,206,247,0.25)', background: 'rgba(43,206,247,0.05)' }}
        >
          View all leads →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div
            key={card.label}
            className={`rounded-xl p-5 space-y-2 border transition-all ${card.glow}`}
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>{card.label}</p>
            <p
              className={`text-3xl font-bold tracking-tight ${card.accent}`}
              style={card.accent ? {} : { color: 'var(--text)' }}
            >{card.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="rounded-xl p-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Status Breakdown</h2>
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-subtle)' }}>{s.total} total leads</span>
        </div>
        <div className="space-y-3">
          {breakdown.map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.color}`} />
              <span className="text-sm w-40 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
              <div className="flex-1 rounded-full h-1 overflow-hidden" style={{ background: 'var(--border-section)' }}>
                <div
                  className={`h-full rounded-full ${row.color} transition-all duration-700`}
                  style={{ width: s.total ? `${Math.max(row.value ? 2 : 0, (row.value / s.total) * 100)}%` : '0%' }}
                />
              </div>
              <span className="text-sm w-8 text-right tabular-nums font-medium" style={{ color: 'var(--text-muted)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
