import { NextRequest, NextResponse } from 'next/server';
import { getPhotos, getAllPhotos, addPhoto } from '@/services/photoService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');

    if (targetType && targetId) {
      const photos = await getPhotos(targetType, targetId);
      return NextResponse.json(photos);
    }

    // List all photos (admin)
    const result = await getAllPhotos({
      targetType: targetType || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '24'),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Get photos error:', error);
    return NextResponse.json({ error: 'Erro ao buscar fotos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.target_type || !body.target_id || !body.url) {
      return NextResponse.json(
        { error: 'target_type, target_id e url sao obrigatorios' },
        { status: 400 }
      );
    }

    const photo = await addPhoto({
      ...body,
      uploaded_by_admin: user.id,
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('[API] Create photo error:', error);
    return NextResponse.json({ error: 'Erro ao adicionar foto' }, { status: 500 });
  }
}
