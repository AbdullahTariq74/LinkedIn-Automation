type BadgeStyle = { bg: string; color: string; border: string };

const BADGE: Record<string, BadgeStyle> = {
  imported:          { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',  border: 'rgba(255,255,255,0.1)' },
  campaign_added:    { bg: 'rgba(43,206,247,0.08)',  color: '#2BCEF7',               border: 'rgba(43,206,247,0.2)'  },
  connection_sent:   { bg: 'rgba(43,206,247,0.1)',   color: '#2BCEF7',               border: 'rgba(43,206,247,0.3)'  },
  connected:         { bg: 'rgba(43,206,247,0.15)',  color: '#2BCEF7',               border: 'rgba(43,206,247,0.4)'  },
  message_1_sent:    { bg: 'rgba(139,92,246,0.1)',   color: '#a78bfa',               border: 'rgba(139,92,246,0.3)'  },
  follow_up_sent:    { bg: 'rgba(139,92,246,0.15)',  color: '#c4b5fd',               border: 'rgba(139,92,246,0.4)'  },
  replied_positive:  { bg: 'rgba(250,148,122,0.1)',  color: '#FA947A',               border: 'rgba(250,148,122,0.3)' },
  replied_negative:  { bg: 'rgba(239,68,68,0.1)',    color: '#f87171',               border: 'rgba(239,68,68,0.3)'   },
  replied_ambiguous: { bg: 'rgba(234,179,8,0.1)',    color: '#fbbf24',               border: 'rgba(234,179,8,0.3)'   },
  link_sent:         { bg: 'rgba(255,137,45,0.12)',  color: '#FF892D',               border: 'rgba(255,137,45,0.35)' },
};

const LABEL: Record<string, string> = {
  imported:          'Imported',
  campaign_added:    'Campaign Added',
  connection_sent:   'Connection Sent',
  connected:         'Connected',
  message_1_sent:    'Message 1 Sent',
  follow_up_sent:    'Follow-up Sent',
  replied_positive:  'Replied Positive',
  replied_negative:  'Replied Negative',
  replied_ambiguous: 'Ambiguous',
  link_sent:         'Link Sent',
};

export function StatusBadge({ status }: { status: string }) {
  const s = BADGE[status] ?? BADGE.imported;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
