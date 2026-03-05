import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getActiveSponsors, getAllSponsors, createSponsor } from '@/services/sponsorService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');

    // Public: only active sponsors; admin with all=true: everything
    const sponsors = all === 'true' ? await getAllSponsors() : await getActiveSponsors();
    return NextResponse.json(sponsors);
  } catch (error) {
    console.error('[API] Sponsors GET error:', error);
    return NextResponse.json({ error: 'Erro ao buscar patrocinadores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, logo_url, website_url, tier, sort_order, active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const sponsor = await createSponsor({ name: name.trim(), logo_url, website_url, tier, sort_order, active });
    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    console.error('[API] Sponsors POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar patrocinador' }, { status: 500 });
  }
}
