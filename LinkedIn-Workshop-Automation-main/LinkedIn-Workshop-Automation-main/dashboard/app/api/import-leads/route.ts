import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const n8nUrl = process.env.N8N_WF01_WEBHOOK_URL;
  if (!n8nUrl) {
    return NextResponse.json({ error: 'N8N_WF01_WEBHOOK_URL not configured' }, { status: 500 });
  }

  const formData = await req.formData();

  let res: Response;
  try {
    res = await fetch(n8nUrl, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Could not reach n8n', detail: msg }, { status: 502 });
  }

  if (res.status >= 400) {
    const text = await res.text().catch(() => '');
    return NextResponse.json({ error: `n8n returned ${res.status}`, detail: text }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
