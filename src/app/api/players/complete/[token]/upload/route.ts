import { NextRequest, NextResponse } from 'next/server';
import { getPlayerByToken } from '@/services/playerService';
import { processImage } from '@/services/imageService';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const player = await getPlayerByToken(params.token);
    if (!player) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const baseFilename = uuidv4();

    const variants = await processImage(buffer, 'players', baseFilename);

    return NextResponse.json({
      url: variants.medium,
      filename: `${baseFilename}.webp`,
      variants,
    });
  } catch (error) {
    console.error('[API] Player token upload error:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
