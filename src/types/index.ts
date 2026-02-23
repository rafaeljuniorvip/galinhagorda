export interface Player {
  id: string;
  full_name: string;
  name: string;
  nickname: string | null;
  birth_date: string | null;
  cpf: string | null;
  rg: string | null;
  position: string;
  dominant_foot: string | null;
  height: number | null;
  weight: number | null;
  photo_url: string | null;
  city: string;
  state: string;
  active: boolean;
  notes: string | null;
  instagram: string | null;
  social_links: Record<string, string>;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  city: string;
  state: string;
  founded_year: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  active: boolean;
  notes: string | null;
  instagram: string | null;
  social_links: Record<string, string>;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Championship {
  id: string;
  name: string;
  short_name: string | null;
  year: number;
  season: string;
  category: string;
  format: string;
  description: string | null;
  rules: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  logo_url: string | null;
  active: boolean;
  banner_url: string | null;
  rules_url: string | null;
  prize: string | null;
  location: string | null;
  sponsor: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamChampionship {
  id: string;
  team_id: string;
  championship_id: string;
  group_name: string | null;
  enrolled_at: string;
  status: string;
  team_name?: string;
  team_logo?: string;
}

export interface PlayerRegistration {
  id: string;
  player_id: string;
  team_id: string;
  championship_id: string;
  shirt_number: number | null;
  registration_date: string;
  status: string;
  bid_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  player_name?: string;
  player_photo?: string;
  player_position?: string;
  team_name?: string;
  team_logo?: string;
  championship_name?: string;
}

export interface Match {
  id: string;
  championship_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string | null;
  match_round: string | null;
  venue: string | null;
  referee: string | null;
  assistant_referee_1: string | null;
  assistant_referee_2: string | null;
  status: string;
  observations: string | null;
  voting_open: boolean;
  voting_deadline: string | null;
  streaming_url: string | null;
  highlights_url: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  home_team_name?: string;
  home_team_logo?: string;
  home_team_short?: string;
  away_team_name?: string;
  away_team_logo?: string;
  away_team_short?: string;
  championship_name?: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  event_type: string;
  minute: number | null;
  half: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  player_name?: string;
  team_name?: string;
}

export interface PlayerStats {
  player_id: string;
  championship_id: string;
  team_id: string;
  player_name: string;
  photo_url: string | null;
  position: string;
  team_name: string;
  team_logo: string | null;
  championship_name: string;
  year: number;
  shirt_number: number | null;
  bid_number: string | null;
  matches_played: number;
  goals: number;
  penalty_goals: number;
  own_goals: number;
  yellow_cards: number;
  red_cards: number;
}

export interface Standing {
  championship_id: string;
  team_id: string;
  team_name: string;
  short_name: string | null;
  logo_url: string | null;
  group_name: string | null;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// NEW: Enhanced Features
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  provider_id: string | null;
  role: 'superadmin' | 'admin' | 'team_owner' | 'player' | 'fan';
  linked_player_id: string | null;
  linked_team_id: string | null;
  bio: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StreamingLink {
  id: string;
  match_id: string;
  platform: string;
  url: string;
  label: string | null;
  is_live: boolean;
  created_at: string;
}

export interface MatchLineup {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  player_name?: string;
  player_photo?: string;
  position: string | null;
  shirt_number: number | null;
  is_starter: boolean;
  created_at: string;
}

export interface MatchVote {
  id: string;
  match_id: string;
  player_id: string;
  player_name?: string;
  player_photo?: string;
  team_name?: string;
  team_logo?: string;
  user_id: string | null;
  voter_name: string | null;
  created_at: string;
}

export interface VoteResult {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  team_name: string;
  team_logo: string | null;
  votes: number;
  percentage: number;
}

export interface FanMessage {
  id: string;
  user_id: string | null;
  author_name: string;
  author_avatar: string | null;
  target_type: 'match' | 'player' | 'team' | 'championship';
  target_id: string;
  message: string;
  is_approved: boolean;
  is_pinned: boolean;
  likes_count: number;
  created_at: string;
}

export interface Photo {
  id: string;
  uploaded_by: string | null;
  uploaded_by_admin: string | null;
  target_type: 'match' | 'player' | 'team' | 'championship' | 'news';
  target_id: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image: string | null;
  author_id: string | null;
  author_name?: string;
  championship_id: string | null;
  championship_name?: string;
  is_published: boolean;
  is_featured: boolean;
  views_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'match' | 'vote' | 'message' | 'news';
  link: string | null;
  is_read: boolean;
  created_at: string;
}
