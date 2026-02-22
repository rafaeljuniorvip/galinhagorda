import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationsByChampionship, createRegistration, enrollTeam, getEnrolledTeams, removeTeamFromChampionship } from '@/services/registrationService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id') || undefined;
    const type = searchParams.get('type');

    if (type === 'teams') {
      const teams = await getEnrolledTeams(params.id);
      return NextResponse.json(teams);
    }

    const registrations = await getRegistrationsByChampionship(params.id, teamId);
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('[API] Get registrations error:', error);
    return NextResponse.json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();

    // Enroll team
    if (body.type === 'team') {
      if (!body.team_id) {
        return NextResponse.json({ error: 'ID do time é obrigatório' }, { status: 400 });
      }
      const enrolled = await enrollTeam(body.team_id, params.id, body.group_name);
      return NextResponse.json(enrolled, { status: 201 });
    }

    // Remove team
    if (body.type === 'remove_team') {
      if (!body.team_id) {
        return NextResponse.json({ error: 'ID do time é obrigatório' }, { status: 400 });
      }
      await removeTeamFromChampionship(body.team_id, params.id);
      return NextResponse.json({ ok: true });
    }

    // Register player (BID)
    if (!body.player_id || !body.team_id) {
      return NextResponse.json({ error: 'ID do jogador e do time são obrigatórios' }, { status: 400 });
    }

    const registration = await createRegistration({
      ...body,
      championship_id: params.id,
    });
    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Jogador já inscrito neste campeonato' }, { status: 409 });
    }
    console.error('[API] Create registration error:', error);
    return NextResponse.json({ error: 'Erro ao criar inscrição' }, { status: 500 });
  }
}
