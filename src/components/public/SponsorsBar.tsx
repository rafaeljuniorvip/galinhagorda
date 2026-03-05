import { getActiveSponsors, Sponsor } from '@/services/sponsorService';

export default async function SponsorsBar() {
  let sponsors: Sponsor[] = [];
  try {
    sponsors = await getActiveSponsors();
  } catch {
    return null;
  }

  if (sponsors.length === 0) return null;

  const patrocinadores = sponsors.filter((s) => s.tier === 'patrocinador');
  const outros = sponsors.filter((s) => s.tier !== 'patrocinador');

  return (
    <section className="bg-white border-t py-6">
      <div className="max-w-7xl mx-auto px-4">
        {patrocinadores.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">
              Patrocinadores
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {patrocinadores.map((s) => (
                <SponsorLogo key={s.id} sponsor={s} size="lg" />
              ))}
            </div>
          </div>
        )}

        {outros.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">
              Apoio
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {outros.map((s) => (
                <SponsorLogo key={s.id} sponsor={s} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SponsorLogo({ sponsor, size }: { sponsor: Sponsor; size: 'lg' | 'sm' }) {
  const imgClass = size === 'lg' ? 'h-16 max-w-[180px]' : 'h-10 max-w-[120px]';

  const content = sponsor.logo_url ? (
    <img
      src={sponsor.logo_url}
      alt={sponsor.name}
      className={`${imgClass} object-contain`}
      loading="lazy"
    />
  ) : (
    <span className="text-sm font-medium text-muted-foreground">{sponsor.name}</span>
  );

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="opacity-80 hover:opacity-100 transition-opacity"
        title={sponsor.name}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="opacity-80" title={sponsor.name}>
      {content}
    </div>
  );
}
