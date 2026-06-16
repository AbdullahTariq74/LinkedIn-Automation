'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Post {
  id: number;
  url: string;
  title: string | null;
  day_number: number | null;
  created_at: string;
}

interface EligibleLead {
  id: number;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  linkedin_url: string;
  heyreach_id: string | null;
}

export default function PostsPage() {
  const [posts, setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);
  const [url, setUrl]               = useState('');
  const [title, setTitle]           = useState('');
  const [dayNumber, setDayNumber]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [addError, setAddError]     = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [deleting, setDeleting]     = useState<number | null>(null);

  // Send flow state
  const [sendPost, setSendPost]               = useState<Post | null>(null);
  const [eligible, setEligible]               = useState<EligibleLead[]>([]);
  const [checkedIds, setCheckedIds]           = useState<Set<number>>(new Set());
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [sendStatus, setSendStatus]           = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sendError, setSendError]             = useState('');
  const [sentCount, setSentCount]             = useState(0);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/posts');
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setAddError('');
    setAddSuccess('');

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url.trim(),
        title: title.trim() || null,
        day_number: dayNumber ? parseInt(dayNumber, 10) : null,
      }),
    });

    if (res.ok) {
      setUrl(''); setTitle(''); setDayNumber('');
      setAddSuccess('Post saved.');
      await load();
      setTimeout(() => setAddSuccess(''), 3000);
    } else {
      const j = await res.json().catch(() => ({}));
      setAddError(j.error ?? 'Failed to save post.');
    }
    setSaving(false);
  }

  async function deletePost(id: number) {
    setDeleting(id);
    const res = await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      if (sendPost?.id === id) closeSendPanel();
      await load();
    }
    setDeleting(null);
  }

  async function openSendPanel(post: Post) {
    if (sendPost?.id === post.id) { closeSendPanel(); return; }
    setSendPost(post);
    setEligible([]);
    setCheckedIds(new Set());
    setSendStatus('idle');
    setSendError('');
    setSentCount(0);
    setLoadingEligible(true);
    const res = await fetch(`/api/posts/${post.id}/eligible`);
    if (res.ok) {
      const leads: EligibleLead[] = await res.json();
      setEligible(leads);
      // default: all checked
      setCheckedIds(new Set(leads.map(l => l.id)));
    }
    setLoadingEligible(false);
  }

  function closeSendPanel() {
    setSendPost(null);
    setEligible([]);
    setCheckedIds(new Set());
    setSendStatus('idle');
    setSendError('');
    setSentCount(0);
  }

  function toggleLead(id: number) {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleAll() {
    if (checkedIds.size === eligible.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(eligible.map(l => l.id)));
    }
  }

  async function confirmSend() {
    if (!sendPost || checkedIds.size === 0) return;
    setSendStatus('sending');
    setSendError('');

    const res = await fetch(`/api/posts/${sendPost.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: Array.from(checkedIds) }),
    });

    if (res.ok) {
      const j = await res.json();
      setSentCount(j.sent_to ?? checkedIds.size);
      setSendStatus('sent');
    } else {
      const j = await res.json().catch(() => ({}));
      setSendError(j.error ?? 'Send failed.');
      setSendStatus('error');
    }
  }

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  } as const;

  const allChecked  = eligible.length > 0 && checkedIds.size === eligible.length;
  const someChecked = checkedIds.size > 0 && checkedIds.size < eligible.length;

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: '#2BCEF7' }}>
          LinkedIn Posts
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Post Links</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>
          Save a post URL, then choose which connected leads receive it.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Add a post</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
              LinkedIn Post URL *
            </label>
            <input
              type="url"
              placeholder="https://www.linkedin.com/posts/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                Title (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Workshop intro post"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
                Day # (optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={dayNumber}
                onChange={e => setDayNumber(e.target.value)}
                min={1}
                style={inputStyle}
              />
            </div>
          </div>

          {addError && (
            <div className="rounded-lg px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {addError}
            </div>
          )}
          {addSuccess && (
            <div className="rounded-lg px-4 py-3 text-sm"
              style={{ background: 'rgba(43,206,247,0.06)', border: '1px solid rgba(43,206,247,0.2)', color: '#2BCEF7' }}>
              {addSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !url.trim()}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#2BCEF7', color: '#070C14' }}
          >
            {saving ? 'Saving…' : 'Save Post'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-subtle)' }}>
          Saved posts ({posts.length})
        </p>

        {loading ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            No posts saved yet.
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id}>
              {/* Post card */}
              <div
                className="rounded-xl border p-4"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: sendPost?.id === post.id ? 'rgba(43,206,247,0.4)' : 'var(--border)',
                  borderBottomLeftRadius: sendPost?.id === post.id ? 0 : undefined,
                  borderBottomRightRadius: sendPost?.id === post.id ? 0 : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.day_number != null && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(43,206,247,0.12)', color: '#2BCEF7' }}>
                          Day {post.day_number}
                        </span>
                      )}
                      {post.title && (
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {post.title}
                        </span>
                      )}
                    </div>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs block truncate hover:underline"
                      style={{ color: 'var(--text-subtle)' }}
                    >
                      {post.url}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openSendPanel(post)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      style={{
                        background: sendPost?.id === post.id ? 'rgba(43,206,247,0.15)' : 'rgba(43,206,247,0.08)',
                        border: '1px solid rgba(43,206,247,0.25)',
                        color: '#2BCEF7',
                      }}
                    >
                      {sendPost?.id === post.id ? 'Cancel' : 'Send to leads'}
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={deleting === post.id}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171',
                      }}
                    >
                      {deleting === post.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Send panel */}
              {sendPost?.id === post.id && (
                <div
                  className="rounded-b-xl border border-t-0 p-4 space-y-4"
                  style={{ background: 'var(--bg-input)', borderColor: 'rgba(43,206,247,0.4)' }}
                >
                  {loadingEligible ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking eligible leads…</p>

                  ) : sendStatus === 'sent' ? (
                    <div className="rounded-lg px-4 py-3 text-sm"
                      style={{ background: 'rgba(43,206,247,0.06)', border: '1px solid rgba(43,206,247,0.2)', color: '#2BCEF7' }}>
                      Sent to {sentCount} lead{sentCount !== 1 ? 's' : ''}. n8n is processing the messages.
                    </div>

                  ) : eligible.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No eligible leads right now — leads must be connected and not have received this post yet.
                    </p>

                  ) : (
                    <>
                      {/* Header row: count + select-all */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {checkedIds.size} of {eligible.length} lead{eligible.length !== 1 ? 's' : ''} selected
                        </p>
                        <button
                          onClick={toggleAll}
                          className="text-xs font-medium"
                          style={{ color: '#2BCEF7' }}
                        >
                          {allChecked ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>

                      {/* Checkable lead list */}
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {eligible.map(lead => {
                          const checked = checkedIds.has(lead.id);
                          return (
                            <label
                              key={lead.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                              style={{
                                background: checked ? 'rgba(43,206,247,0.06)' : 'var(--bg-card)',
                                border: `1px solid ${checked ? 'rgba(43,206,247,0.2)' : 'transparent'}`,
                              }}
                            >
                              {/* Custom checkbox */}
                              <div
                                className="shrink-0 w-4 h-4 rounded flex items-center justify-center"
                                style={{
                                  background: checked ? '#2BCEF7' : 'transparent',
                                  border: `2px solid ${checked ? '#2BCEF7' : 'var(--border)'}`,
                                }}
                              >
                                {checked && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="#070C14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleLead(lead.id)}
                                className="sr-only"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                  {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'}
                                </span>
                                {lead.company && (
                                  <span className="text-xs ml-2" style={{ color: 'var(--text-subtle)' }}>
                                    {lead.company}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {sendStatus === 'error' && (
                        <div className="rounded-lg px-4 py-3 text-sm"
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                          {sendError}
                        </div>
                      )}

                      <button
                        onClick={confirmSend}
                        disabled={checkedIds.size === 0 || sendStatus === 'sending'}
                        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: checkedIds.size > 0 ? '#2BCEF7' : 'rgba(43,206,247,0.3)', color: '#070C14' }}
                      >
                        {sendStatus === 'sending'
                          ? 'Sending…'
                          : checkedIds.size === 0
                          ? 'Select at least one lead'
                          : `Send to ${checkedIds.size} lead${checkedIds.size !== 1 ? 's' : ''}`}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
