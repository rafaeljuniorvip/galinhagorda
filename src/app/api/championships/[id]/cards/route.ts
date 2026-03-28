import { NextRequest, NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const championshipId = params.id;

  const cards = await getMany(
    `SELECT
      me.id AS event_id,
      me.event_type,
      me.minute,
      me.half,
      me.notes,
      me.match_id,
      m.match_round,
      m.match_date,
      m.home_score,
      m.away_score,
      p.id AS player_id,
      p.name AS player_name,
      p.photo_url AS player_photo,
      pr.shirt_number,
      me.team_id,
      t.name AS team_name,
      t.short_name AS team_short_name,
      t.logo_url AS team_logo,
      ht.name AS home_team_name,
      ht.short_name AS home_short_name,
      at.name AS away_team_name,
      at.short_name AS away_short_name
    FROM match_events me
    JOIN matches m ON m.id = me.match_id AND m.championship_id = $1 AND m.status = 'Finalizada'
    JOIN players p ON p.id = me.player_id
    JOIN teams t ON t.id = me.team_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    LEFT JOIN player_registrations pr ON pr.player_id = me.player_id AND pr.team_id = me.team_id AND pr.championship_id = $1
    WHERE me.event_type IN ('CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SEGUNDO_AMARELO')
    ORDER BY m.match_date ASC, m.match_round ASC, me.minute ASC NULLS LAST`,
    [championshipId]
  );

  return NextResponse.json(cards);
}
