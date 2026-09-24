import React, { useState } from 'react';
import { RenderIcon } from '../../lib/icons';
import { resolveLinkIcon, LinkPlatform } from '../../lib/domainIcons';
import { LinkMetadataResult } from '../../lib/linkMetadata';
import {
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Eye,
  Globe,
  Loader2,
  CopyCheck
} from 'lucide-react';

interface LinkPreviewCardProps {
  url: string;
  title: string;
  description: string;
  icon: string;
  isFeatured: boolean;
  metadata: LinkMetadataResult | null;
  isLoading: boolean;
  onApplyOgMetadata?: (ogTitle: string, ogDescription: string) => void;
  onRefreshMetadata?: () => void;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({
  url,
  title,
  description,
  icon,
  isFeatured,
  metadata,
  isLoading,
  onApplyOgMetadata,
  onRefreshMetadata,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [viewMode, setViewMode] = useState<'profile-card' | 'rich-og'>('profile-card');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Derive resolved icon & platform from URL
  const { iconKey, platform } = resolveLinkIcon(icon, url);

  // Fallback display values
  const effectiveTitle = title.trim() || metadata?.title || (url ? 'Your Link Title' : 'Enter Destination URL');
  const effectiveDesc = description.trim() || metadata?.description || '';
  const displayDomain = metadata?.domain || (url ? url.replace(/^https?:\/\//i, '').split('/')[0] : 'yourdomain.com');
  const hasOgImage = Boolean(metadata?.image && !imgFailed);
  const canApplyOg = Boolean(
    metadata &&
    (metadata.title || metadata.description) &&
    (metadata.title !== title || metadata.description !== description)
  );

  const handleApply = () => {
    if (!metadata || !onApplyOgMetadata) return;
    onApplyOgMetadata(metadata.title || '', metadata.description || '');
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Live Link Preview
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (What visitors see on your profile)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Fetching OpenGraph...</span>
            </span>
          ) : metadata?.title ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              <Check className="w-2.5 h-2.5" />
              <span>OpenGraph Detected</span>
            </span>
          ) : null}

          {onRefreshMetadata && url && (
            <button
              type="button"
              onClick={onRefreshMetadata}
              disabled={isLoading}
              title="Refresh OpenGraph metadata from URL"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Switcher & Auto-Fill Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('profile-card')}
            className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              viewMode === 'profile-card'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile Button
          </button>
          <button
            type="button"
            onClick={() => setViewMode('rich-og')}
            className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'rich-og'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>OG Media Card {hasOgImage ? '•' : ''}</span>
          </button>
        </div>

        {canApplyOg && (
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Auto-fill Title and Description using scraped OpenGraph tags"
          >
            {copiedNotification ? (
              <>
                <CopyCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">Applied!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Auto-Fill Title &amp; Subtitle from OG</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* View Mode 1: Profile Button Preview (Matches LinkNest Public Link Button) */}
      {viewMode === 'profile-card' && (
        <div className="w-full">
          <div
            className={`group relative w-full p-3.5 sm:p-4 rounded-xl border transition-all text-left flex items-center gap-3 shadow-md ${
              isFeatured
                ? 'bg-slate-900/90 border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Left Icon Badge */}
            <div
              className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shrink-0 relative transition-transform"
              style={{
                color: platform ? platform.brandColor : '#818cf8',
              }}
            >
              <RenderIcon name={iconKey} className="w-5 h-5" />
              {platform && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900"
                  style={{ backgroundColor: platform.brandColor }}
                />
              )}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-white text-sm truncate max-w-full">
                  {effectiveTitle}
                </span>

                {isFeatured && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-2.5 h-2.5" /> Featured
                  </span>
                )}

                {platform && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider"
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

              {effectiveDesc ? (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {effectiveDesc}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  No subtitle entered yet
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-indigo-400/80 font-mono mt-1">
                <Globe className="w-2.5 h-2.5" />
                <span className="truncate max-w-[200px]">{displayDomain}</span>
              </div>
            </div>

            {/* Right Arrow */}
            <div className="text-slate-500 shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* View Mode 2: Rich OpenGraph Media Card Preview */}
      {viewMode === 'rich-og' && (
        <div className="w-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
          {/* OG Image Banner if available */}
          {hasOgImage ? (
            <div className="relative w-full aspect-[1.91/1] max-h-48 bg-slate-950 overflow-hidden border-b border-slate-800">
              <img
                src={metadata?.image}
                alt={effectiveTitle}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white font-mono border border-white/10 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-indigo-400" />
                <span>og:image</span>
              </div>
            </div>
          ) : (
            <div className="w-full py-6 px-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col items-center justify-center text-center text-slate-500 space-y-1">
              <ImageIcon className="w-6 h-6 text-slate-600 mb-1" />
              <p className="text-xs font-medium text-slate-400">
                {isLoading ? 'Scanning for OpenGraph image...' : 'No og:image detected from destination'}
              </p>
              <p className="text-[10px] text-slate-600">
                The standard LinkNest button with icon &amp; title will be used
              </p>
            </div>
          )}

          {/* OG Content Info */}
          <div className="p-3.5 space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>{metadata?.siteName || displayDomain}</span>
            </div>

            <h4 className="text-sm font-bold text-white line-clamp-1">
              {metadata?.title || effectiveTitle}
            </h4>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {metadata?.description || effectiveDesc || 'No OpenGraph description provided by target server.'}
            </p>

            <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="truncate max-w-[260px] text-indigo-300">
                {url || 'https://...'}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
