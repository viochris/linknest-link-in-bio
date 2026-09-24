import React from 'react';
import { SocialIconItem } from '../../types';
import { RenderIcon } from '../../lib/icons';

interface SocialIconRowProps {
  icons: SocialIconItem[];
  accentColor?: string;
  isLightBg?: boolean;
}

export const SocialIconRow: React.FC<SocialIconRowProps> = ({
  icons,
  accentColor = '#818cf8',
  isLightBg = false,
}) => {
  if (!icons || icons.length === 0) return null;

  const sortedIcons = [...icons].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 my-3 sm:my-4 max-w-full px-2">
      {sortedIcons.map((item) => {
        let href = (item.url || '').trim();
        const p = item.platform.toLowerCase();

        if (p === 'email' || href.includes('@') && !href.includes('/')) {
          href = href.startsWith('mailto:') ? href : `mailto:${href}`;
        } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
          const handle = href.replace(/^@/, '');
          if (p === 'github') href = `https://github.com/${handle}`;
          else if (p === 'x' || p === 'twitter') href = `https://x.com/${handle}`;
          else if (p === 'instagram') href = `https://www.instagram.com/${handle}`;
          else if (p === 'linkedin') href = `https://www.linkedin.com/in/${handle}`;
          else if (p === 'kaggle') href = `https://www.kaggle.com/${handle}`;
          else if (p === 'youtube') href = `https://youtube.com/@${handle}`;
          else if (p === 'medium') href = `https://medium.com/@${handle}`;
          else href = `https://${href}`;
        }

        const isMail = href.startsWith('mailto:');

        return (
          <a
            key={item.id}
            id={`social-icon-${item.platform}`}
            href={href}
            target={isMail ? '_self' : '_blank'}
            rel="noopener noreferrer"
            aria-label={`Visit ${item.platform}`}
            className={`w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm ${
              isLightBg
                ? 'bg-white/80 hover:bg-white text-slate-800 border border-slate-200/60 shadow-slate-200/50'
                : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/15 backdrop-blur-sm'
            }`}
          >
            <RenderIcon name={item.platform} className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};
