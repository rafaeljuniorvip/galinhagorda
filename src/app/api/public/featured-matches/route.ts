import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';
import { Match } from '@/types';

export async function GET() {
  try {
    const matches = await getMany<Match>(
      `SELECT m.*,
        ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short,
        at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short,
        c.name AS championship_name
       FROM matches m
       JOIN teams ht ON ht.id = m.home_team_id
       JOIN teams at ON at.id = m.away_team_id
       JOIN championships c ON c.id = m.championship_id
       WHERE m.is_featured = true OR m.status = 'Em Andamento'
       ORDER BY
         CASE WHEN m.status = 'Em Andamento' THEN 0 ELSE 1 END,
         m.match_date DESC NULLS LAST
       LIMIT 10`
    );

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching featured matches:', error);
    return NextResponse.json([], { status: 500 });
  }
}
