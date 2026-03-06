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
    <section className="bg-[#0f1630] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {patrocinadores.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest text-center mb-4">
              Patrocinadores
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {patrocinadores.map((s) => (
                <SponsorLogo key={s.id} sponsor={s} size="lg" />
              ))}
            </div>
          </div>
        )}

        {outros.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest text-center mb-4">
              Apoio
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
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
  const imgClass = size === 'lg' ? 'h-20 max-w-[200px]' : 'h-14 max-w-[140px]';

  const content = sponsor.logo_url ? (
    <img
      src={sponsor.logo_url}
      alt={sponsor.name}
      className={`${imgClass} object-contain`}
      loading="lazy"
    />
  ) : (
    <span className="text-sm font-medium text-white/60">{sponsor.name}</span>
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
