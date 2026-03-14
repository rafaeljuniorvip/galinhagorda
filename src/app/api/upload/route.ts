import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { processImage } from '@/services/imageService';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    const allowedTypes_upload = ['players', 'teams', 'news', 'photos', 'championships', 'sponsors'];
    if (!allowedTypes_upload.includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB (increased since we compress)
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const baseFilename = uuidv4();

    const variants = await processImage(buffer, type, baseFilename);

    // Return main URL (medium for backwards compatibility) + all variants
    return NextResponse.json({
      url: variants.medium,
      filename: `${baseFilename}.webp`,
      variants,
    });
  } catch (error) {
    console.error('[API] Upload error:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
