import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LinkItem, ThemeConfig } from '../../types';
import { RenderIcon } from '../../lib/icons';
import { resolveLinkIcon } from '../../lib/domainIcons';
import { ExternalLink, Sparkles } from 'lucide-react';

interface LinkButtonProps {
  link: LinkItem;
  theme: ThemeConfig;
  onTrackClick: (link: LinkItem) => Promise<void> | void;
  previewMode?: boolean;
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  link,
  theme,
  onTrackClick,
  previewMode = false,
}) => {
  const [isClicking, setIsClicking] = useState(false);

  // Derive styles from theme
  const { button_style, button_bg, button_text, accent_color } = theme;

  // Auto-detect social media icon & styling based on destination URL domain
  const { iconKey, platform } = resolveLinkIcon(link.icon, link.url);

  let borderRadiusClass = 'rounded-xl';
  if (button_style === 'pill') borderRadiusClass = 'rounded-full';
  if (button_style === 'sharp') borderRadiusClass = 'rounded-none';

  let customStyle: React.CSSProperties = {};
  let baseClass = 'relative w-full flex items-center justify-between transition-all duration-200 group';

  if (button_style === 'outline') {
    baseClass += ' border-2 bg-transparent hover:bg-white/10';
    customStyle = {
      borderColor: link.is_featured ? accent_color : (button_text || '#ffffff'),
      color: button_text || '#ffffff',
    };
  } else if (button_style === 'glass') {
    baseClass += ' backdrop-blur-md border border-white/20 hover:border-white/40 shadow-sm';
    customStyle = {
      backgroundColor: button_bg || 'rgba(255, 255, 255, 0.12)',
      color: button_text || '#ffffff',
    };
  } else if (button_style === 'shadow') {
    baseClass += ' shadow-md hover:shadow-lg hover:-translate-y-0.5';
    customStyle = {
      backgroundColor: button_bg || '#ffffff',
      color: button_text || '#0f172a',
    };
  } else {
    // Standard filled / rounded
    baseClass += ' hover:brightness-105 hover:-translate-y-0.5 shadow-sm';
    customStyle = {
      backgroundColor: button_bg || 'rgba(30, 41, 59, 0.9)',
      color: button_text || '#ffffff',
    };
  }

  // Highlight featured links per AC4: larger button, accent color/glow, featured badge
  const isFeatured = link.is_featured;
  const paddingClass = isFeatured ? 'py-4 px-5 text-base font-semibold' : 'py-3.5 px-4 text-sm font-medium';

  let targetUrl = (link.url || '').trim();
  const isMail = targetUrl.startsWith('mailto:') || (targetUrl.includes('@') && !targetUrl.includes('/') && !targetUrl.includes('http'));
  if (isMail && !targetUrl.startsWith('mailto:')) {
    targetUrl = `mailto:${targetUrl}`;
  } else if (!isMail && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  const handleClick = (e: React.MouseEvent) => {
    setIsClicking(true);

    try {
      // Record click in database via RPC per AC2 & user prompt
      onTrackClick(link);
    } catch (err) {
      console.warn('Click tracking error:', err);
    }

    if (previewMode) {
      e.preventDefault();
    }
    setTimeout(() => setIsClicking(false), 300);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="w-full relative"
    >
      {/* Featured link decorative ring / badge */}
      {isFeatured && (
        <div
          className="absolute -inset-0.5 rounded-2xl opacity-75 blur-sm transition-all duration-300 group-hover:opacity-100 -z-10 animate-pulse"
          style={{ backgroundColor: accent_color }}
        />
      )}

      <a
        id={`link-button-${link.id}`}
        href={targetUrl}
        target={isMail ? '_self' : (previewMode ? '_self' : '_blank')}
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{
          ...customStyle,
          ...(isFeatured ? { borderColor: accent_color, borderWidth: button_style === 'outline' ? '2.5px' : '1.5px' } : {}),
        }}
        className={`${baseClass} ${borderRadiusClass} ${paddingClass} ${
          isClicking ? 'opacity-80 scale-95' : ''
        }`}
      >
        {/* Left Side: Icon & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2.5">
          {/* Icon Container with Auto-Detected Social Brand Accents */}
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 shadow-sm relative ${
              platform
                ? 'bg-slate-900/60 border border-white/10 backdrop-blur-sm'
                : isFeatured
                  ? 'bg-white/20'
                  : 'bg-black/10'
            }`}
            style={{
              color: platform?.brandColor
                ? platform.brandColor
                : isFeatured
                  ? accent_color
                  : (button_text || '#ffffff'),
              ...(platform
                ? {
                    boxShadow: `0 0 12px ${platform.brandColor}20`,
                  }
                : {}),
            }}
          >
            <RenderIcon name={iconKey} className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            {platform && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-slate-950 shadow-sm"
                style={{ backgroundColor: platform.brandColor }}
                title={`${platform.label} Link`}
              />
            )}
          </div>

          {/* Title - min-w-0 and truncate ensures text NEVER collides with badge or icon */}
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className={`truncate tracking-tight ${isFeatured ? 'text-sm sm:text-base font-semibold' : 'text-sm font-medium'}`}>
                {link.title}
              </p>
              {platform && (
                <span
                  className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0 transition-opacity opacity-75 group-hover:opacity-100"
                  style={{
                    backgroundColor: platform.badgeBg,
                    color: platform.brandColor,
                    border: `1px solid ${platform.badgeBorder}`,
                  }}
                >
                  {platform.label}
                </span>
              )}
            </div>
            {link.description ? (
              <p className="text-[11px] sm:text-xs truncate font-normal mt-0.5 leading-snug opacity-80 group-hover:opacity-95 transition-opacity">
                {link.description}
              </p>
            ) : platform ? (
              <p className="text-[10px] sm:text-[11px] truncate font-mono mt-0.5 opacity-60 group-hover:opacity-85 transition-opacity">
                {platform.label}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right Side: Featured Badge & External Link Icon */}
        <div className="flex items-center gap-2 shrink-0">
          {isFeatured && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full shrink-0 whitespace-nowrap shadow-sm"
              style={{
                backgroundColor: `${accent_color}25`,
                color: accent_color,
                border: `1px solid ${accent_color}50`,
              }}
            >
              <Sparkles className="w-2.5 h-2.5 shrink-0" />
              <span>Featured</span>
            </span>
          )}

          <ExternalLink className="w-4 h-4 opacity-50 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </a>
    </motion.div>
  );
};

