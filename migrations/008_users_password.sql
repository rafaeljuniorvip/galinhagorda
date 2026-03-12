-- Migration 008: Add password_hash to users table for mobile email/password login
-- This allows admin users to optionally log in via email/password on the mobile app

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
