import { NextRequest, NextResponse } from 'next/server';
import { updatePhoto, deletePhoto, setCoverPhoto } from '@/services/photoService';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (body.set_cover) {
      await setCoverPhoto(params.id);
      return NextResponse.json({ ok: true });
    }

    const photo = await updatePhoto(params.id, body);
    if (!photo) return NextResponse.json({ error: 'Foto nao encontrada' }, { status: 404 });
    return NextResponse.json(photo);
  } catch (error) {
    console.error('[API] Update photo error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar foto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deleted = await deletePhoto(params.id);
    if (!deleted) return NextResponse.json({ error: 'Foto nao encontrada' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete photo error:', error);
    return NextResponse.json({ error: 'Erro ao excluir foto' }, { status: 500 });
  }
}
