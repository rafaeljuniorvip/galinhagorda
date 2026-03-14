import { getActiveSponsors, Sponsor } from '@/services/sponsorService';
import { imageUrl } from '@/lib/image';

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
    <section className="bg-[#0f1630] py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {patrocinadores.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest text-center mb-5">
              Patrocinadores
            </p>
            <MarqueeRow sponsors={patrocinadores} size="lg" speed="slow" />
          </div>
        )}

        {outros.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest text-center mb-5">
              Apoio
            </p>
            <MarqueeRow sponsors={outros} size="md" speed="normal" />
          </div>
        )}
      </div>
    </section>
  );
}

function MarqueeRow({ sponsors, size, speed }: { sponsors: Sponsor[]; size: 'lg' | 'md'; speed: 'slow' | 'normal' }) {
  const duration = speed === 'slow' ? '35s' : '25s';

  // Duplicate items for seamless loop
  const items = [...sponsors, ...sponsors, ...sponsors];

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0f1630] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0f1630] to-transparent z-10 pointer-events-none" />

      <div
        className="flex items-center gap-12 w-max animate-marquee"
        style={{ '--marquee-duration': duration } as React.CSSProperties}
      >
        {items.map((s, i) => (
          <SponsorLogo key={`${s.id}-${i}`} sponsor={s} size={size} />
        ))}
      </div>
    </div>
  );
}

function SponsorLogo({ sponsor, size }: { sponsor: Sponsor; size: 'lg' | 'md' }) {
  const imgClass = size === 'lg' ? 'h-20 max-w-[200px]' : 'h-16 max-w-[180px]';

  const content = sponsor.logo_url ? (
    <img
      src={imageUrl(sponsor.logo_url, 'thumb')}
      alt={sponsor.name}
      className={`${imgClass} object-contain transition-transform duration-300 group-hover:scale-110`}
      loading="lazy"
    />
  ) : (
    <span className="text-sm font-medium text-white/60">{sponsor.name}</span>
  );

  const wrapperClass = 'group flex-shrink-0 opacity-70 hover:opacity-100 transition-all duration-300';

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className={wrapperClass}
        title={sponsor.name}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={wrapperClass} title={sponsor.name}>
      {content}
    </div>
  );
}
