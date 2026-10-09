-- Garante que uma reconstrução do zero preserve o acesso administrativo
-- server-side. O service_role continua indisponível para anon/authenticated.

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO service_role;

