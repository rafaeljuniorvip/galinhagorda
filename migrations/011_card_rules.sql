-- Migration 011: Card discipline rules per championship
-- yellow_card_suspension_limit: after X accumulated yellows, player is suspended (e.g., 3)
-- yellow_card_suspension_matches: how many matches the player is suspended for (e.g., 1)
-- red_card_suspension_matches: how many matches suspension for a direct red card (e.g., 1)
-- second_yellow_is_red: whether 2 yellows in the same match counts as a red (always true in football, but configurable)

ALTER TABLE championships ADD COLUMN IF NOT EXISTS yellow_card_suspension_limit INTEGER DEFAULT 3;
ALTER TABLE championships ADD COLUMN IF NOT EXISTS yellow_card_suspension_matches INTEGER DEFAULT 1;
ALTER TABLE championships ADD COLUMN IF NOT EXISTS red_card_suspension_matches INTEGER DEFAULT 1;
ALTER TABLE championships ADD COLUMN IF NOT EXISTS second_yellow_is_red BOOLEAN DEFAULT true;
