import React, { useState } from 'react';
import { Profile, LinkItem, SocialIconItem, ThemeConfig } from '../../types';
import { SocialIconRow } from '../public/SocialIconRow';
import { LinkButton } from '../public/LinkButton';
import { DiscoverTab } from '../public/DiscoverTab';
import { PublicQrCard } from '../public/PublicQrCard';
import { ExternalLink, Smartphone, Compass } from 'lucide-react';

interface PhonePreviewProps {
  profile: Profile;
  theme: ThemeConfig;
  links: LinkItem[];
  socialIcons: SocialIconItem[];
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({
  profile,
  theme,
  links,
  socialIcons,
}) => {
  const [activeTab, setActiveTab] = useState<'links' | 'discover'>('links');
  const isLight =
    theme.bg_value.toLowerCase().includes('f8fafc') ||
    theme.bg_value.toLowerCase().includes('fdfbf7') ||
    theme.bg_value.toLowerCase().includes('ffffff') ||
    theme.bg_value.toLowerCase().includes('light');

  const textContrastClass = isLight ? 'text-slate-900' : 'text-white';
  const subtextContrastClass = isLight ? 'text-slate-600' : 'text-slate-300';

  const activeLinks = links
    .filter((l) => l.is_active)
    .sort((a, b) => {
      // Featured links ALWAYS come first at the very top!
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.position - b.position;
    });

  const containerStyle: React.CSSProperties = {
    background: theme.bg_value || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
    fontFamily: `"${theme.font_family || 'Plus Jakarta Sans'}", sans-serif`,
  };

  const displayHost = typeof window !== 'undefined' && window.location.host
    ? window.location.host
    : 'linknest-link-in-bio.vercel.app';

  return (
    <div className="flex flex-col items-center w-full max-w-full">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400">
        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
        <span>Live Public Profile Preview</span>
      </div>

      {/* Phone Hardware Mockup */}
      <div className="relative w-full max-w-[290px] sm:max-w-[300px] h-[580px] sm:h-[610px] bg-black rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-white/10 flex flex-col items-center mx-auto">
        {/* Notch / Centered Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center border border-white/10 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-indigo-950/80" />
          </div>
        </div>

        {/* Screen Bezel & Content Area */}
        <div
          style={containerStyle}
          className="w-full h-full rounded-[36px] overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 flex flex-col items-center text-center relative scrollbar-none transition-all duration-300 select-none"
        >
          {/* Top header mockup */}
          <div className="w-full flex items-center justify-between pt-5 pb-2 text-[10px] text-white/50">
            <span className="font-mono truncate max-w-[170px]">{displayHost}/{profile.username || 'username'}</span>
            <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
          </div>

          {/* Profile Header */}
          <div className="mt-2 mb-2 w-full">
            <div
              className="w-20 h-20 rounded-full p-1 shadow-xl mx-auto mb-2"
              style={{
                background: `linear-gradient(135deg, ${theme.accent_color}, transparent)`,
              }}
            >
              <img
                src={
                  profile.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                }
                alt="Avatar"
                className="w-full h-full object-cover rounded-full bg-slate-800 border-2 border-white/50 shadow-inner"
              />
            </div>
            <h3 className={`text-sm font-bold truncate ${textContrastClass}`}>
              {profile.display_name || 'Your Name'}
            </h3>
            <p className={`text-[10px] opacity-75 truncate ${subtextContrastClass}`}>
              @{profile.username || 'username'}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className={`text-[11px] leading-relaxed max-w-[250px] mb-2 px-1 ${subtextContrastClass}`}>
              {profile.bio
                .replace(/🚀\s*\|\s*/g, '🚀\n')
                .split('\n')
                .map((line, idx) => (
                  <p
                    key={idx}
                    className={
                      idx === 0
                        ? 'font-semibold mb-0.5 break-words'
                        : 'opacity-90 leading-tight text-[10px] break-words whitespace-normal'
                    }
                  >
                    {line.trim()}
                  </p>
                ))}
            </div>
          )}

          {/* Social Icons (excluding youtube and medium, which are listed as link rows) */}
          <div className="w-full scale-90 -my-1">
            <SocialIconRow
              icons={socialIcons.filter((i) => i.platform !== 'youtube' && i.platform !== 'medium')}
              accentColor={theme.accent_color}
              isLightBg={isLight}
            />
          </div>

          {/* Tabs: Links vs Discover if show_discover_tab is enabled */}
          {theme.show_discover_tab !== false && (
            <div className="w-full flex items-center justify-center mt-2 mb-1">
              <div
                className={`p-0.5 rounded-xl flex items-center gap-1 border backdrop-blur-md text-[10px] font-semibold ${
                  isLight
                    ? 'bg-slate-200/80 border-slate-300/70'
                    : 'bg-white/10 border-white/15'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('links')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'links'
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-600'
                      : 'text-white/70'
                  }`}
                >
                  <span>Links</span>
                  <span className="opacity-75">({activeLinks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    activeTab === 'discover'
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-600'
                      : 'text-white/70'
                  }`}
                >
                  <Compass className="w-3 h-3 text-indigo-400" />
                  <span>Discover</span>
                </button>
              </div>
            </div>
          )}

          {/* Links or Discover Content */}
          {activeTab === 'discover' && theme.show_discover_tab !== false ? (
            <div className="w-full text-left my-2">
              <DiscoverTab
                username={profile.username}
                theme={theme}
                isLightBg={isLight}
                accentColor={theme.accent_color}
              />
            </div>
          ) : (
            /* Links List */
            <div className="w-full space-y-2 mt-2 mb-4">
              {activeLinks.length === 0 ? (
                <div className="text-[10px] p-4 rounded-xl border border-white/10 text-white/40">
                  No active links
                </div>
              ) : (
                activeLinks.map((link) => (
                  <div key={link.id} className="text-xs">
                    <LinkButton
                      link={link}
                      theme={theme}
                      onTrackClick={() => {}}
                      previewMode={true}
                    />
                  </div>
                ))
              )}

              {/* QR Code in Phone Preview */}
              {theme.show_qr_code && (
                <div className="pt-1 text-xs">
                  <PublicQrCard
                    profile={profile}
                    url={`${typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app'}/${profile.username}`}
                    theme={theme}
                    className="scale-95 origin-top"
                  />
                </div>
              )}
            </div>
          )}

          <div className="mt-auto pt-2 pb-0.5 flex items-center justify-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[9px] font-medium text-white/80 border border-white/10 select-none">
              <span className="opacity-75">Made with</span>
              <span className="font-semibold text-white flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-indigo-400" />
                LinkNest
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
