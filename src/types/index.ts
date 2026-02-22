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
