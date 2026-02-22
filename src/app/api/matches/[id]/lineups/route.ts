import { NextRequest, NextResponse } from 'next/server';
import {
  getMatchLineups,
  addPlayerToLineup,
  bulkSetLineup,
  removeFromLineup,
} from '@/services/lineupService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lineups = await getMatchLineups(params.id);
    return NextResponse.json(lineups);
  } catch (error) {
    console.error('[API] Get lineups error:', error);
    return NextResponse.json({ error: 'Erro ao buscar escalacoes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const body = await request.json();

    // Bulk set lineup: { team_id, players: [...] }
    if (body.players && Array.isArray(body.players)) {
      if (!body.team_id) {
        return NextResponse.json({ error: 'ID do time e obrigatorio' }, { status: 400 });
      }

      const result = await bulkSetLineup(params.id, body.team_id, body.players);
      return NextResponse.json(result, { status: 201 });
    }

    // Single player add
    if (!body.team_id || !body.player_id) {
      return NextResponse.json(
        { error: 'ID do time e do jogador sao obrigatorios' },
        { status: 400 }
      );
    }

    const lineup = await addPlayerToLineup({
      ...body,
      match_id: params.id,
    });
    return NextResponse.json(lineup, { status: 201 });
  } catch (error) {
    console.error('[API] Create lineup error:', error);
    return NextResponse.json({ error: 'Erro ao definir escalacao' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const lineupId = searchParams.get('lineup_id');
    if (!lineupId) {
      return NextResponse.json({ error: 'ID da escalacao e obrigatorio' }, { status: 400 });
    }

    const removed = await removeFromLineup(lineupId);
    if (!removed) {
      return NextResponse.json({ error: 'Escalacao nao encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete lineup error:', error);
    return NextResponse.json({ error: 'Erro ao remover da escalacao' }, { status: 500 });
  }
}
