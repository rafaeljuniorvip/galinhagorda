import { NextRequest, NextResponse } from 'next/server';
import { getTeamById, updateTeam, deleteTeam } from '@/services/teamService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const team = await getTeamById(params.id);
    if (!team) return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    return NextResponse.json(team);
  } catch (error) {
    console.error('[API] Get team error:', error);
    return NextResponse.json({ error: 'Erro ao buscar time' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const team = await updateTeam(params.id, body);
    if (!team) return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    return NextResponse.json(team);
  } catch (error) {
    console.error('[API] Update team error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar time' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const deleted = await deleteTeam(params.id);
    if (!deleted) return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete team error:', error);
    return NextResponse.json({ error: 'Erro ao excluir time' }, { status: 500 });
  }
}
