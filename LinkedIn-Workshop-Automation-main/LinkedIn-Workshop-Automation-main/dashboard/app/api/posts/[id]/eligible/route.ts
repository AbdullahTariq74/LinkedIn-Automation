export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const EXCLUDED_STATUSES = ['imported', 'campaign_added', 'connection_sent'];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });

  const db = getSupabase();

  const { data: alreadySent } = await db
    .from('post_sends')
    .select('lead_id')
    .eq('post_id', postId);

  const sentIds = new Set((alreadySent ?? []).map((r: { lead_id: number }) => r.lead_id));

  const { data, error } = await db
    .from('leads')
    .select('id, first_name, last_name, company, linkedin_url, heyreach_id, status');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eligible = (data ?? []).filter((lead: {
    id: number;
    status: string;
  }) =>
    !EXCLUDED_STATUSES.includes(lead.status) &&
    !sentIds.has(lead.id)
  );

  return NextResponse.json(eligible);
}
