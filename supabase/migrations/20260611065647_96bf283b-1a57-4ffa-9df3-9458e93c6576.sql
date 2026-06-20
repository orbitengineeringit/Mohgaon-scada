DO $$
DECLARE v_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'gis_cron_secret') INTO v_exists;
  IF NOT v_exists THEN
    PERFORM vault.create_secret('492dbb4d71398979dd9a4cbcbf6aeb1c47119a10691ae1591913cf5aecb9b462', 'gis_cron_secret', 'Internal key for gis-sync pg_cron job');
  END IF;
END $$;