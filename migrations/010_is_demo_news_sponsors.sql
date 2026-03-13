-- Migration 010: Add is_demo flag to news and sponsors
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
