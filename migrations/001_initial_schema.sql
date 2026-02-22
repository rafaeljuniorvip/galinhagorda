-- ============================================================
-- Galinha Gorda - Sistema de Gestão de Campeonatos
-- Migration 001: Schema Inicial
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PLAYERS (JOGADORES)
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(200) NOT NULL,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    birth_date DATE,
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    position VARCHAR(30) NOT NULL CHECK (position IN (
        'Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo',
        'Volante', 'Meia', 'Meia Atacante', 'Atacante', 'Ponta Direita', 'Ponta Esquerda'
    )),
    dominant_foot VARCHAR(10) CHECK (dominant_foot IN ('Direito', 'Esquerdo', 'Ambidestro')),
    height DECIMAL(3,2),
    weight DECIMAL(5,2),
    photo_url VARCHAR(500),
    city VARCHAR(100) DEFAULT 'Itapecerica',
    state VARCHAR(2) DEFAULT 'MG',
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_active ON players(active);

-- ============================================================
-- TEAMS (TIMES)
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20),
    logo_url VARCHAR(500),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    city VARCHAR(100) DEFAULT 'Itapecerica',
    state VARCHAR(2) DEFAULT 'MG',
    founded_year INTEGER,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(active);

-- ============================================================
-- CHAMPIONSHIPS (CAMPEONATOS)
-- ============================================================
CREATE TABLE IF NOT EXISTS championships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    year INTEGER NOT NULL,
    season VARCHAR(20) DEFAULT '1',
    category VARCHAR(50) DEFAULT 'Principal',
    format VARCHAR(50) DEFAULT 'Pontos Corridos',
    description TEXT,
    rules TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Planejado' CHECK (status IN (
        'Planejado', 'Inscricoes Abertas', 'Em Andamento', 'Finalizado', 'Cancelado'
    )),
    logo_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_championships_year ON championships(year);
CREATE INDEX IF NOT EXISTS idx_championships_status ON championships(status);

-- ============================================================
-- TEAM CHAMPIONSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_championships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
    group_name VARCHAR(20),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Inscrito' CHECK (status IN (
        'Inscrito', 'Ativo', 'Eliminado', 'Desclassificado', 'Desistiu'
    )),
    UNIQUE(team_id, championship_id)
);

CREATE INDEX IF NOT EXISTS idx_team_champ_team ON team_championships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_champ_champ ON team_championships(championship_id);

-- ============================================================
-- PLAYER REGISTRATIONS (BID)
-- ============================================================
CREATE TABLE IF NOT EXISTS player_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
    shirt_number INTEGER,
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN (
        'Ativo', 'Suspenso', 'Transferido', 'Cancelado'
    )),
    bid_number VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, championship_id)
);

CREATE INDEX IF NOT EXISTS idx_player_reg_player ON player_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_player_reg_team ON player_registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_player_reg_champ ON player_registrations(championship_id);
CREATE INDEX IF NOT EXISTS idx_player_reg_bid ON player_registrations(bid_number);

-- ============================================================
-- MATCHES (PARTIDAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    home_score INTEGER,
    away_score INTEGER,
    match_date TIMESTAMP WITH TIME ZONE,
    match_round VARCHAR(50),
    venue VARCHAR(200),
    referee VARCHAR(100),
    assistant_referee_1 VARCHAR(100),
    assistant_referee_2 VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Agendada' CHECK (status IN (
        'Agendada', 'Em Andamento', 'Finalizada', 'Adiada', 'Cancelada', 'WO'
    )),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (home_team_id != away_team_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_champ ON matches(championship_id);
CREATE INDEX IF NOT EXISTS idx_matches_home ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- ============================================================
-- MATCH EVENTS (EVENTOS)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN (
        'GOL', 'GOL_CONTRA', 'GOL_PENALTI',
        'CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SEGUNDO_AMARELO',
        'SUBSTITUICAO_ENTRADA', 'SUBSTITUICAO_SAIDA'
    )),
    minute INTEGER,
    half VARCHAR(10) CHECK (half IN ('1T', '2T', 'PRO', 'PEN')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_events_player ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON match_events(event_type);

-- ============================================================
-- MIGRATIONS CONTROL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_championships_updated_at BEFORE UPDATE ON championships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_player_registrations_updated_at BEFORE UPDATE ON player_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
