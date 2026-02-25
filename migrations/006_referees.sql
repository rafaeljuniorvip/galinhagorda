-- Migration 006: Referees table and FK columns on matches
CREATE TABLE IF NOT EXISTS referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  nickname VARCHAR(100),
  cpf VARCHAR(14) UNIQUE,
  phone VARCHAR(20),
  category VARCHAR(50) DEFAULT 'Arbitro'
    CHECK (category IN ('Arbitro', 'Assistente', 'Quarto Arbitro')),
  city VARCHAR(100) DEFAULT 'Itapecerica',
  state VARCHAR(2) DEFAULT 'MG',
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FK columns on matches (keep old text columns for backward compatibility)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS referee_id UUID REFERENCES referees(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS assistant_referee_1_id UUID REFERENCES referees(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS assistant_referee_2_id UUID REFERENCES referees(id) ON DELETE SET NULL;
