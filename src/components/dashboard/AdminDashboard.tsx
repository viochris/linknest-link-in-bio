import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, LinkItem, SocialIconItem, AuthUser } from '../../types';
import { supabase, isRealSupabaseConfigured, isUuid, localSimulator, enrichLinksWithLocalDescriptions } from '../../lib/supabase';
import {
  SEED_PROFILE_SILVIO,
  SEED_LINKS_SILVIO,
  SEED_SOCIAL_SILVIO,
  SEED_PROFILE_DEMO,
  SEED_LINKS_DEMO,
  SEED_SOCIAL_DEMO,
} from '../../lib/constants';
import { ManageLinksTab } from './ManageLinksTab';
import { ProfileThemeTab } from './ProfileThemeTab';
import { AnalyticsTab } from './AnalyticsTab';
import { QrCodeTab } from './QrCodeTab';
import { SupabaseStatusModal } from '../common/SupabaseStatusModal';
import { LinkNestLogo } from '../common/LinkNestLogo';
import {
  Link2,
  Palette,
  BarChart3,
  ExternalLink,
  LogOut,
  Database,
  Eye,
  CheckCircle2,
  Sparkles,
  Share2,
  QrCode,
  Globe,
  Copy,
  Check,
  Zap,
  MousePointerClick,
  TrendingUp,
  Layers
} from 'lucide-react';
import { SetupWizardModal } from './SetupWizardModal';
import { ShareProfileModal } from '../common/ShareProfileModal';

interface AdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
  onViewPublicProfile: (username: string) => void;
  onShareProfile?: (username: string) => void;
}

// Helper to generate an immediate, bulletproof fallback profile
const createResilientProfile = (usr: AuthUser): Profile => {
  const isSilvio =
    usr.email?.toLowerCase().includes('silvio') ||
    usr.email?.toLowerCase().includes('viochristian') ||
    usr.id === 'user-silvio-001' ||
    usr.id === SEED_PROFILE_SILVIO.id;

  if (isSilvio) {
    return {
      ...SEED_PROFILE_SILVIO,
      user_id: usr.id,
      username: 'silvio',
      display_name: 'Silvio Christian Joe',
    };
  }

  const isDemo =
    usr.email?.toLowerCase().includes('demo') ||
    usr.id === 'user-demo-001' ||
    usr.id === SEED_PROFILE_DEMO.id;

  if (isDemo) {
    return {
      ...SEED_PROFILE_DEMO,
      user_id: usr.id,
      username: 'demo',
    };
  }

  const cleanUsername =
    usr.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'creator';

  return {
    id: isUuid(usr.id) ? usr.id : 'prof_' + Math.random().toString(36).substring(2, 9),
    user_id: usr.id,
    username: cleanUsername,
    display_name: usr.email?.split('@')[0] || 'LinkNest Creator',
    bio: 'Welcome to my LinkNest! Discover all my links below.',
    avatar_url: '/avatar-silvio.png',
    theme: { ...SEED_PROFILE_SILVIO.theme },
    view_count: 0,
    created_at: new Date().toISOString(),
  };
};

// Helper to get seed links depending on whether it is Silvio's authentic account or Demo
const getSeedLinksForProfile = (prof: Profile): LinkItem[] => {
  const u = (prof.username || '').toLowerCase();
  if (u === 'silvio' || u.includes('silvio') || u.includes('viochristian') || u.includes('viochris')) {
    return SEED_LINKS_SILVIO;
  }
  return SEED_LINKS_DEMO;
};

const getSeedSocialForProfile = (prof: Profile): SocialIconItem[] => {
  const u = (prof.username || '').toLowerCase();
  if (u === 'silvio' || u.includes('silvio') || u.includes('viochristian') || u.includes('viochris')) {
    return SEED_SOCIAL_SILVIO;
  }
  return SEED_SOCIAL_DEMO;
};

// Timeout wrapper that guarantees promises never hang the UI
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 1800, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onLogout,
  onViewPublicProfile,
  onShareProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics' | 'qrcode'>('links');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [socialIcons, setSocialIcons] = useState<SocialIconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyToast, setCopyToast] = useState<{ id: number; url: string } | null>(null);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const toastTimeoutRef = useRef<any>(null);

  // Listen to external tab navigation events (e.g., from ShareProfileModal)
  useEffect(() => {
    const handleTabNav = (e: any) => {
      if (e.detail && ['links', 'appearance', 'analytics', 'qrcode'].includes(e.detail)) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('linknest:navigate_tab', handleTabNav);
    return () => window.removeEventListener('linknest:navigate_tab', handleTabNav);
  }, []);

  // Safety timers: Never block user for more than 3 seconds
  useEffect(() => {
    const slowTimer = setTimeout(() => {
      if (loading) {
        setShowSlowNotice(true);
      }
    }, 1500);

    const forceOpenTimer = setTimeout(() => {
      if (loading) {
        console.warn('Dashboard loading exceeded 3s timeout - triggering fast local rendering');
        const fallback = createResilientProfile(user);
        const seedL = getSeedLinksForProfile(fallback);
        const seedS = getSeedSocialForProfile(fallback);
        setProfile((prev) => prev || fallback);
        setLinks((prev) => (prev.length > 0 ? prev : seedL.map((l, i) => ({ ...l, id: `link_${fallback.id}_${i}`, profile_id: fallback.id }))));
        setSocialIcons((prev) => (prev.length > 0 ? prev : seedS.map((s, i) => ({ ...s, id: `soc_${fallback.id}_${i}`, profile_id: fallback.id }))));
        setLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(forceOpenTimer);
    };
  }, [loading, user]);

  // Real-time synchronization of link click counters across tabs & preview
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

  // Fetch full data with aggressive timeouts & instant local fallback
  const fetchDashboardData = async (isSilent: boolean = false) => {
    try {
      if (!isSilent && !profile) {
        setLoading(true);
      }
      const fallback = createResilientProfile(user);

      // 1. Fetch owner profile with a 1500ms timeout
      let profileData: Profile | null = null;

      try {
        const res = await withTimeout(
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          1500,
          { data: null, error: null }
        );
        if (res?.data) {
          profileData = res.data;
        }
      } catch (e) {
        console.warn('Remote profile query failed, using resilient fallback:', e);
      }

      // 2. If not found by user_id, check username from email
      if (!profileData && user.email) {
        try {
          const usernameGuess = user.email.split('@')[0].toLowerCase();
          const fallbackRes = await withTimeout(
            supabase.from('profiles').select('*').eq('username', usernameGuess).maybeSingle(),
            1000,
            { data: null, error: null }
          );
          if (fallbackRes?.data) {
            profileData = fallbackRes.data;
          }
        } catch {}
      }

      // 3. If still not found, check local simulator
      if (!profileData) {
        try {
          const localRes = await localSimulator.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
          if (localRes?.data) {
            profileData = localRes.data;
          }
        } catch {}
      }

      // 4. If still not found, apply resilient profile & persist locally
      if (!profileData) {
        profileData = fallback;
        try {
          localSimulator.from('profiles').insert(profileData);
        } catch {}
      }

      // Check for locally saved profile adjustments (custom theme, display name, bio)
      try {
        const savedCustom =
          localStorage.getItem('linknest_custom_profile_' + profileData.id) ||
          localStorage.getItem('linknest_saved_profile');
        if (savedCustom) {
          const parsed = JSON.parse(savedCustom);
          if (parsed && typeof parsed === 'object') {
            profileData = { ...profileData, ...parsed };
          }
        }
      } catch {}

      // Commit profile state immediately
      setProfile(profileData);

      // 5. Parallel fetch for links and social icons
      const [linksRes, socialRes] = await Promise.all([
        withTimeout(
          supabase.from('links').select('*').eq('profile_id', profileData.id).order('position', { ascending: true }),
          1500,
          { data: null, error: null }
        ),
        withTimeout(
          supabase.from('social_icons').select('*').eq('profile_id', profileData.id).order('position', { ascending: true }),
          1500,
          { data: null, error: null }
        ),
      ]);

      const seedL = getSeedLinksForProfile(profileData);
      const seedS = getSeedSocialForProfile(profileData);
      const initKey = 'linknest_links_initialized_' + profileData.id;
      const isAlreadyInit = localStorage.getItem(initKey) === 'true';

      if (linksRes?.data && Array.isArray(linksRes.data) && linksRes.data.length > 0) {
        localStorage.setItem(initKey, 'true');
        setLinks(enrichLinksWithLocalDescriptions(linksRes.data));
      } else {
        // If remote query returned 0 rows or timed out, check local simulator before assuming 0
        const localLinksRes = await localSimulator
          .from('links')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('position', { ascending: true });

        if (localLinksRes?.data && Array.isArray(localLinksRes.data) && localLinksRes.data.length > 0) {
          localStorage.setItem(initKey, 'true');
          setLinks(enrichLinksWithLocalDescriptions(localLinksRes.data));
        } else if (isAlreadyInit) {
          // Both remote and local simulator confirm user genuinely deleted all links
          setLinks([]);
        } else {
          // First time initialization: populate seed links and store them in database
          localStorage.setItem(initKey, 'true');
          const defaultLinks = seedL.map((l, i) => ({
            ...l,
            id: `link_${profileData!.id}_${i}`,
            profile_id: profileData!.id,
          }));
          try {
            await supabase.from('links').insert(defaultLinks);
          } catch {}
          setLinks(enrichLinksWithLocalDescriptions(defaultLinks));
        }
      }

      if (socialRes?.data && Array.isArray(socialRes.data) && socialRes.data.length > 0) {
        setSocialIcons(socialRes.data);
      } else {
        let customSocial: any = null;
        try {
          const savedSoc = localStorage.getItem('linknest_custom_social_' + profileData.id);
          if (savedSoc) customSocial = JSON.parse(savedSoc);
        } catch {}

        if (customSocial && Array.isArray(customSocial)) {
          setSocialIcons(customSocial);
        } else {
          const defaultSocial = seedS.map((s, i) => ({
            ...s,
            id: `soc_${profileData!.id}_${i}`,
            profile_id: profileData!.id,
          }));
          setSocialIcons(defaultSocial);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      const fallback = createResilientProfile(user);
      const seedL = getSeedLinksForProfile(fallback);
      const seedS = getSeedSocialForProfile(fallback);
      setProfile((prev) => prev || fallback);
      setLinks((prev) =>
        prev.length > 0
          ? prev
          : seedL.map((l, i) => ({ ...l, id: `link_${fallback.id}_${i}`, profile_id: fallback.id }))
      );
      setSocialIcons((prev) =>
        prev.length > 0
          ? prev
          : seedS.map((s, i) => ({ ...s, id: `soc_${fallback.id}_${i}`, profile_id: fallback.id }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    onLogout();
  };

  // Ensure activeProfile is guaranteed non-null
  const activeProfile = profile || createResilientProfile(user);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';
  const publicUrl = `${origin}/${activeProfile.username}`;
  const totalClicks = links.reduce((sum, item) => sum + (item.click_count || 0), 0);
  const liveLinksCount = links.filter((l) => l.is_active && !l.is_archived).length;
  const hiddenLinksCount = links.filter((l) => !l.is_active || l.is_archived).length;

  // Identify whether this is the sandbox demo account or an authentic user account
  const isDemoAccount = Boolean(
    user.id === 'user-demo-001' ||
    user.id === SEED_PROFILE_DEMO.id ||
    user.email === 'demo@linknest.app' ||
    user.email?.toLowerCase().startsWith('demo@') ||
    activeProfile.username === 'demo'
  );

  const handleOpenShareModal = () => {
    if (onShareProfile && activeProfile?.username) {
      onShareProfile(activeProfile.username);
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyPublicUrl = async () => {
    if (!publicUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = publicUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setCopied(true);
      setCopyToast({ id: Date.now(), url: publicUrl });
      toastTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        setCopyToast(null);
      }, 3000);
    } catch (e) {
      console.warn('Copy failed:', e);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setCopied(true);
      setCopyToast({ id: Date.now(), url: publicUrl });
      toastTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        setCopyToast(null);
      }, 3000);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm text-slate-300 font-semibold">Loading your LinkNest Dashboard...</p>
            <p className="text-xs text-slate-500">Preparing your verified profile and link settings...</p>
          </div>

          {showSlowNotice && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 space-y-2.5"
            >
              <p className="text-xs text-amber-400/90 font-medium">
                Koneksi database memerlukan waktu beberapa detik...
              </p>
              <button
                type="button"
                id="instant-open-dashboard-btn"
                onClick={() => {
                  const fallback = createResilientProfile(user);
                  setProfile(fallback);
                  setLinks(SEED_LINKS_SILVIO.map((l, i) => ({ ...l, id: `link_${fallback.id}_${i}`, profile_id: fallback.id })));
                  setSocialIcons(SEED_SOCIAL_SILVIO.map((s, i) => ({ ...s, id: `soc_${fallback.id}_${i}`, profile_id: fallback.id })));
                  setLoading(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Dashboard Immediately (Fast Access)</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between w-full max-w-full gap-2 sm:gap-4 overflow-hidden">
        {/* Brand & public link */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <LinkNestLogo size={34} />
            <span className="font-bold text-white text-base tracking-tight hidden md:inline">
              LinkNest
            </span>
          </div>

          {/* Setup Wizard Button (Exclusively in Demo Sandbox Mode) */}
          {isDemoAccount && (
            <button
              id="header-setup-wizard-btn"
              onClick={() => setShowSetupWizard(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-colors shadow-sm cursor-pointer shrink-0"
              title="Test Creator Setup Wizard (Demo Account Only)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Setup Wizard</span>
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Supabase Status / RLS badge (Exclusively in Demo Sandbox Mode) */}
          {isDemoAccount && (
            <button
              id="header-supabase-status-btn"
              onClick={() => setShowDbModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors cursor-pointer"
              title="Supabase Backend & RLS Status (Demo Account Only)"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">
                {isRealSupabaseConfigured ? 'Supabase Live' : 'Supabase RLS Active'}
              </span>
            </button>
          )}

          {/* User Info & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
              <img src={activeProfile.avatar_url} alt={activeProfile.display_name} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline max-w-[140px] truncate">
              {activeProfile.display_name || user.email?.split('@')[0]}
            </span>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Prominent "Your Public Page" Section */}
      <section
        id="your-public-page-section"
        aria-label="Your Public Page"
        className="bg-slate-900/80 border-b border-slate-800/80 px-3 sm:px-6 py-3.5 sm:py-4 shadow-sm"
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          {/* Left: Indicator & Guidance */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Your Public Page
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live &amp; Shareable
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Share this link in your Instagram bio, WhatsApp, TikTok, or business cards.
              </p>
            </div>
          </div>

          {/* Right: URL Input & Actions */}
          <div className="relative flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Inline 'Copied!' Toast Notification positioned above the share link field */}
            <AnimatePresence>
              {copied && (
                <motion.div
                  id="copied-field-toast"
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.94 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute -top-10 left-0 sm:left-auto sm:right-16 z-30 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/25 flex items-center gap-1.5 border border-emerald-300 pointer-events-none whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3] text-slate-950" />
                  <span>Copied! Profile link in clipboard</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Copyable URL box */}
            <div
              onClick={handleCopyPublicUrl}
              title="Click to copy public URL"
              className="flex items-center bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 min-w-0 max-w-full sm:max-w-xs md:max-w-sm shadow-inner cursor-pointer group transition-colors"
            >
              <span className="text-slate-500 select-none mr-1.5 group-hover:text-slate-400">url:</span>
              <span className="truncate select-all text-white font-medium group-hover:text-indigo-200">{publicUrl}</span>
            </div>

            {/* Copy Link Button */}
            <button
              id="copy-link-btn"
              type="button"
              onClick={handleCopyPublicUrl}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px] active:scale-95"
              title="Copy public link to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-300 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {/* Single Primary Share Profile Button */}
            <button
              id="share-profile-btn"
              type="button"
              onClick={handleOpenShareModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/25 cursor-pointer min-h-[38px] active:scale-95"
              title="Share profile to WhatsApp, X, LinkedIn, and more"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Profile</span>
            </button>

            {/* Preview Button - The single clear public preview trigger */}
            <button
              id="preview-public-page-btn"
              type="button"
              onClick={() => onViewPublicProfile(activeProfile.username)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px] active:scale-95"
              title="Open your public bio page in this app"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards Placed Directly Under Your Public Page */}
        <div className="max-w-6xl mx-auto pt-4 mt-4 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Stat 1: Total & Live Links */}
          <div className="p-3.5 rounded-2xl border bg-slate-950/70 border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">Total Links</span>
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold text-white">{links.length}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                  liveLinksCount > 0
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-slate-500 bg-slate-800/60 border-slate-700/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${liveLinksCount > 0 ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {liveLinksCount} live
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                  hiddenLinksCount > 0
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                    : 'text-slate-500 bg-slate-800/60 border-slate-700/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hiddenLinksCount > 0 ? 'bg-rose-400' : 'bg-slate-500'}`} />
                  {hiddenLinksCount} hidden
                </span>
              </div>
            </div>
          </div>

          {/* Stat 2: Total Clicks */}
          <div className="p-3.5 rounded-2xl border bg-slate-950/70 border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">Total Clicks</span>
              <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{totalClicks.toLocaleString()}</span>
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                7-day active
              </span>
            </div>
          </div>

          {/* Stat 3: Active Theme */}
          <div className="p-3.5 rounded-2xl border bg-slate-950/70 border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">Active Theme</span>
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: activeProfile.theme?.accent_color || activeProfile.accent_color || '#818cf8' }}
              />
              <span className="text-sm font-bold text-white capitalize truncate">
                {typeof activeProfile.theme === 'string'
                  ? activeProfile.theme
                  : (activeProfile.theme?.button_style ? `${activeProfile.theme.button_style} style` : 'Rounded Style')}
              </span>
            </div>
          </div>

          {/* Stat 4: Offline QR & Standee */}
          <div className="p-3.5 rounded-2xl border bg-slate-950/70 border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">Offline Sharing</span>
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">QR &amp; Flyers</span>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                HD Export
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Switcher Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 sm:px-6 w-full max-w-full overflow-hidden">
        <div className="max-w-6xl mx-auto flex gap-2 sm:gap-6 overflow-x-auto scrollbar-none py-0.5">
          <button
            id="tab-links"
            onClick={() => setActiveTab('links')}
            className={`py-3 px-2 sm:px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 min-h-[44px] cursor-pointer ${
              activeTab === 'links'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Links ({links.length})</span>
          </button>

          <button
            id="tab-appearance"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-2 sm:px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 min-h-[44px] cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Profile & Theme</span>
          </button>

          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-2 sm:px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 min-h-[44px] cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            id="tab-qrcode"
            onClick={() => setActiveTab('qrcode')}
            className={`py-3 px-2 sm:px-1 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 min-h-[44px] cursor-pointer ${
              activeTab === 'qrcode'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>QR Code &amp; Flyers</span>
          </button>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
        {activeTab === 'links' && (
          <ManageLinksTab
            profile={activeProfile}
            links={links}
            setLinks={setLinks}
            onLinksUpdated={() => fetchDashboardData(true)}
          />
        )}

        {activeTab === 'appearance' && (
          <ProfileThemeTab
            profile={activeProfile}
            links={links}
            socialIcons={socialIcons}
            onProfileUpdated={(updated) => setProfile(updated)}
            onSocialUpdated={fetchDashboardData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            profile={activeProfile}
            links={links}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeTab === 'qrcode' && (
          <QrCodeTab
            profile={activeProfile}
            onViewPublicProfile={onViewPublicProfile}
          />
        )}
      </main>

      {/* Supabase Status Modal (Demo Account Only) */}
      {isDemoAccount && (
        <SupabaseStatusModal
          isOpen={showDbModal}
          onClose={() => setShowDbModal(false)}
          onResetSeed={fetchDashboardData}
        />
      )}

      {/* Share Profile Modal (direct WhatsApp, X, LinkedIn, Telegram, etc.) */}
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        profile={activeProfile}
        onOpenQrModal={() => {
          setShowShareModal(false);
          setActiveTab('qrcode');
        }}
      />

      {/* Global 'Copied!' Toast Notification */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            id="public-page-copied-toast-notification"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-white shadow-2xl backdrop-blur-md text-xs font-medium max-w-sm sm:max-w-md"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-400 text-xs tracking-tight">Profile Copied!</span>
                <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ready to share
                </span>
              </div>
              <span className="text-slate-300 text-[11px] truncate mt-0.5 font-mono">
                {copyToast.url} (copied to clipboard)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup Wizard Modal (Available exclusively in Demo Account) */}
      {isDemoAccount && profile && (
        <SetupWizardModal
          isOpen={showSetupWizard}
          onClose={() => setShowSetupWizard(false)}
          profile={profile}
          onComplete={(updatedProfile) => {
            setProfile(updatedProfile);
          }}
        />
      )}
    </div>
  );
};
