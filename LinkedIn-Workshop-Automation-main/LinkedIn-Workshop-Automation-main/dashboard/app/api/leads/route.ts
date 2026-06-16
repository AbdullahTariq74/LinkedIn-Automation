export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const page     = Math.max(1, parseInt(sp.get('page')     ?? '1',  10));
    const pageSize = Math.max(1, parseInt(sp.get('pageSize') ?? '25', 10));
    const status   = sp.get('status')  ?? undefined;
    const source   = sp.get('source')  ?? undefined;

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    const supabase = getSupabase();

    let query = supabase
      .from('leads')
      .select(
        'id,first_name,last_name,company,linkedin_url,source,status,updated_at',
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);

    const { data: rows, count, error } = await query;

    if (error) throw error;

    return Response.json({ rows, total: count, page, pageSize });
  } catch (err) {
    console.error('[GET /api/leads]', err);
    return Response.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}
