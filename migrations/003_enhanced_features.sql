-- Migration 003: Enhanced features for city championship
-- Users, voting, fan messages, streaming, lineups, photos, news, notifications

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USERS (Google OAuth + multi-role auth for public users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'local',
  provider_id VARCHAR(255),
  role VARCHAR(50) DEFAULT 'fan' CHECK (role IN ('admin', 'team_owner', 'player', 'fan')),
  linked_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  linked_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  bio TEXT,
  phone VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- 2. STREAMING LINKS (transmissoes ao vivo por partida)
-- ============================================================
CREATE TABLE IF NOT EXISTS streaming_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  platform VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  label VARCHAR(255),
  is_live BOOLEAN DEFAULT false,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streaming_match ON streaming_links(match_id);

-- ============================================================
-- 3. MATCH LINEUPS (escalacoes)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  player_id UUID NOT NULL REFERENCES players(id),
  position VARCHAR(50),
  shirt_number INT,
  is_starter BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, team_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_lineups_match ON match_lineups(match_id);

-- ============================================================
-- 4. MATCH VOTES (craque do jogo - man of the match)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  user_id UUID REFERENCES users(id),
  voter_name VARCHAR(255),
  voter_ip VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One vote per logged-in user per match
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_votes_user ON match_votes(match_id, user_id) WHERE user_id IS NOT NULL;
-- Index for IP-based rate limiting
CREATE INDEX IF NOT EXISTS idx_match_votes_ip ON match_votes(match_id, voter_ip);
-- Fast aggregation
CREATE INDEX IF NOT EXISTS idx_match_votes_player ON match_votes(match_id, player_id);

-- ============================================================
-- 5. FAN MESSAGES (mural da torcida)
-- ============================================================
CREATE TABLE IF NOT EXISTS fan_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  author_avatar TEXT,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('match', 'player', 'team', 'championship')),
  target_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fan_messages_target ON fan_messages(target_type, target_id, created_at DESC);

-- ============================================================
-- 6. MESSAGE LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS message_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES fan_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  voter_ip VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_likes_user ON message_likes(message_id, user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 7. PHOTOS (galeria de fotos)
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_admin UUID REFERENCES admin_users(id),
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('match', 'player', 'team', 'championship', 'news')),
  target_id UUID NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption VARCHAR(500),
  is_cover BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_target ON photos(target_type, target_id);

-- ============================================================
-- 8. NEWS (noticias / matérias)
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID REFERENCES admin_users(id),
  championship_id UUID REFERENCES championships(id),
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  views_count INT DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);

-- ============================================================
-- 9. NOTIFICATIONS (notificacoes push)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'match', 'vote', 'message', 'news')),
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 10. ENHANCE EXISTING TABLES
-- ============================================================

-- Matches: voting, streaming, highlights, featured
ALTER TABLE matches ADD COLUMN IF NOT EXISTS voting_open BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS streaming_url TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS highlights_url TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Players: social links, bio
ALTER TABLE players ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE players ADD COLUMN IF NOT EXISTS bio TEXT;

-- Teams: social links, bio
ALTER TABLE teams ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bio TEXT;

-- Championships: banner, rules, prize, location, sponsor
ALTER TABLE championships ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE championships ADD COLUMN IF NOT EXISTS rules_url TEXT;
ALTER TABLE championships ADD COLUMN IF NOT EXISTS prize TEXT;
ALTER TABLE championships ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE championships ADD COLUMN IF NOT EXISTS sponsor TEXT;

-- ============================================================
-- 11. TRIGGERS
-- ============================================================
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_news_updated_at BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
