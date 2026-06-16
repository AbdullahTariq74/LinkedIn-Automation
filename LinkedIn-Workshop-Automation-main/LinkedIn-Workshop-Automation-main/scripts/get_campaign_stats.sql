CREATE OR REPLACE FUNCTION get_campaign_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total',              COUNT(*),
    'imported',           COUNT(*) FILTER (WHERE status = 'imported'),
    'connection_sent',    COUNT(*) FILTER (WHERE status = 'connection_sent'),
    'connected',          COUNT(*) FILTER (WHERE status = 'connected'),
    'message_1_sent',     COUNT(*) FILTER (WHERE status = 'message_1_sent'),
    'follow_up_sent',     COUNT(*) FILTER (WHERE status = 'follow_up_sent'),
    'replied_positive',   COUNT(*) FILTER (WHERE status = 'replied_positive'),
    'replied_ambiguous',  COUNT(*) FILTER (WHERE status = 'replied_ambiguous'),
    'replied_negative',   COUNT(*) FILTER (WHERE status = 'replied_negative'),
    'link_sent',          COUNT(*) FILTER (WHERE status = 'link_sent')
  )
  FROM leads;
$$;
