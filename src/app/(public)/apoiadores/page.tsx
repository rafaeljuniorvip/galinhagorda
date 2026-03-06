import type { Metadata } from 'next';
import { Handshake, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getActiveSponsors, Sponsor } from '@/services/sponsorService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Patrocinadores e Apoiadores - Galinha Gorda',
  description: 'Conheça os patrocinadores e apoiadores do futebol de Itapecerica-MG.',
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  patrocinador: { label: 'Patrocinador', color: 'bg-yellow-400 text-[#1a237e] border-yellow-500' },
  apoiador: { label: 'Apoiador', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  parceiro: { label: 'Parceiro', color: 'bg-green-100 text-green-800 border-green-200' },
};

export default async function ApoiadoresPage() {
  const sponsors = await getActiveSponsors();

  const patrocinadores = sponsors.filter((s) => s.tier === 'patrocinador');
  const apoiadores = sponsors.filter((s) => s.tier === 'apoiador');
  const parceiros = sponsors.filter((s) => s.tier === 'parceiro');

  return (
    <div>
      {/* Hero */}
      <div
        className="w-full py-16 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)' }}
      >
        <div className="text-center">
          <Handshake className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Patrocinadores e Apoiadores
          </h1>
          <p className="text-white/70 mt-2 max-w-md mx-auto">
            O futebol de Itapecerica-MG conta com o apoio de quem acredita no esporte.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Patrocinadores */}
        {patrocinadores.length > 0 && (
          <SponsorSection
            title="Patrocinadores"
            description="Nossos patrocinadores oficiais que tornam o campeonato possível."
            sponsors={patrocinadores}
            size="lg"
          />
        )}

        {/* Apoiadores */}
        {apoiadores.length > 0 && (
          <SponsorSection
            title="Apoiadores"
            description="Empresas e instituições que apoiam o esporte em Itapecerica."
            sponsors={apoiadores}
            size="md"
          />
        )}

        {/* Parceiros */}
        {parceiros.length > 0 && (
          <SponsorSection
            title="Parceiros"
            description="Parceiros que contribuem para o sucesso do campeonato."
            sponsors={parceiros}
            size="md"
          />
        )}

        {sponsors.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            Nenhum patrocinador cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}

function SponsorSection({ title, description, sponsors, size }: {
  title: string;
  description: string;
  sponsors: Sponsor[];
  size: 'lg' | 'md';
}) {
  const tierConfig = TIER_CONFIG[sponsors[0]?.tier] || TIER_CONFIG.apoiador;

  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1a237e]">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className={`grid gap-6 ${size === 'lg' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {sponsors.map((s) => (
          <Card key={s.id} className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            {s.logo_url ? (
              <div className={`flex items-center justify-center mb-4 ${size === 'lg' ? 'h-28' : 'h-20'}`}>
                <img
                  src={s.logo_url}
                  alt={s.name}
                  className={`${size === 'lg' ? 'max-h-28 max-w-[220px]' : 'max-h-20 max-w-[160px]'} object-contain`}
                  loading="lazy"
                />
              </div>
            ) : (
              <div className={`flex items-center justify-center bg-muted rounded-lg mb-4 ${size === 'lg' ? 'h-28 w-28' : 'h-20 w-20'}`}>
                <Handshake className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <h3 className="font-semibold text-sm mb-1">{s.name}</h3>

            <Badge className={`text-[10px] mb-2 ${tierConfig.color}`}>
              {tierConfig.label}
            </Badge>

            {s.website_url && (
              <a
                href={s.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                Visitar site
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
