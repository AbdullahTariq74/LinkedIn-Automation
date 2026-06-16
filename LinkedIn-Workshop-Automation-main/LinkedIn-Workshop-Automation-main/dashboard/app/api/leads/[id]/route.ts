export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadError) throw leadError;
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('event_type,created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: true });

    if (eventsError) throw eventsError;

    return Response.json({ lead, events });
  } catch (err: unknown) {
    // Supabase returns code PGRST116 when .single() finds no rows
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'PGRST116'
    ) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    console.error('[GET /api/leads/[id]]', err);
    return Response.json({ error: 'Failed to load lead' }, { status: 500 });
  }
}
