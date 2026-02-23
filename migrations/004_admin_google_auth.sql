-- Migration 004: Unify admin auth via Google OAuth
-- Add 'superadmin' role and set rafaeljrssg@gmail.com as superadmin

-- 1. Update role CHECK constraint to include 'superadmin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'admin', 'team_owner', 'player', 'fan'));

-- 2. If rafaeljrssg@gmail.com already exists, promote to superadmin
UPDATE users SET role = 'superadmin' WHERE email = 'rafaeljrssg@gmail.com';

-- 3. If not yet registered, pre-create so first Google login links automatically
INSERT INTO users (email, name, role, provider, is_active)
VALUES ('rafaeljrssg@gmail.com', 'Rafael Junior', 'superadmin', 'local', true)
ON CONFLICT (email) DO NOTHING;
