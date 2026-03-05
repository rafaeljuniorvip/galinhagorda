import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSponsorById, updateSponsor, deleteSponsor } from '@/services/sponsorService';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sponsor = await getSponsorById(params.id);
    if (!sponsor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(sponsor);
  } catch (error) {
    console.error('[API] Sponsor GET error:', error);
    return NextResponse.json({ error: 'Erro ao buscar patrocinador' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const sponsor = await updateSponsor(params.id, body);
    if (!sponsor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(sponsor);
  } catch (error) {
    console.error('[API] Sponsor PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar patrocinador' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deleted = await deleteSponsor(params.id);
    if (!deleted) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Sponsor DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao excluir patrocinador' }, { status: 500 });
  }
}
