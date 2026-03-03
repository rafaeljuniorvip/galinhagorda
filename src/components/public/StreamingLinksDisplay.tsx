'use client';

import { PlayCircle, Radio, MonitorPlay, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StreamingLink } from '@/types';

interface Props {
  streamingLinks: StreamingLink[];
  mainStreamUrl?: string | null;
}

const platformConfig: Record<
  string,
  { color: string; gradient: string; iconClass: string; label: string }
> = {
  youtube: {
    color: '#FF0000',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    iconClass: 'youtube',
    label: 'YouTube',
  },
  facebook: {
    color: '#1877F2',
    gradient: 'linear-gradient(135deg, #1877F2 0%, #0D5BB5 100%)',
    iconClass: 'facebook',
    label: 'Facebook',
  },
  instagram: {
    color: '#E4405F',
    gradient: 'linear-gradient(135deg, #833AB4 0%, #E4405F 50%, #FCAF45 100%)',
    iconClass: 'instagram',
    label: 'Instagram',
  },
  twitch: {
    color: '#9146FF',
    gradient: 'linear-gradient(135deg, #9146FF 0%, #6441A5 100%)',
    iconClass: 'twitch',
    label: 'Twitch',
  },
  default: {
    color: '#546e7a',
    gradient: 'linear-gradient(135deg, #546e7a 0%, #37474f 100%)',
    iconClass: 'default',
    label: 'Transmissao',
  },
};

function getPlatformConfig(platform: string) {
  const key = platform.toLowerCase();
  return platformConfig[key] || platformConfig.default;
}

function PlatformIcon({ iconClass }: { iconClass: string }) {
  switch (iconClass) {
    case 'youtube':
      return <PlayCircle className="h-9 w-9" />;
    case 'facebook':
    case 'twitch':
      return <Radio className="h-9 w-9" />;
    case 'instagram':
    case 'default':
    default:
      return <MonitorPlay className="h-9 w-9" />;
  }
}

export default function StreamingLinksDisplay({ streamingLinks, mainStreamUrl }: Props) {
  const hasLinks = streamingLinks.length > 0 || mainStreamUrl;
  if (!hasLinks) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-[#1a237e] mb-2 flex items-center gap-2">
        <Radio className="h-5 w-5" />
        TRANSMISSAO
      </h3>

      {mainStreamUrl && (
        <a
          href={mainStreamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4"
        >
          <Card className="overflow-hidden border-0 text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)' }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <Radio className="h-10 w-10" />
              <div className="flex-1">
                <p className="text-base font-bold">Transmissao Principal</p>
                <p className="text-sm opacity-80">Clique para assistir</p>
              </div>
              <ExternalLink className="h-5 w-5" />
            </CardContent>
          </Card>
        </a>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {streamingLinks.map((link) => {
          const config = getPlatformConfig(link.platform);
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card
                className="relative overflow-visible border-0 text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: config.gradient,
                  ['--platform-color' as string]: config.color,
                }}
              >
                {link.is_live && (
                  <Badge
                    className="absolute -top-2.5 right-3 bg-[#d32f2f] text-white border-transparent font-bold text-[0.7rem] animate-live-pulse hover:bg-[#d32f2f]"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-white mr-1 animate-blink" />
                    AO VIVO
                  </Badge>
                )}
                <CardContent className="flex items-center gap-4 py-5 px-4">
                  <PlatformIcon iconClass={config.iconClass} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">
                      {link.label || config.label}
                    </p>
                    <span className="text-xs opacity-80 block truncate">
                      {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 opacity-70" />
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
