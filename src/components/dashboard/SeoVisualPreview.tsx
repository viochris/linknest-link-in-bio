import React, { useState } from 'react';
import { Profile } from '../../types';
import {
  Search,
  Copy,
  Check,
  Code2,
  ChevronDown,
  ChevronUp,
  Globe,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface SeoVisualPreviewProps {
  profile: Profile;
  linksCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  onMetaTitleChange?: (newTitle: string) => void;
  onMetaDescriptionChange?: (newDesc: string) => void;
}

export const SeoVisualPreview: React.FC<SeoVisualPreviewProps> = ({
  profile,
  linksCount = 5,
  metaTitle: propMetaTitle,
  metaDescription: propMetaDescription,
}) => {
  const [googleDevice, setGoogleDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [googleTheme, setGoogleTheme] = useState<'light' | 'dark'>('light');
  const [showMetaCode, setShowMetaCode] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';
  const username = profile.username || 'silvio';
  const displayName = profile.display_name || username;
  const canonicalUrl = `${origin}/${username}`;

  // Live Meta Title (reflects real-time changes)
  const activeTitle = (
    propMetaTitle !== undefined
      ? propMetaTitle
      : profile.meta_title || ''
  ).trim();

  const resolvedTitle = activeTitle || `${displayName} (@${username}) | LinkNest`;

  // Live Meta Description (reflects real-time changes)
  const activeDescription = (
    propMetaDescription !== undefined
      ? propMetaDescription
      : profile.meta_description || ''
  ).trim();

  const resolvedDescription = activeDescription || (
    profile.bio
      ? profile.bio.replace(/\n/g, ' ').trim()
      : `Explore verified links, portfolio projects, and social channels for ${displayName} (@${username}) on LinkNest.`
  );

  let absoluteAvatar = profile.avatar_url || '/avatar-silvio.png';
  if (absoluteAvatar.startsWith('/')) {
    absoluteAvatar = `${origin}${absoluteAvatar}`;
  }

  // Calculate Title and Description Length Metrics
  const titleLen = resolvedTitle.length;
  const descLen = resolvedDescription.length;

  const isTitleOptimal = titleLen >= 30 && titleLen <= 60;
  const isTitleTruncated = titleLen > 60;
  const isDescOptimal = descLen >= 120 && descLen <= 160;
  const isDescTruncated = descLen > 160;

  // Copy Full HTML Meta Tags snippet
  const handleCopyMetaTags = async () => {
    const metaSnippet = `<!-- LinkNest SEO & Social Meta Tags for @${username} -->
<title>${resolvedTitle}</title>
<meta name="description" content="${resolvedDescription}" />
<link rel="canonical" href="${canonicalUrl}" />

<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:site_name" content="LinkNest" />
<meta property="og:type" content="profile" />
<meta property="og:title" content="${resolvedTitle}" />
<meta property="og:description" content="${resolvedDescription}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:image" content="${absoluteAvatar}" />

<!-- Twitter / X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${resolvedTitle}" />
<meta name="twitter:description" content="${resolvedDescription}" />
<meta name="twitter:image" content="${absoluteAvatar}" />`;

    try {
      await navigator.clipboard.writeText(metaSnippet);
      setCopiedMeta(true);
      setTimeout(() => setCopiedMeta(false), 2500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5 text-left font-sans">
      {/* Top Header: Controls for Google SERP & Real-time Live Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Google Search Preview</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (SERP Snippet)
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Light/Dark Toggle */}
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setGoogleTheme('light')}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                googleTheme === 'light' ? 'bg-slate-800 text-amber-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Google Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setGoogleTheme('dark')}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                googleTheme === 'dark' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Google Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop vs Mobile Toggle */}
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setGoogleDevice('desktop')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                googleDevice === 'desktop' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setGoogleDevice('mobile')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                googleDevice === 'mobile' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* Health / Length Analysis Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Meta Title Length
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-sm text-white">{titleLen} / 60</span>
              <span className="text-[11px] text-slate-400">characters</span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 border ${
              isTitleOptimal
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isTitleTruncated
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            {isTitleOptimal ? 'Optimal' : isTitleTruncated ? 'May Truncate' : 'Short'}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Meta Description Length
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-sm text-white">{descLen} / 160</span>
              <span className="text-[11px] text-slate-400">characters</span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 border ${
              isDescOptimal
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : isDescTruncated
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            {isDescOptimal ? 'Optimal' : isDescTruncated ? 'May Truncate' : 'Short'}
          </span>
        </div>
      </div>

      {/* Google Search Mockup Container */}
      <div
        className={`w-full rounded-2xl p-4 sm:p-5 transition-all duration-200 border shadow-lg ${
          googleTheme === 'light'
            ? 'bg-white text-[#202124] border-slate-200 shadow-slate-200/50'
            : 'bg-[#202124] text-[#bdc1c6] border-[#3c4043] shadow-black/50'
        } ${googleDevice === 'mobile' ? 'max-w-md mx-auto rounded-3xl' : ''}`}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Google Result Header / Favicon + Breadcrumb */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border overflow-hidden ${
              googleTheme === 'light'
                ? 'bg-slate-100 border-slate-200 text-indigo-600'
                : 'bg-[#303134] border-[#3c4043] text-indigo-400'
            }`}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Globe className="w-4 h-4 text-indigo-500" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span
              className={`text-xs font-normal leading-tight truncate ${
                googleTheme === 'light' ? 'text-[#202124]' : 'text-[#dadce0]'
              }`}
            >
              LinkNest
            </span>
            <span
              className={`text-[11px] leading-tight truncate font-sans ${
                googleTheme === 'light' ? 'text-[#4d5156]' : 'text-[#bdc1c6]'
              }`}
            >
              https://linknest.app › {username}
            </span>
          </div>
        </div>

        {/* Google Search Title Headline */}
        <h3
          className={`text-base sm:text-lg font-normal leading-snug hover:underline cursor-pointer mb-1 transition-colors line-clamp-2 ${
            googleTheme === 'light'
              ? 'text-[#1a0dab]'
              : 'text-[#8ab4f8]'
          }`}
        >
          {resolvedTitle}
        </h3>

        {/* Google Search Description Snippet */}
        <p
          className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${
            googleTheme === 'light' ? 'text-[#4d5156]' : 'text-[#bdc1c6]'
          }`}
        >
          {resolvedDescription}
        </p>

        {/* Google Sitelinks / Sitelink Badges preview */}
        <div
          className={`mt-3 pt-2.5 border-t flex flex-wrap gap-2 text-[11px] ${
            googleTheme === 'light' ? 'border-slate-100 text-[#1a0dab]' : 'border-[#3c4043] text-[#8ab4f8]'
          }`}
        >
          <span className="hover:underline cursor-pointer font-medium">Verified Profile</span>
          <span className={googleTheme === 'light' ? 'text-slate-300' : 'text-slate-600'}>•</span>
          <span className="hover:underline cursor-pointer font-medium">{linksCount} Curated Links</span>
          <span className={googleTheme === 'light' ? 'text-slate-300' : 'text-slate-600'}>•</span>
          <span className="hover:underline cursor-pointer font-medium">Connect &amp; Socials</span>
        </div>
      </div>

      {/* Meta Code & Metadata Drawer */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Search Engine &amp; Open Graph Meta Tags</span>
          </span>

          <button
            type="button"
            id="toggle-meta-code-btn"
            onClick={() => setShowMetaCode(!showMetaCode)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>{showMetaCode ? 'Hide HTML Tags' : 'View HTML Meta Tags'}</span>
            {showMetaCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Raw HTML Meta Tags */}
        {showMetaCode && (
          <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
            <button
              type="button"
              id="copy-meta-tags-btn"
              onClick={handleCopyMetaTags}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[10px] flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer shadow-sm"
            >
              {copiedMeta ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedMeta ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <p className="text-slate-500 font-sans text-[10px] pb-1">&lt;!-- LinkNest Dynamic Head SEO Tags --&gt;</p>
            <p>&lt;title&gt;{resolvedTitle}&lt;/title&gt;</p>
            <p>&lt;meta name="description" content="{resolvedDescription}" /&gt;</p>
            <p>&lt;link rel="canonical" href="{canonicalUrl}" /&gt;</p>
            <p>&lt;meta property="og:site_name" content="LinkNest" /&gt;</p>
            <p>&lt;meta property="og:type" content="profile" /&gt;</p>
            <p>&lt;meta property="og:title" content="{resolvedTitle}" /&gt;</p>
            <p>&lt;meta property="og:description" content="{resolvedDescription}" /&gt;</p>
            <p>&lt;meta property="og:url" content="{canonicalUrl}" /&gt;</p>
            <p>&lt;meta property="og:image" content="{absoluteAvatar}" /&gt;</p>
            <p>&lt;meta name="twitter:card" content="summary_large_image" /&gt;</p>
            <p>&lt;meta name="twitter:title" content="{resolvedTitle}" /&gt;</p>
            <p>&lt;meta name="twitter:description" content="{resolvedDescription}" /&gt;</p>
            <p>&lt;meta name="twitter:image" content="{absoluteAvatar}" /&gt;</p>
          </div>
        )}
      </div>
    </div>
  );
};
