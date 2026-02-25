-- Migration 005: Add edit token for player self-service profile completion
-- Players can receive a one-time link to fill in their own profile data

ALTER TABLE players ADD COLUMN IF NOT EXISTS edit_token UUID;
ALTER TABLE players ADD COLUMN IF NOT EXISTS edit_token_expires_at TIMESTAMPTZ;

-- Unique partial index so tokens are unique when set
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_edit_token
  ON players (edit_token) WHERE edit_token IS NOT NULL;
