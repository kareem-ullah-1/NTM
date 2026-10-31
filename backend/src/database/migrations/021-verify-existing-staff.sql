-- Staff accounts created via Staff Management before the emailVerified fix
-- were left with email_verified_at = NULL, which incorrectly gated their
-- login behind the Super Admin self-registration verification flow they
-- were never sent a link for. Mark already-existing internal staff accounts
-- as verified/trusted. This intentionally excludes:
--   * role = 'user' (ordinary customer accounts) — untouched
--   * admin_role = 'super_admin' — untouched, keeps its own verification history
UPDATE users
SET email_verified_at = now(), updated_at = now()
WHERE role = 'admin'
  AND admin_role <> 'super_admin'
  AND email_verified_at IS NULL;
