import { NextRequest, NextResponse } from 'next/server';
import { getEventsByMatch, createEvent, deleteEvent } from '@/services/matchEventService';
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
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('[API] Create event error:', error);
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    if (!eventId) return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });

    await deleteEvent(eventId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete event error:', error);
    return NextResponse.json({ error: 'Erro ao excluir evento' }, { status: 500 });
  }
}
