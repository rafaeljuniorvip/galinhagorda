-- Championship format configuration
-- Adds real configuration fields for tournament structure

-- League/group stage config
ALTER TABLE championships ADD COLUMN IF NOT EXISTS league_rounds VARCHAR(20) DEFAULT 'turno';
-- 'turno' = single round robin, 'turno_returno' = double round robin

ALTER TABLE championships ADD COLUMN IF NOT EXISTS num_groups INTEGER DEFAULT 1;
-- 1 = single group (all vs all), 2+ = multiple groups

-- Knockout stage config
ALTER TABLE championships ADD COLUMN IF NOT EXISTS knockout_qualified INTEGER DEFAULT 4;
-- How many teams qualify to knockout (top N from league/group)

ALTER TABLE championships ADD COLUMN IF NOT EXISTS knockout_format VARCHAR(20) DEFAULT 'ida_volta';
-- 'ida_volta' = two legs (home and away), 'jogo_unico' = single match

ALTER TABLE championships ADD COLUMN IF NOT EXISTS knockout_away_goals BOOLEAN DEFAULT true;
-- Whether away goals rule applies as tiebreaker in two-leg ties

ALTER TABLE championships ADD COLUMN IF NOT EXISTS knockout_seeding VARCHAR(20) DEFAULT 'cruzado';
-- 'cruzado' = 1st vs last, 2nd vs second-to-last (crossed), 'chave_fixa' = fixed bracket

ALTER TABLE championships ADD COLUMN IF NOT EXISTS has_third_place BOOLEAN DEFAULT false;
-- Whether there's a 3rd place match (disputa de terceiro lugar)

ALTER TABLE championships ADD COLUMN IF NOT EXISTS knockout_phases TEXT DEFAULT 'semi,final';
-- Comma-separated phases: 'oitavas,quartas,semi,final' or 'semi,final' or 'final'
