export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });

  const { lead_ids } = await req.json();
  if (!Array.isArray(lead_ids) || lead_ids.length === 0)
    return NextResponse.json({ error: 'No leads provided' }, { status: 400 });

  const n8nUrl = process.env.N8N_WF06_WEBHOOK_URL;
  if (!n8nUrl) return NextResponse.json({ error: 'N8N_WF06_WEBHOOK_URL not configured' }, { status: 500 });

  const db = getSupabase();

  // Fetch the post
  const { data: post, error: postErr } = await db
    .from('posts')
    .select('id, url, title')
    .eq('id', postId)
    .single();
  if (postErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  // Fetch lead details
  const { data: leads, error: leadsErr } = await db
    .from('leads')
    .select('id, first_name, last_name, company, linkedin_url, heyreach_id')
    .in('id', lead_ids);
  if (leadsErr) return NextResponse.json({ error: leadsErr.message }, { status: 500 });

  // Trigger n8n WF-06
  let n8nRes: Response;
  try {
    n8nRes = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, post_url: post.url, leads }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Could not reach n8n', detail: msg }, { status: 502 });
  }

  if (n8nRes.status >= 400) {
    const text = await n8nRes.text().catch(() => '');
    return NextResponse.json({ error: `n8n returned ${n8nRes.status}`, detail: text }, { status: 502 });
  }

  return NextResponse.json({ success: true, sent_to: leads?.length ?? 0 });
}
