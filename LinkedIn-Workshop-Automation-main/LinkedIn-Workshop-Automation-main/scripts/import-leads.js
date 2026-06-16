const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');
const { normalizeLinkedInUrl } = require('./normalize');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../dashboard/.env') });

// --- CLI args ---
const argv = process.argv.slice(2);
const getArg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : null;
};

const source = getArg('source');
const file = getArg('file');

if (!source || !['close_crm', 'sales_navigator'].includes(source)) {
  console.error('Usage: --source <close_crm|sales_navigator> --file <csv-path>');
  process.exit(1);
}
if (!file) {
  console.error('Usage: --source <close_crm|sales_navigator> --file <csv-path>');
  process.exit(1);
}

// --- Column mapping per source ---
const COLUMNS = {
  close_crm: {
    firstName: 'First Name',
    lastName: 'Last Name',
    companyName: 'Company Name',
    linkedinUrl: 'LinkedIn',
    email: 'Email',
  },
  sales_navigator: {
    firstName: 'First Name',
    lastName: 'Last Name',
    companyName: 'Company',
    linkedinUrl: 'Profile URL',
    email: null,
  },
};

// --- CSV field quoting ---
function csvField(value) {
  const s = value == null ? '' : String(value);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in dashboard/.env');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Read and strip UTF-8 BOM
  let content = fs.readFileSync(path.resolve(file), 'utf-8');
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  // Auto-detect delimiter
  const delimiter = content.split('\n')[0].includes(';') ? ';' : ',';

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    trim: true,
  });

  const cols = COLUMNS[source];
  const counts = { total: records.length, inserted: 0, duplicate: 0, missing_url: 0 };
  const insertedRows = [];

  for (const record of records) {
    const rawUrl = record[cols.linkedinUrl] ?? '';
    const normalized = normalizeLinkedInUrl(rawUrl);

    if (!normalized) {
      counts.missing_url++;
      continue;
    }

    // Check for existing lead
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('linkedin_url', normalized)
      .maybeSingle();

    if (existing) {
      counts.duplicate++;
      continue;
    }

    const payload = {
      first_name: record[cols.firstName] || null,
      last_name: record[cols.lastName] || null,
      company: record[cols.companyName] || null,
      linkedin_url: normalized,
      email: cols.email ? (record[cols.email] || null) : null,
      source,
      status: 'imported',
    };

    const { error } = await supabase.from('leads').insert(payload);

    if (error) {
      if (error.code === '23505') {
        counts.duplicate++;
      } else {
        console.error(`Row error (${normalized}):`, error.message);
      }
      continue;
    }

    counts.inserted++;
    insertedRows.push({
      firstName: payload.first_name,
      lastName: payload.last_name,
      companyName: payload.company,
      profileUrl: normalized,
      email: payload.email,
    });
  }

  // Write HeyReach export
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(
    __dirname,
    `../sample-csv/heyreach-import-${source}-${timestamp}.csv`
  );

  const lines = [
    'firstName,lastName,companyName,profileUrl,email',
    ...insertedRows.map((r) =>
      [r.firstName, r.lastName, r.companyName, r.profileUrl, r.email]
        .map(csvField)
        .join(',')
    ),
  ];
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');

  console.log('\nSummary');
  console.log(`  Total rows:  ${counts.total}`);
  console.log(`  Inserted:    ${counts.inserted}`);
  console.log(`  Duplicates:  ${counts.duplicate}`);
  console.log(`  Missing URL: ${counts.missing_url}`);
  console.log(`  Output:      ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
