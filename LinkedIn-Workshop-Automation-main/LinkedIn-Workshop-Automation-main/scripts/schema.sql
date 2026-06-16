-- =============================================================================
-- LinkedIn Workshop Automation — Supabase Schema
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: leads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name   TEXT,
    last_name    TEXT,
    company      TEXT,
    -- Stored normalized: lowercase, no trailing slash, no query params, https
    linkedin_url TEXT UNIQUE NOT NULL,
    source       TEXT NOT NULL
                     CHECK (source IN ('close_crm', 'sales_navigator')),
    email        TEXT,
    status       TEXT NOT NULL DEFAULT 'imported'
                     CHECK (status IN (
                         'imported',
                         'campaign_added',
                         'connection_sent',
                         'connected',
                         'message_1_sent',
                         'follow_up_sent',
                         'replied_positive',
                         'replied_negative',
                         'replied_ambiguous',
                         'link_sent'
                     )),
    heyreach_id  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Table: events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lead_id     BIGINT NOT NULL REFERENCES leads (id),
    event_type  TEXT NOT NULL,
    event_data  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_url ON leads (linkedin_url);
CREATE INDEX IF NOT EXISTS idx_leads_heyreach_id  ON leads (heyreach_id);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads (status);
CREATE INDEX IF NOT EXISTS idx_events_lead_id     ON events (lead_id);

-- ---------------------------------------------------------------------------
-- Trigger: keep leads.updated_at current on every UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_leads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;

CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_leads_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) — RECOMMENDATION
-- =============================================================================
--
-- Background
-- ----------
-- Supabase enables RLS per table.  When RLS is ON and no policy matches,
-- every query returns zero rows (for reads) or raises an error (for writes),
-- regardless of the SQL role — EXCEPT for the built-in `service_role` JWT,
-- which bypasses RLS entirely.
--
-- This application's server-side code connects with the `service_role` key
-- (via the SUPABASE_SERVICE_ROLE_KEY env var).  The dashboard and all
-- automation scripts run server-side only; there is no direct browser/anon
-- access to these tables.
--
-- Recommendation: leave RLS DISABLED on both tables
-- -------------------------------------------------
-- Because only the service_role key touches these tables, enabling RLS adds
-- operational complexity with no security benefit:
--   • service_role bypasses RLS anyway, so policies don't protect anything.
--   • Mistakes in policy definitions could silently hide rows during debugging.
--   • Keeping RLS off makes psql / Supabase Studio inspection straightforward.
--
-- If you later expose either table to anon or authenticated JWT clients
-- (e.g. a public-facing dashboard), enable RLS and add explicit policies:
--
--   ALTER TABLE leads  ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
--
--   -- Allow service_role full access (redundant but self-documenting):
--   CREATE POLICY "service_role_all" ON leads
--       FOR ALL TO service_role USING (true) WITH CHECK (true);
--   CREATE POLICY "service_role_all" ON events
--       FOR ALL TO service_role USING (true) WITH CHECK (true);
--
--   -- Example: let authenticated users read only their own lead's events:
--   CREATE POLICY "auth_read_own_events" ON events
--       FOR SELECT TO authenticated
--       USING (lead_id IN (
--           SELECT id FROM leads WHERE email = auth.email()
--       ));
--
-- Until that requirement arises, no ALTER TABLE … ENABLE ROW LEVEL SECURITY
-- statement is needed here.
-- =============================================================================
