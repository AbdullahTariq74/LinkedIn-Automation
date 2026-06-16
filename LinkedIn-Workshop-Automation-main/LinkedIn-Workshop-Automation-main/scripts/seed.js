// Run from repo root: node scripts/seed.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../dashboard/.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in dashboard/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const LEADS = [
  {
    first_name: 'Klaus',     last_name: 'Müller',
    company: 'Müller Industrietechnik GmbH',
    linkedin_url: 'https://linkedin.com/in/klaus-muller',
    source: 'sales_navigator', status: 'imported',
    email: 'k.mueller@mueller-industrietechnik.de',
  },
  {
    first_name: 'Sabine',    last_name: 'Bauer',
    company: 'Bauer & Partner Unternehmensberatung AG',
    linkedin_url: 'https://linkedin.com/in/sabine-bauer',
    source: 'sales_navigator', status: 'imported',
    email: 'sabine.bauer@bauer-partner.de',
  },
  {
    first_name: 'Thomas',    last_name: 'Schmidt',
    company: 'Schmidt Digital Solutions GmbH',
    linkedin_url: 'https://linkedin.com/in/thomas-schmidt',
    source: 'close_crm', status: 'connection_sent',
    email: 'thomas.schmidt@schmidt-digital.de',
  },
  {
    first_name: 'Petra',     last_name: 'Weber',
    company: 'Weber Maschinenbau AG',
    linkedin_url: 'https://linkedin.com/in/petra-weber',
    source: 'sales_navigator', status: 'connected',
    email: 'p.weber@weber-maschinenbau.de',
  },
  {
    first_name: 'Andreas',   last_name: 'Fischer',
    company: 'Fischer Logistik GmbH',
    linkedin_url: 'https://linkedin.com/in/andreas-fischer',
    source: 'close_crm', status: 'message_1_sent',
    email: 'a.fischer@fischer-logistik.de',
  },
  {
    first_name: 'Monika',    last_name: 'Hoffmann',
    company: 'Hoffmann & Söhne Handelsgesellschaft mbH',
    linkedin_url: 'https://linkedin.com/in/monika-hoffmann',
    source: 'sales_navigator', status: 'follow_up_sent',
    email: 'monika.hoffmann@hoffmann-soehne.de',
  },
  {
    first_name: 'Stefan',    last_name: 'Wagner',
    company: 'Wagner Finanzberatung AG',
    linkedin_url: 'https://linkedin.com/in/stefan-wagner',
    source: 'close_crm', status: 'replied_positive',
    email: 's.wagner@wagner-finanz.de',
  },
  {
    first_name: 'Brigitte',  last_name: 'Schulz',
    company: 'Schulz IT-Systeme GmbH',
    linkedin_url: 'https://linkedin.com/in/brigitte-schulz',
    source: 'sales_navigator', status: 'replied_negative',
    email: 'b.schulz@schulz-itsysteme.de',
  },
  {
    first_name: 'Markus',    last_name: 'Zimmermann',
    company: 'Zimmermann Bauplanung GmbH',
    linkedin_url: 'https://linkedin.com/in/markus-zimmermann',
    source: 'close_crm', status: 'replied_ambiguous',
    email: 'm.zimmermann@zimmermann-bau.de',
  },
  {
    first_name: 'Helga',     last_name: 'Braun',
    company: 'Braun Personalmanagement GmbH',
    linkedin_url: 'https://linkedin.com/in/helga-braun',
    source: 'sales_navigator', status: 'link_sent',
    email: 'h.braun@braun-personal.de',
  },
];

// 1–2 events per lead, keyed by status
const eventsByStatus = {
  imported:          [{ event_type: 'lead_imported',   event_data: { source: 'sales_navigator' } }],
  connection_sent:   [{ event_type: 'lead_imported',   event_data: null },
                      { event_type: 'connection_sent', event_data: null }],
  connected:         [{ event_type: 'connection_sent', event_data: null },
                      { event_type: 'connected',       event_data: null }],
  message_1_sent:    [{ event_type: 'connected',       event_data: null },
                      { event_type: 'message_1_sent',  event_data: { template: 'intro_v2' } }],
  follow_up_sent:    [{ event_type: 'message_1_sent',  event_data: { template: 'intro_v2' } },
                      { event_type: 'follow_up_sent',  event_data: { template: 'followup_v1' } }],
  replied_positive:  [{ event_type: 'follow_up_sent',  event_data: null },
                      { event_type: 'reply_received',  event_data: { sentiment: 'positive' } }],
  replied_negative:  [{ event_type: 'follow_up_sent',  event_data: null },
                      { event_type: 'reply_received',  event_data: { sentiment: 'negative' } }],
  replied_ambiguous: [{ event_type: 'follow_up_sent',  event_data: null },
                      { event_type: 'reply_received',  event_data: { sentiment: 'ambiguous' } }],
  link_sent:         [{ event_type: 'reply_received',  event_data: { sentiment: 'positive' } },
                      { event_type: 'link_sent',       event_data: { url: 'https://calendly.com/example' } }],
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  try {
    console.log('Deleting existing events…');
    const { error: evDelErr } = await supabase
      .from('events')
      .delete()
      .not('id', 'is', null);
    if (evDelErr) throw evDelErr;

    console.log('Deleting existing leads…');
    const { error: ldDelErr } = await supabase
      .from('leads')
      .delete()
      .not('id', 'is', null);
    if (ldDelErr) throw ldDelErr;

    console.log('Inserting leads…');
    const { data: inserted, error: insErr } = await supabase
      .from('leads')
      .insert(LEADS)
      .select('id,status');
    if (insErr) throw insErr;

    console.log('Inserting events…');
    const eventRows = inserted.flatMap(({ id: lead_id, status }) =>
      (eventsByStatus[status] ?? []).map((ev) => ({ lead_id, ...ev }))
    );
    const { error: evInsErr } = await supabase
      .from('events')
      .insert(eventRows);
    if (evInsErr) throw evInsErr;

    console.log(`Done. Inserted ${inserted.length} leads and ${eventRows.length} events.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();
