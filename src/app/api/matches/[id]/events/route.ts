import { NextRequest, NextResponse } from 'next/server';
import { getEventsByMatch, createEvent, deleteEvent, recalculateScore, isGoalEvent } from '@/services/matchEventService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const events = await getEventsByMatch(params.id);
    return NextResponse.json(events);
  } catch (error) {
    console.error('[API] Get events error:', error);
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    if (!body.player_id || !body.team_id || !body.event_type) {
      return NextResponse.json({ error: 'Jogador, time e tipo de evento são obrigatórios' }, { status: 400 });
    }

    const event = await createEvent({ ...body, match_id: params.id });

    // Auto-recalculate score when a goal event is added
    let score;
    if (isGoalEvent(body.event_type)) {
      score = await recalculateScore(params.id);
    }

    return NextResponse.json({ ...event, score }, { status: 201 });
  } catch (error) {
    console.error('[API] Create event error:', error);
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    if (!eventId) return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });

    // Check if it's a goal event before deleting
    const { getOne } = await import('@/lib/db');
    const event = await getOne<{ event_type: string }>('SELECT event_type FROM match_events WHERE id = $1', [eventId]);
    const wasGoal = event ? isGoalEvent(event.event_type) : false;

    await deleteEvent(eventId);

    // Recalculate score if a goal was removed
    let score;
    if (wasGoal) {
      score = await recalculateScore(params.id);
    }

    return NextResponse.json({ ok: true, score });
  } catch (error) {
    console.error('[API] Delete event error:', error);
    return NextResponse.json({ error: 'Erro ao excluir evento' }, { status: 500 });
  }
}
