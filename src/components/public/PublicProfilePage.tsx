import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Profile, LinkItem, SocialIconItem } from '../../types';
import { supabase, localSimulator, enrichLinksWithLocalDescriptions, recordLinkClick } from '../../lib/supabase';
import { SocialIconRow } from './SocialIconRow';
import { LinkButton } from './LinkButton';
import { DiscoverTab } from './DiscoverTab';
import { PublicQrCard } from './PublicQrCard';
import { PasswordGate } from './PasswordGate';
import { getProfileSeoMetadata, generateClientOgSvg, buildOgImageUrl } from '../../lib/og';
import QRCode from 'qrcode';
import { QrCodeModal } from '../dashboard/QrCodeModal';
import { LinkNestLogo } from '../common/LinkNestLogo';
import {
  Share2,
  Lock,
  Copy,
  Check,
  QrCode,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Download,
  Share,
  Globe,
  Printer,
  Compass,
  MessageCircle,
  Twitter,
  Linkedin,
  Send,
  Facebook,
  Mail,
} from 'lucide-react';

interface PublicProfilePageProps {
  username: string;
  onOpenDashboard?: () => void;
  isOwner?: boolean;
  onProfileLoaded?: (profile: Profile) => void;
}

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({
  username,
  onOpenDashboard,
  isOwner = false,
  onProfileLoaded,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [socialIcons, setSocialIcons] = useState<SocialIconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [shareTab, setShareTab] = useState<'link' | 'og' | 'qr'>('link');
  const [copied, setCopied] = useState(false);
  const [copiedOgLink, setCopiedOgLink] = useState(false);
  const [modalQrUrl, setModalQrUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'links' | 'discover'>('links');

  // Password protection unlock state
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const cleanUsername = username.toLowerCase().trim();

      // Query profile by username (using maybeSingle)
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();

      // If viewing silvio or demo profile before live remote data exists,
      // load from local simulator seed so preview is always populated
      if (!profileData && (cleanUsername === 'silvio' || cleanUsername === 'demo')) {
        const localProf = await localSimulator.from('profiles').select('*').eq('username', cleanUsername).maybeSingle();
        if (localProf.data) {
          profileData = localProf.data;
        }
      }

      if (!profileData) {
        setError(`Profile @${username} not found.`);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      onProfileLoaded?.(profileData);

      // Check password gate state
      const isProtected = Boolean(
        (profileData.is_password_protected || profileData.theme?.is_password_protected) &&
        (profileData.profile_password || profileData.theme?.profile_password)
      );
      if (!isProtected) {
        setIsUnlocked(true);
      } else {
        const unlockKey = `unlocked_profile_${profileData.id}`;
        setIsUnlocked(sessionStorage.getItem(unlockKey) === 'true');
      }

      // Fire-and-forget increment view count (matches SQL function: increment_profile_view(profile_username text))
      const sessionKey = `viewed_profile_${profileData.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        supabase.rpc('increment_profile_view', {
          profile_username: profileData.username,
          username: profileData.username,
          p_profile_id: profileData.id,
        }).catch(() => {});
      }

      // Query active links (RLS automatically enforces active and date windows for public)
      let activeLinks: LinkItem[] = [];
      const localSavedLinksStr = localStorage.getItem('linknest_saved_links_' + profileData.id);
      if (localSavedLinksStr) {
        try {
          const parsed = JSON.parse(localSavedLinksStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            activeLinks = parsed.filter((l) => l.is_active && !l.is_archived);
          }
        } catch {}
      }

      if (activeLinks.length === 0) {
        const { data: linksData } = await supabase
          .from('links')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('position', { ascending: true });

        if (linksData && linksData.length > 0) {
          activeLinks = enrichLinksWithLocalDescriptions(linksData);
        } else if ((cleanUsername === 'silvio' || cleanUsername === 'demo') && (!linksData || linksData.length === 0)) {
          const localLinks = await localSimulator.from('links').select('*').eq('profile_id', profileData.id).order('position', { ascending: true });
          if (localLinks.data) activeLinks = enrichLinksWithLocalDescriptions(localLinks.data);
        }
      }
      setLinks(enrichLinksWithLocalDescriptions(activeLinks));

      // Query social icons
      let activeSocial: SocialIconItem[] = [];
      const { data: socialData } = await supabase
        .from('social_icons')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('position', { ascending: true });

      if (socialData && socialData.length > 0) {
        activeSocial = socialData;
      } else if ((cleanUsername === 'silvio' || cleanUsername === 'demo') && (!socialData || socialData.length === 0)) {
        const localSoc = await localSimulator.from('social_icons').select('*').eq('profile_id', profileData.id);
        if (localSoc.data) activeSocial = localSoc.data;
      }
      setSocialIcons(activeSocial);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  // Real-time synchronization of link click counters
  useEffect(() => {
    const handleRemoteClick = (e: any) => {
      const { linkId, clickCount } = e.detail || {};
      if (linkId) {
        setLinks((prev) =>
          prev.map((l) => (l.id === linkId ? { ...l, click_count: clickCount } : l))
        );
      }
    };
    window.addEventListener('linknest:click_tracked', handleRemoteClick);
    return () => window.removeEventListener('linknest:click_tracked', handleRemoteClick);
  }, []);

  // Click tracking handler that increments immediately and persists
  const handleLinkClick = async (link: LinkItem) => {
    const newCount = recordLinkClick(link.id, link.click_count || 0, link.profile_id || profile?.id);
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, click_count: newCount } : l))
    );
  };

  // Share actions
  const shareUrl = window.location.origin + (window.location.pathname.startsWith('/' + username) ? window.location.pathname : `/${username}`);
  const effectivePublicUrl = shareUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.display_name || 'LinkNest Profile',
          text: profile?.bio || `Check out ${profile?.display_name}'s links on LinkNest!`,
          url: shareUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Check if background is light or dark to adapt contrast
  const isLightBackground = useMemo(() => {
    if (!profile) return false;
    const bg = profile.theme.bg_value.toLowerCase();
    return bg.includes('f8fafc') || bg.includes('fdfbf7') || bg.includes('ffffff') || bg.includes('clean') || bg.includes('light');
  }, [profile]);

  // Generate QR code Data URL for modal (MUST be called before early returns per Rules of Hooks)
  useEffect(() => {
    if (profile && (showShareModal || showQrModal)) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';
      const targetUrl = `${origin}/${profile.username}`;
      QRCode.toDataURL(targetUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#4f46e5',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setModalQrUrl(url))
        .catch((err) => console.error('Failed generating QR:', err));
    }
  }, [profile, showShareModal, showQrModal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <Helmet>
          <title>Loading Profile | LinkNest</title>
          <meta name="description" content="Loading LinkNest creator profile and links..." />
        </Helmet>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-medium tracking-wide">Loading @{username}...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
        <Helmet>
          <title>Profile Not Found (@{username}) | LinkNest</title>
          <meta name="description" content={`The LinkNest profile @${username} was not found.`} />
        </Helmet>
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            The profile <span className="text-indigo-400 font-mono">@{username}</span> does not exist or has been removed.
          </p>
          <div className="space-y-2">
            <button
              id="back-to-home-btn"
              onClick={() => {
                window.location.href = '/demo';
              }}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all"
            >
              View Live Demo
            </button>
            <button
              id="go-to-homepage-btn"
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check Password Gate
  const isPasswordGated = Boolean(
    (profile.is_password_protected || profile.theme?.is_password_protected) &&
    (profile.profile_password || profile.theme?.profile_password)
  );

  if (isPasswordGated && !isUnlocked) {
    return (
      <>
        <Helmet>
          <title>Password Protected | {profile.display_name} (@{profile.username})</title>
          <meta name="description" content={`Enter password to access @${profile.username}'s bio links.`} />
        </Helmet>
        <PasswordGate
          profile={profile}
          theme={profile.theme}
          onUnlock={() => setIsUnlocked(true)}
          onOpenDashboard={onOpenDashboard}
          isOwner={isOwner}
        />
      </>
    );
  }

  // Active links filtered per AC5 (start_date/end_date) and archiving
  const now = new Date();
  const visibleLinks = links
    .filter((l) => {
      if (!l.is_active || l.is_archived) return false;
      if (l.start_date && new Date(l.start_date) > now) return false;
      if (l.end_date && new Date(l.end_date) < now) return false;
      return true;
    })
    .sort((a, b) => {
      // Featured links ALWAYS come first at the very top!
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.position - b.position;
    });

  // Dynamic SEO and Open Graph metadata calculations
  const seo = getProfileSeoMetadata({
    username: profile.username,
    displayName: profile.display_name,
    bio: profile.bio,
    metaTitle: profile.meta_title,
    metaDescription: profile.meta_description,
    accentColor: profile.theme?.accent_color || '#6366f1',
    linksCount: visibleLinks.length,
    avatarUrl: profile.avatar_url,
  });

  // Client-generated vector SVG for zero-latency local preview & download
  const clientOgSvg = generateClientOgSvg({
    username: profile.username,
    displayName: profile.display_name,
    bio: profile.bio,
    accentColor: profile.theme?.accent_color || '#6366f1',
    linksCount: visibleLinks.length,
    avatarUrl: profile.avatar_url,
  });

  const displayHost = typeof window !== 'undefined' && window.location.host
    ? window.location.host
    : 'linknest-link-in-bio.vercel.app';

  const handleDownloadOgSvg = () => {
    try {
      const blob = new Blob([clientOgSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.username}-linknest-og.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback
    }
  };

  const handleCopyOgLink = async () => {
    try {
      await navigator.clipboard.writeText(seo.ogImageUrl);
      setCopiedOgLink(true);
      setTimeout(() => setCopiedOgLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // Background style
  const bgStyle: React.CSSProperties = {
    background: profile.theme.bg_value.includes('gradient') || profile.theme.bg_value.startsWith('#')
      ? profile.theme.bg_value
      : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
    fontFamily: `"${profile.theme.font_family || 'Plus Jakarta Sans'}", sans-serif`,
  };

  const textContrastClass = isLightBackground ? 'text-slate-900' : 'text-white';
  const subtextContrastClass = isLightBackground ? 'text-slate-600' : 'text-slate-300';

  return (
    <div
      style={bgStyle}
      className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 transition-colors duration-300 relative overflow-x-hidden"
    >
      {/* Dynamic SEO & Open Graph Meta Tags via React Helmet */}
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonicalUrl} />

        {/* Open Graph Meta Tags for Facebook, LinkedIn, Discord, Telegram, WhatsApp */}
        <meta property="og:site_name" content="LinkNest" />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonicalUrl} />
        <meta property="og:image" content={seo.ogImageUrl} />
        <meta property="og:image:secure_url" content={seo.ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:image:alt" content={seo.title} />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={seo.ogImageUrl} />
        <meta name="twitter:image:alt" content={seo.title} />
      </Helmet>
      {/* Top Floating Bar: LinkNest Brand Logo on Left & Actions on Right */}
      <header className="w-full max-w-xl flex items-center justify-between pt-2 pb-6 px-2 z-20 gap-2">
        {/* Top Left: LinkNest Brand Logo */}
        <a
          href="/"
          title="Powered by LinkNest"
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all duration-200 group active:scale-95 shrink-0 ${
            isLightBackground
              ? 'bg-white/80 hover:bg-white text-slate-800 border border-slate-200/90 shadow-sm'
              : 'bg-slate-900/60 hover:bg-slate-800/80 text-white border border-slate-800/80 backdrop-blur-md shadow-sm'
          }`}
        >
          <LinkNestLogo size={22} />
          <span className="font-bold text-xs tracking-tight text-white group-hover:text-indigo-400 transition-colors">
            LinkNest
          </span>
        </a>

        <div className="flex items-center gap-2 shrink-0">
          {/* Re-lock button if profile is password protected */}
          {isPasswordGated && (
            <button
              id="lock-profile-btn"
              onClick={() => {
                sessionStorage.removeItem(`unlocked_profile_${profile.id}`);
                setIsUnlocked(false);
              }}
              title="Lock Profile (Protected by Password)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer min-h-[36px] ${
                isLightBackground
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Lock</span>
            </button>
          )}

          {/* Direct QR Code button */}
          <button
            id="public-qr-code-btn"
            onClick={() => setShowQrModal(true)}
            aria-label="Offline QR Code"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 backdrop-blur-md shadow-sm active:scale-95 cursor-pointer min-h-[36px] ${
              isLightBackground
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 hover:shadow'
                : 'bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30'
            }`}
            title="Open Offline QR Code & Printable Flyer"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xs:inline">QR Code</span>
          </button>

          <button
            id="share-profile-btn"
            onClick={() => setShowShareModal(true)}
            aria-label="Share Profile"
            className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-sm ${
              isLightBackground
                ? 'bg-white/80 hover:bg-white text-slate-800 border border-slate-200 hover:shadow'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
            title="Share Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {onOpenDashboard && (
            <button
              id="owner-dashboard-btn"
              onClick={onOpenDashboard}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md shadow-sm min-h-[36px] ${
                isLightBackground
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isOwner ? 'Dashboard' : 'Owner Login'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Profile Container */}
      <main className="w-full max-w-xl flex flex-col items-center text-center my-auto z-10 px-3 sm:px-0">
        {/* Avatar - Prominent focal hero element */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative mb-5 group"
        >
          <div
            className="profile-avatar-container w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full p-2 shadow-2xl transition-transform duration-300 group-hover:scale-105 ring-4 ring-white/20"
            style={{
              background: `linear-gradient(135deg, ${profile.theme.accent_color}, transparent)`,
            }}
          >
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={profile.display_name}
              className="profile-avatar-image w-full h-full object-cover rounded-full bg-slate-800 border-2 border-white/50 shadow-inner"
              onError={(e) => {
                // Fallback avatar
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
              }}
            />
          </div>
        </motion.div>

        {/* Display Name & Username */}
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="space-y-1 mb-2"
        >
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textContrastClass}`}>
            {profile.display_name}
          </h1>
          <p className={`text-xs sm:text-sm font-medium opacity-80 ${subtextContrastClass}`}>
            @{profile.username}
          </p>
        </motion.div>

        {/* Bio */}
        {profile.bio && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className={`w-full max-w-2xl mx-auto mb-3.5 px-2 ${subtextContrastClass}`}
          >
            {profile.bio
              .replace(/🚀\s*\|\s*/g, '🚀\n')
              .split('\n')
              .map((line, idx) => (
                <p
                  key={idx}
                  className={
                    idx === 0
                      ? 'text-sm sm:text-base font-semibold leading-relaxed mb-0.5 tracking-tight'
                      : 'text-[12px] sm:text-sm leading-relaxed whitespace-normal break-words opacity-90'
                  }
                >
                  {line.trim()}
                </p>
              ))}
          </motion.div>
        )}

        {/* Social Icons Row (excluding youtube and medium, which are listed as link rows) */}
        {socialIcons.filter((i) => i.platform !== 'youtube' && i.platform !== 'medium').length > 0 && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="social-icon-row w-full flex items-center justify-center my-4 sm:my-5"
          >
            <SocialIconRow
              icons={socialIcons.filter((i) => i.platform !== 'youtube' && i.platform !== 'medium')}
              accentColor={profile.theme.accent_color}
              isLightBg={isLightBackground}
            />
          </motion.div>
        )}

        {/* Tab Switcher: Links vs Discover (Only displayed if Discover tab is enabled in theme settings) */}
        {profile.theme.show_discover_tab !== false && (
          <div className="w-full max-w-xl mx-auto flex items-center justify-center my-3 px-1">
            <div
              className={`p-1 rounded-2xl flex items-center gap-1.5 border backdrop-blur-md shadow-xs transition-colors ${
                isLightBackground
                  ? 'bg-slate-200/80 border-slate-300/70'
                  : 'bg-white/10 border-white/15'
              }`}
            >
              <button
                type="button"
                id="public-tab-links"
                onClick={() => setActiveTab('links')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'links'
                    ? isLightBackground
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-indigo-600 text-white shadow-md'
                    : isLightBackground
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <span>Links</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    activeTab === 'links'
                      ? isLightBackground
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-indigo-700 text-indigo-100'
                      : 'bg-black/10 text-current opacity-75'
                  }`}
                >
                  {visibleLinks.length}
                </span>
              </button>

              <button
                type="button"
                id="public-tab-discover"
                onClick={() => setActiveTab('discover')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'discover'
                    ? isLightBackground
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-indigo-600 text-white shadow-md'
                    : isLightBackground
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Discover</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Trending
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: Links or Discover */}
        {activeTab === 'discover' && profile.theme.show_discover_tab !== false ? (
          <motion.div
            key="tab-discover"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xl mx-auto my-3 px-0"
          >
            <DiscoverTab
              username={profile.username}
              theme={profile.theme}
              isLightBg={isLightBackground}
              accentColor={profile.theme.accent_color}
            />
          </motion.div>
        ) : (
          /* Links List Container: full-width on mobile, max-w-xl on larger screens */
          <motion.div
            key="tab-links"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="link-container w-full max-w-xl mx-auto space-y-3.5 my-4 sm:my-5 px-0"
          >
            {visibleLinks.length === 0 ? (
              <div
                className={`p-6 rounded-2xl border text-sm backdrop-blur-md ${
                  isLightBackground
                    ? 'bg-white/60 border-slate-200 text-slate-500'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                No active links published yet. Check back soon!
              </div>
            ) : (
              visibleLinks.map((link) => (
                <LinkButton
                  key={link.id}
                  link={link}
                  theme={profile.theme}
                  onTrackClick={handleLinkClick}
                />
              ))
            )}

            {/* Optional QR Code Card on Public Profile */}
            {profile.theme?.show_qr_code && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="pt-2 w-full"
              >
                <PublicQrCard
                  profile={profile}
                  url={effectivePublicUrl}
                  theme={profile.theme}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer: Clean & properly formatted 'Made with LinkNest' branding */}
      <footer className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-6 sm:py-8 mt-auto z-10 text-center">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 backdrop-blur-md shadow-xs hover:scale-105 active:scale-95 select-none ${
            isLightBackground
              ? 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 hover:text-slate-900 border border-slate-900/10'
              : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/15'
          }`}
          title="Create your custom link-in-bio on LinkNest"
        >
          <span className="opacity-75">Made with</span>
          <span className="font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            LinkNest
          </span>
        </a>
      </footer>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">Share Profile</h3>
                    <p className="text-[11px] text-slate-400">Public link &amp; Open Graph preview</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Share Tabs: Link vs QR Code vs Social Preview */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold gap-1">
                <button
                  type="button"
                  id="share-tab-link"
                  onClick={() => setShareTab('link')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    shareTab === 'link'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Profile Link</span>
                </button>
                <button
                  type="button"
                  id="share-tab-qr"
                  onClick={() => setShareTab('qr')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    shareTab === 'qr'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </button>
                <button
                  type="button"
                  id="share-tab-og"
                  onClick={() => setShareTab('og')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    shareTab === 'og'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Social (OG)</span>
                </button>
              </div>

              {shareTab === 'link' ? (
                <>
                  {/* Profile summary with Live indicator */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                      <img src={profile.avatar_url || '/icon.svg'} alt={profile.display_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate text-sm">{profile.display_name}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400 truncate">{displayHost}/{profile.username}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{visibleLinks.length} active links</p>
                    </div>
                  </div>

                  {/* Direct Social Channels */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Share to Apps</label>
                      <span className="text-[11px] text-slate-400">One-click share</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {/* WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${profile.display_name}'s profile on LinkNest: ${shareUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 transition-all active:scale-95 group text-center"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium leading-none">WhatsApp</span>
                      </a>
                      {/* X / Twitter */}
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${profile.display_name}'s links on @LinkNest:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all active:scale-95 group text-center"
                        title="Share on X"
                      >
                        <Twitter className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium leading-none">X</span>
                      </a>
                      {/* LinkedIn */}
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 transition-all active:scale-95 group text-center"
                        title="Share on LinkedIn"
                      >
                        <Linkedin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium leading-none">LinkedIn</span>
                      </a>
                      {/* Telegram */}
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${profile.display_name}'s profile on LinkNest`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 text-sky-300 transition-all active:scale-95 group text-center"
                        title="Share on Telegram"
                      >
                        <Send className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium leading-none">Telegram</span>
                      </a>
                      {/* Facebook */}
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 transition-all active:scale-95 group text-center"
                        title="Share on Facebook"
                      >
                        <Facebook className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium leading-none">Facebook</span>
                      </a>
                      {/* Email */}
                      <a
                        href={`mailto:?subject=${encodeURIComponent(`${profile.display_name} on LinkNest`)}&body=${encodeURIComponent(`Hi,\n\nCheck out ${profile.display_name}'s links on LinkNest:\n${shareUrl}\n`)}`}
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 group text-center"
                        title="Share via Email"
                      >
                        <Mail className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium leading-none">Email</span>
                      </a>
                    </div>
                  </div>

                  {/* URL field with copy */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Shareable Profile Link</label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="bg-transparent text-xs text-slate-300 w-full outline-none px-1"
                      />
                      <button
                        id="copy-link-modal-btn"
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleNativeShare}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700/60"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Native Share</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowShareModal(false);
                        setShowQrModal(true);
                      }}
                      className="w-full py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-indigo-500/40"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Offline QR</span>
                    </button>
                  </div>
                </>
              ) : shareTab === 'qr' ? (
                /* QR Code Offline Suite Tab */
                <div className="space-y-3.5 text-center">
                  <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg mx-auto border-2 border-indigo-500/30 relative">
                    {modalQrUrl ? (
                      <div className="relative">
                        <img
                          src={modalQrUrl}
                          alt={`QR Code for ${profile.username}`}
                          className="w-44 h-44 object-contain mx-auto rounded-lg"
                        />
                        {profile.avatar_url && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-md">
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                        Generating offline QR...
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Scan to Open Profile</h4>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">{displayHost}/{profile.username}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Works offline! Great for event name tags, resumes, stickers &amp; tables.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      id="modal-open-flyer-btn"
                      onClick={() => {
                        setShowShareModal(false);
                        setShowQrModal(true);
                      }}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Full Poster / Flyer</span>
                    </button>

                    <button
                      type="button"
                      id="modal-copy-qr-link-btn"
                      onClick={handleCopyLink}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Copy Profile Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Social Card & Open Graph Section */
                <div className="space-y-3.5">
                  {/* Live Visual Card Preview */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group">
                    <div
                      className="w-full aspect-[1200/630] flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: clientOgSvg }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-semibold text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>1200 × 630 Satori OG</span>
                    </div>
                  </div>

                  {/* Social metadata snippet */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 truncate">Card Title:</span>
                      <span className="text-emerald-400 font-mono text-[10px]">og:title</span>
                    </div>
                    <p className="text-xs text-white font-medium truncate">{seo.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-0.5">
                      {seo.description}
                    </p>
                  </div>

                  {/* Open Graph Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      id="copy-og-url-btn"
                      onClick={handleCopyOgLink}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                    >
                      {copiedOgLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied URL!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Copy OG Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="download-og-btn"
                      onClick={handleDownloadOgSvg}
                      className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download SVG</span>
                    </button>
                  </div>

                  <div className="pt-0.5 text-center">
                    <a
                      href={seo.ogImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <span>Open direct server-rendered OG image in new tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-featured Offline QR Code & Printable Flyer Modal */}
      {profile && (
        <QrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          profile={profile}
          customUrl={effectivePublicUrl}
        />
      )}
    </div>
  );
};
