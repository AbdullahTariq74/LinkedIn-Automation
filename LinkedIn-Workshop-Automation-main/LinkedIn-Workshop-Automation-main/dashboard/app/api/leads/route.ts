export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const CONNECTED_PLUS = [
  'connected', 'message_1_sent', 'follow_up_sent',
  'replied_positive', 'replied_negative', 'replied_ambiguous', 'link_sent',
];

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const page       = Math.max(1, parseInt(sp.get('page')     ?? '1',  10));
    const pageSize   = Math.max(1, parseInt(sp.get('pageSize') ?? '25', 10));
    const status     = sp.get('status')  ?? undefined;
    const source     = sp.get('source')  ?? undefined;
    const exportMode = sp.get('export')  === 'true';

    const supabase = getSupabase();

    let query = supabase
      .from('leads')
      .select(
        'id,first_name,last_name,company,linkedin_url,source,status,updated_at',
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false });

    if (status === 'connected_plus') {
      query = query.in('status', CONNECTED_PLUS);
    } else if (status) {
      query = query.eq('status', status);
    }
    if (source) query = query.eq('source', source);

    if (exportMode) {
      query = query.limit(10000);
    } else {
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    }

    const { data: rows, count, error } = await query;
    if (error) throw error;

    if (exportMode) {
      const lines = [
        'First Name,Last Name,Company,LinkedIn URL,Status',
        ...(rows ?? []).map(r =>
          [r.first_name ?? '', r.last_name ?? '', r.company ?? '', r.linkedin_url, r.status]
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ];
      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="leads-export.csv"',
        },
      });
    }

    return Response.json({ rows, total: count, page, pageSize });
  } catch (err) {
    console.error('[GET /api/leads]', err);
    return Response.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}
