export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_campaign_stats');

    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    console.error('[GET /api/stats]', err);
    return Response.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
