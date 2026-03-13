-- Migration 009: Add is_demo flag for demo/test data filtering
-- Non-superadmin mobile users only see demo data

ALTER TABLE championships ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
