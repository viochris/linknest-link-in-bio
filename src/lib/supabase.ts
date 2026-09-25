import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, LinkItem, SocialIconItem, AuthUser, AuthSession, LinkClickEvent } from '../types';
import {
  SEED_PROFILE_SILVIO,
  SEED_LINKS_SILVIO,
  SEED_SOCIAL_SILVIO,
  SEED_PROFILE_DEMO,
  SEED_LINKS_DEMO,
  SEED_SOCIAL_DEMO,
} from './constants';

export const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isRealSupabaseConfigured = Boolean(
  envUrl &&
  envKey &&
  envUrl.startsWith('http') &&
  !envUrl.includes('YOUR_') &&
  envKey.length > 20
);

// Real client if configured
export let realClient: SupabaseClient | null = null;
if (isRealSupabaseConfigured && envUrl && envKey) {
  try {
    realClient = createClient(envUrl, envKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize real Supabase client, falling back to local simulator:', err);
  }
}

// Track whether remote tables exist in schema cache (PGRST205 detection)
let remoteTablesReady: boolean | null = isRealSupabaseConfigured ? true : false;

export interface SupabaseDiagnosticResult {
  envUrl: string;
  envKeyPreview: string;
  isEnvUrlLoaded: boolean;
  isEnvKeyLoaded: boolean;
  isConfigured: boolean;
  canConnectToEndpoint: boolean;
  tablesExist: boolean;
  errorDetails?: {
    code?: string;
    message: string;
  } | null;
  activeBackend: 'remote_supabase' | 'local_simulator';
}

export async function runSupabaseDiagnostics(): Promise<SupabaseDiagnosticResult> {
  const url = envUrl || '';
  const key = envKey || '';
  const isEnvUrlLoaded = Boolean(url && url.startsWith('http') && !url.includes('YOUR_'));
  const isEnvKeyLoaded = Boolean(key && key.length > 20 && !key.includes('YOUR_'));
  const keyPreview = isEnvKeyLoaded ? `${key.substring(0, 10)}...${key.substring(key.length - 4)}` : 'Not loaded';

  if (!isRealSupabaseConfigured || !realClient) {
    remoteTablesReady = false;
    return {
      envUrl: url || 'Not set',
      envKeyPreview: keyPreview,
      isEnvUrlLoaded,
      isEnvKeyLoaded,
      isConfigured: false,
      canConnectToEndpoint: false,
      tablesExist: false,
      errorDetails: {
        message: 'Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not fully configured.',
      },
      activeBackend: 'local_simulator',
    };
  }

  try {
    // 1. Probe the remote Supabase profiles table
    const { error } = await realClient.from('profiles').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        remoteTablesReady = false;
        return {
          envUrl: url,
          envKeyPreview: keyPreview,
          isEnvUrlLoaded: true,
          isEnvKeyLoaded: true,
          isConfigured: true,
          canConnectToEndpoint: true,
          tablesExist: false,
          errorDetails: {
            code: error.code || 'PGRST205',
            message: "Table 'public.profiles' not found in schema cache. Run the SQL schema migration in your Supabase SQL Editor.",
          },
          activeBackend: 'local_simulator',
        };
      }

      remoteTablesReady = false;
      return {
        envUrl: url,
        envKeyPreview: keyPreview,
        isEnvUrlLoaded: true,
        isEnvKeyLoaded: true,
        isConfigured: true,
        canConnectToEndpoint: false,
        tablesExist: false,
        errorDetails: {
          code: error.code,
          message: error.message,
        },
        activeBackend: 'local_simulator',
      };
    }

    // Tables exist and are queryable!
    remoteTablesReady = true;
    return {
      envUrl: url,
      envKeyPreview: keyPreview,
      isEnvUrlLoaded: true,
      isEnvKeyLoaded: true,
      isConfigured: true,
      canConnectToEndpoint: true,
      tablesExist: true,
      errorDetails: null,
      activeBackend: 'remote_supabase',
    };
  } catch (err: any) {
    remoteTablesReady = false;
    return {
      envUrl: url,
      envKeyPreview: keyPreview,
      isEnvUrlLoaded: true,
      isEnvKeyLoaded: true,
      isConfigured: true,
      canConnectToEndpoint: false,
      tablesExist: false,
      errorDetails: {
        message: err.message || 'Failed to connect to Supabase endpoint.',
      },
      activeBackend: 'local_simulator',
    };
  }
}

// Trigger initial background check
if (realClient) {
  runSupabaseDiagnostics().catch(() => {});
}

// ---------------------------------------------------------------------------
// Local Database Simulator (localStorage backed, enforcing PRD RLS & RPC)
// ---------------------------------------------------------------------------
const DB_STORAGE_KEY = 'linknest_supabase_db_v12';
const AUTH_STORAGE_KEY = 'linknest_supabase_auth_v1';

interface LocalDatabaseState {
  profiles: Profile[];
  links: LinkItem[];
  social_icons: SocialIconItem[];
  link_clicks: LinkClickEvent[];
  users: { id: string; email: string; passwordHash: string }[];
}

function generateHistoricalClicks(profileId: string, links: LinkItem[]): LinkClickEvent[] {
  const events: LinkClickEvent[] = [];
  const now = Date.now();
  // 14-day realistic trend of link clicks
  const dailyDistribution = [14, 18, 22, 25, 20, 28, 32, 35, 41, 38, 46, 52, 49, 63];
  
  dailyDistribution.forEach((count, dayIdx) => {
    const daysAgo = 13 - dayIdx;
    const dayStart = now - daysAgo * 86400000;
    
    for (let i = 0; i < count; i++) {
      // Weight towards top featured links
      const linkIdx = i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : (i % links.length);
      const link = links[linkIdx] || links[0];
      const randomOffset = Math.floor(Math.random() * 86400000);
      const clickedTime = new Date(dayStart + randomOffset).toISOString();
      
      events.push({
        id: `click-seed-${daysAgo}-${i}`,
        link_id: link.id,
        profile_id: profileId,
        clicked_at: clickedTime,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        referrer: i % 4 === 0 ? 'https://x.com/' : i % 4 === 1 ? 'https://linkedin.com/' : i % 4 === 2 ? 'https://github.com/' : 'https://linknest.app',
      });
    }
  });

  return events;
}

function getInitialDbState(): LocalDatabaseState {
  try {
    // Clear stale caches and un-scoped legacy profile key
    for (let i = 1; i <= 11; i++) {
      localStorage.removeItem(`linknest_supabase_db_v${i}`);
    }
    localStorage.removeItem('linknest_saved_profile');

    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.profiles && parsed.links && parsed.social_icons) {
        // Ensure every link has a valid category & description without overwriting user custom edits
        parsed.links = parsed.links.map((l: LinkItem) => {
          // Strictly isolate Silvio's specific URLs to Silvio's profile
          if (l.profile_id === SEED_PROFILE_SILVIO.id) {
            const matchingSeed = SEED_LINKS_SILVIO.find(s => s.id === l.id);
            const category = l.category || matchingSeed?.category || 'General';
            const description = l.description !== undefined ? l.description : (matchingSeed?.description || null);

            let fixedUrl = l.url;
            if (fixedUrl === 'https://github.com' || (l.icon === 'github' && fixedUrl.endsWith('github.com'))) {
              fixedUrl = 'https://github.com/viochris';
            } else if (fixedUrl === 'https://linkedin.com' || (l.icon === 'linkedin' && fixedUrl.endsWith('linkedin.com'))) {
              fixedUrl = 'https://www.linkedin.com/in/silvio-christian-joe';
            } else if (fixedUrl === 'https://instagram.com' || (l.icon === 'instagram' && fixedUrl.endsWith('instagram.com'))) {
              fixedUrl = 'https://www.instagram.com/silvio.codes';
            }

            return {
              ...l,
              url: fixedUrl,
              category,
              description,
              is_active: l.is_active !== undefined ? l.is_active : true,
              is_featured: l.is_featured !== undefined ? l.is_featured : false,
            };
          }
          return l;
        });

        // Also upgrade social icons strictly for Silvio's profile
        if (parsed.social_icons) {
          parsed.social_icons = parsed.social_icons.map((s: SocialIconItem) => {
            if (s.profile_id === SEED_PROFILE_SILVIO.id) {
              let fixedUrl = s.url;
              if (s.platform === 'github' && (fixedUrl === 'https://github.com' || !fixedUrl.includes('/viochris'))) {
                fixedUrl = 'https://github.com/viochris';
              } else if (s.platform === 'linkedin' && (fixedUrl === 'https://linkedin.com' || !fixedUrl.includes('/silvio-christian-joe'))) {
                fixedUrl = 'https://www.linkedin.com/in/silvio-christian-joe';
              } else if (s.platform === 'instagram' && (fixedUrl === 'https://instagram.com' || !fixedUrl.includes('/silvio.codes'))) {
                fixedUrl = 'https://www.instagram.com/silvio.codes';
              }
              return { ...s, url: fixedUrl };
            }
            return s;
          });
        }

        // Silvio Christian's primary accounts: viochristian12@gmail.com and silvio@linknest.app
        const isSilvioEmail = (em?: string) => {
          if (!em) return false;
          const clean = em.toLowerCase().trim();
          return clean === 'viochristian12@gmail.com' || clean === 'silvio@linknest.app';
        };

        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map((u: any) => {
            if (u.email && !isSilvioEmail(u.email) && u.id === SEED_PROFILE_SILVIO.user_id) {
              const cleanUname = u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
              return { ...u, id: 'usr_' + cleanUname };
            }
            if (u.email && isSilvioEmail(u.email)) {
              return { ...u, id: SEED_PROFILE_SILVIO.user_id };
            }
            return u;
          });

          // Ensure viochristian12@gmail.com is present in users with Silvio's user ID
          if (!parsed.users.some((u: any) => u.email?.toLowerCase() === 'viochristian12@gmail.com')) {
            parsed.users.push({
              id: SEED_PROFILE_SILVIO.user_id,
              email: 'viochristian12@gmail.com',
              passwordHash: 'demo123',
            });
          }
        }

        // Ensure Silvio's profile is present and mapped to SEED_PROFILE_SILVIO
        if (parsed.profiles && Array.isArray(parsed.profiles)) {
          const silvioIdx = parsed.profiles.findIndex((p: any) => p.username?.toLowerCase() === 'silvio' || p.id === SEED_PROFILE_SILVIO.id);
          if (silvioIdx >= 0) {
            parsed.profiles[silvioIdx] = { ...SEED_PROFILE_SILVIO, ...parsed.profiles[silvioIdx], user_id: SEED_PROFILE_SILVIO.user_id };
          } else {
            parsed.profiles.push(SEED_PROFILE_SILVIO);
          }
        }

        if (parsed.users && Array.isArray(parsed.users) && parsed.profiles && Array.isArray(parsed.profiles)) {
          for (const u of parsed.users) {
            if (u.id === SEED_PROFILE_SILVIO.user_id || u.id === SEED_PROFILE_DEMO.user_id) continue;
            let existingProf = parsed.profiles.find((p: any) => p.user_id === u.id);
            if (!existingProf) {
              const uname = u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'creator';
              const newProf: Profile = {
                id: 'prof_' + u.id,
                user_id: u.id,
                username: uname,
                display_name: u.email.split('@')[0],
                bio: 'Welcome to my LinkNest! 🌟',
                avatar_url: '/icon.svg',
                theme: { ...SEED_PROFILE_DEMO.theme },
                view_count: 0,
                created_at: new Date().toISOString(),
              };
              parsed.profiles.push(newProf);
            }
          }
        }

        // Ensure link_clicks array is initialized
        if (!parsed.link_clicks || !Array.isArray(parsed.link_clicks) || parsed.link_clicks.length === 0) {
          parsed.link_clicks = generateHistoricalClicks(
            parsed.profiles[0]?.id || SEED_PROFILE_SILVIO.id,
            parsed.links
          );
        }

        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading local db:', e);
  }

  const initialLinks = [...SEED_LINKS_SILVIO, ...SEED_LINKS_DEMO];
  const initialClicks = generateHistoricalClicks(SEED_PROFILE_SILVIO.id, SEED_LINKS_SILVIO);

  const initial: LocalDatabaseState = {
    profiles: [SEED_PROFILE_SILVIO, SEED_PROFILE_DEMO],
    links: initialLinks,
    social_icons: [...SEED_SOCIAL_SILVIO, ...SEED_SOCIAL_DEMO],
    link_clicks: initialClicks,
    users: [
      {
        id: SEED_PROFILE_SILVIO.user_id,
        email: 'viochristian12@gmail.com',
        passwordHash: 'demo123',
      },
      {
        id: SEED_PROFILE_SILVIO.user_id,
        email: 'silvio@linknest.app',
        passwordHash: 'demo123',
      },
      {
        id: SEED_PROFILE_DEMO.user_id,
        email: 'demo@linknest.app',
        passwordHash: 'demo123',
      },
      {
        id: SEED_PROFILE_DEMO.user_id,
        email: 'demo@example.com',
        passwordHash: 'demo123',
      },
    ],
  };
  saveDbState(initial);
  return initial;
}

function saveDbState(state: LocalDatabaseState) {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed saving local db:', e);
  }
}

export function resetTrialData(targetUsername?: string) {
  try {
    const isSilvio = targetUsername === 'silvio';
    const isDemo = targetUsername === 'demo' || !targetUsername;

    const freshLinks = [
      ...(isSilvio || !targetUsername ? SEED_LINKS_SILVIO : localSimulator.db.links.filter(l => l.profile_id === SEED_PROFILE_SILVIO.id)),
      ...(isDemo || !targetUsername ? SEED_LINKS_DEMO : localSimulator.db.links.filter(l => l.profile_id === SEED_PROFILE_DEMO.id)),
    ];

    const freshProfiles = [
      isSilvio || !targetUsername ? SEED_PROFILE_SILVIO : (localSimulator.db.profiles.find(p => p.id === SEED_PROFILE_SILVIO.id) || SEED_PROFILE_SILVIO),
      isDemo || !targetUsername ? SEED_PROFILE_DEMO : (localSimulator.db.profiles.find(p => p.id === SEED_PROFILE_DEMO.id) || SEED_PROFILE_DEMO),
    ];

    const freshSocial = [
      ...(isSilvio || !targetUsername ? SEED_SOCIAL_SILVIO : localSimulator.db.social_icons.filter(s => s.profile_id === SEED_PROFILE_SILVIO.id)),
      ...(isDemo || !targetUsername ? SEED_SOCIAL_DEMO : localSimulator.db.social_icons.filter(s => s.profile_id === SEED_PROFILE_DEMO.id)),
    ];

    const freshClicks = generateHistoricalClicks(
      isSilvio ? SEED_PROFILE_SILVIO.id : SEED_PROFILE_DEMO.id,
      isSilvio ? SEED_LINKS_SILVIO : SEED_LINKS_DEMO
    );

    localSimulator.db.profiles = freshProfiles;
    localSimulator.db.links = freshLinks;
    localSimulator.db.social_icons = freshSocial;
    localSimulator.db.link_clicks = freshClicks;

    saveDbState(localSimulator.db);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('linknest:db_reset'));
    }
    return true;
  } catch (err) {
    console.error('Error resetting trial data:', err);
    return false;
  }
}

class LocalSupabaseSimulator {
  public db: LocalDatabaseState = getInitialDbState();
  private authListeners: ((event: string, session: AuthSession | null) => void)[] = [];
  private currentSession: AuthSession | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        const isSilvioAccount = (em?: string) => {
          if (!em) return false;
          const clean = em.toLowerCase().trim();
          return clean === 'viochristian12@gmail.com' || clean === 'silvio@linknest.app';
        };

        if (
          session?.user &&
          !isSilvioAccount(session.user.email) &&
          session.user.id === SEED_PROFILE_SILVIO.user_id
        ) {
          const cleanUname = session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
          session.user.id = 'usr_' + cleanUname;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        } else if (
          session?.user &&
          isSilvioAccount(session.user.email) &&
          session.user.id !== SEED_PROFILE_SILVIO.user_id
        ) {
          session.user.id = SEED_PROFILE_SILVIO.user_id;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        }
        this.currentSession = session;
      }
    } catch {
      this.currentSession = null;
    }
  }

  private setSession(session: AuthSession | null) {
    this.currentSession = session;
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.notifyAuth(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
  }

  public getCurrentSession(): AuthSession | null {
    this.restoreSession();
    return this.currentSession;
  }

  private notifyAuth(event: string, session: AuthSession | null) {
    this.authListeners.forEach(listener => listener(event, session));
  }

  public auth = {
    getSession: async (): Promise<{ data: { session: AuthSession | null }; error: null }> => {
      return { data: { session: this.currentSession }, error: null };
    },
    getUser: async (): Promise<{ data: { user: AuthUser | null }; error: null }> => {
      return { data: { user: this.currentSession?.user || null }, error: null };
    },
    onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) => {
      this.authListeners.push(callback);
      // Fire initial state
      callback('INITIAL', this.currentSession);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authListeners = this.authListeners.filter(l => l !== callback);
            },
          },
        },
      };
    },
    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      return this.signInWithPassword({ email, password });
    },
    signUp: async (args: {
      email: string;
      password?: string;
      options?: { data?: { username?: string; display_name?: string } };
    }) => {
      return this.signUp(args);
    },
    signOut: async () => {
      return this.signOut();
    },
    resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
      return this.resetPasswordForEmail(email, options);
    },
    updatePasswordDirectly: async (email: string, newPassword: string) => {
      return this.updatePasswordDirectly(email, newPassword);
    },
    deleteAccount: async (userId: string, profileId?: string) => {
      return this.deleteAccount(userId, profileId);
    },
  };

  public async getSession(): Promise<{ data: { session: AuthSession | null } }> {
    return { data: { session: this.currentSession } };
  }

  public onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    return this.auth.onAuthStateChange(callback);
  }

  public async signInWithPassword({ email, password }: { email: string; password?: string }) {
    this.db = getInitialDbState();
    const cleanEmail = email.toLowerCase().trim();
    let user = this.db.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Must NOT auto-register on login. Return clear error if account is not found.
      return {
        data: { session: null, user: null },
        error: { message: 'No account found with this email address. Please check your spelling or sign up.' },
      };
    }

    if (password && user.passwordHash && user.passwordHash !== password) {
      return {
        data: { session: null, user: null },
        error: { message: 'Incorrect password. Please try again.' },
      };
    }

    const isSilvio = cleanEmail === 'viochristian12@gmail.com' || cleanEmail === 'silvio@linknest.app';
    const isDemo = cleanEmail === 'demo@linknest.app' || cleanEmail === 'demo@example.com';

    if (user && isSilvio && user.id !== SEED_PROFILE_SILVIO.user_id) {
      user.id = SEED_PROFILE_SILVIO.user_id;
      saveDbState(this.db);
    }

    // Ensure user has their corresponding profile
    let profile = this.db.profiles.find(p => p.user_id === user!.id && (isSilvio ? (p.username === 'silvio' || p.id === SEED_PROFILE_SILVIO.id) : p.username !== 'silvio'));
    if (!profile) {
      if (isSilvio) {
        profile = { ...SEED_PROFILE_SILVIO, user_id: user.id };
        this.db.profiles.push(profile);
      } else if (isDemo) {
        profile = { ...SEED_PROFILE_DEMO, user_id: user.id };
        this.db.profiles.push(profile);
      } else {
        const username = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'creator';
        profile = {
          id: 'prof_' + Math.random().toString(36).substring(2, 10),
          user_id: user.id,
          username,
          display_name: cleanEmail.split('@')[0] || 'LinkNest Creator',
          bio: 'Welcome to my LinkNest! Discover all my links below.',
          avatar_url: '/icon.svg',
          theme: { ...SEED_PROFILE_DEMO.theme },
          view_count: 0,
          created_at: new Date().toISOString(),
        };
        this.db.profiles.push(profile);
      }
      saveDbState(this.db);
    }

    const session: AuthSession = {
      user: { id: user.id, email: user.email },
      access_token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
    };
    this.setSession(session);
    return { data: { session, user: session.user }, error: null };
  }

  public async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password?: string;
    options?: { data?: { username?: string; display_name?: string } };
  }) {
    this.db = getInitialDbState();
    const cleanEmail = email.toLowerCase().trim();
    let existingUser = this.db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return {
        data: { session: null, user: null },
        error: { message: 'This email is already registered. Please log in using this account.' },
      };
    }

    const requestedUsername = (options?.data?.username || cleanEmail.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '');

    let finalUsername = requestedUsername || 'creator';
    // Check if username is already taken by another profile
    if (this.db.profiles.some(p => p.username.toLowerCase() === finalUsername.toLowerCase())) {
      return {
        data: { session: null, user: null },
        error: { message: `Username "@${finalUsername}" is already taken. Please choose another username.` },
      };
    }

    const newUserId = 'usr_' + Math.random().toString(36).substring(2, 10);
    const newProfileId = 'prof_' + Math.random().toString(36).substring(2, 10);

    const newUser = {
      id: newUserId,
      email: cleanEmail,
      passwordHash: password || 'demo123',
    };
    this.db.users.push(newUser);

    const newProfile: Profile = {
      id: newProfileId,
      user_id: newUserId,
      username: finalUsername,
      display_name: options?.data?.display_name || finalUsername,
      bio: 'Welcome to my LinkNest profile! 🌟',
      avatar_url: '/icon.svg',
      theme: {
        bg_type: 'preset',
        bg_value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
        button_style: 'rounded',
        button_bg: 'rgba(30, 41, 59, 0.85)',
        button_text: '#ffffff',
        accent_color: '#818cf8',
        font_family: 'Plus Jakarta Sans',
        show_view_count: false,
        show_discover_tab: true,
      },
      view_count: 0,
      created_at: new Date().toISOString(),
    };
    this.db.profiles.push(newProfile);

    // Initial starter link for the new user, strictly scoped to this profile
    this.db.links.push({
      id: `link_${newProfileId}_1`,
      profile_id: newProfileId,
      title: 'Official Website',
      url: 'https://linknest.app',
      icon: 'globe',
      category: 'General',
      description: 'Welcome to my official page',
      is_active: true,
      is_featured: false,
      position: 0,
      click_count: 0,
      start_date: null,
      end_date: null,
      last_clicked_at: null,
      created_at: new Date().toISOString(),
    });

    saveDbState(this.db);

    const session: AuthSession = {
      user: { id: newUserId, email: cleanEmail },
      access_token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
    };
    this.setSession(session);
    return { data: { session, user: session.user }, error: null };
  }

  public async signOut() {
    this.setSession(null);
    return { error: null };
  }

  public async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }) {
    this.db = getInitialDbState();
    const cleanEmail = email.toLowerCase().trim();
    if (!this.db.users) this.db.users = [];
    let user = this.db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      const isKnownEmail =
        cleanEmail === 'viochristian12@gmail.com' ||
        cleanEmail === 'silvio@linknest.app' ||
        cleanEmail === 'demo@linknest.app' ||
        cleanEmail === 'demo@example.com';
      if (isKnownEmail) {
        user = {
          id: cleanEmail.includes('demo')
            ? SEED_PROFILE_DEMO.user_id
            : (cleanEmail === 'viochristian12@gmail.com' || cleanEmail === 'silvio@linknest.app')
            ? SEED_PROFILE_SILVIO.user_id
            : 'usr_' + cleanEmail.split('@')[0].replace(/[^a-z0-9_-]/g, ''),
          email: cleanEmail,
          passwordHash: 'demo123',
        };
        this.db.users.push(user);
        saveDbState(this.db);
      }
    }
    if (!user) {
      return {
        data: null,
        error: { message: 'Account not found.' },
      };
    }
    return { data: {}, error: null };
  }

  public async updatePasswordDirectly(email: string, newPassword: string) {
    this.db = getInitialDbState();
    const cleanEmail = email.toLowerCase().trim();
    if (!this.db.users) this.db.users = [];
    let user = this.db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      const isKnownEmail =
        cleanEmail === 'viochristian12@gmail.com' ||
        cleanEmail === 'silvio@linknest.app' ||
        cleanEmail === 'demo@linknest.app' ||
        cleanEmail === 'demo@example.com';
      if (isKnownEmail) {
        user = {
          id: cleanEmail.includes('demo')
            ? SEED_PROFILE_DEMO.user_id
            : (cleanEmail === 'viochristian12@gmail.com' || cleanEmail === 'silvio@linknest.app')
            ? SEED_PROFILE_SILVIO.user_id
            : 'usr_' + cleanEmail.split('@')[0].replace(/[^a-z0-9_-]/g, ''),
          email: cleanEmail,
          passwordHash: newPassword,
        };
        this.db.users.push(user);
      } else {
        return { data: null, error: { message: 'Account not found.' } };
      }
    } else {
      user.passwordHash = newPassword;
    }
    saveDbState(this.db);
    return { data: { user }, error: null };
  }

  public async deleteAccount(userId: string, profileId?: string) {
    this.db = getInitialDbState();
    if (this.db.users) {
      this.db.users = this.db.users.filter(u => u.id !== userId);
    }

    const userProfiles = (this.db.profiles || []).filter(
      p => p.user_id === userId || (profileId && p.id === profileId)
    );
    const targetProfileIds = userProfiles.map(p => p.id);
    if (profileId && !targetProfileIds.includes(profileId)) {
      targetProfileIds.push(profileId);
    }

    if (this.db.profiles) {
      this.db.profiles = this.db.profiles.filter(
        p => p.user_id !== userId && !targetProfileIds.includes(p.id)
      );
    }
    if (this.db.links) {
      this.db.links = this.db.links.filter(l => !targetProfileIds.includes(l.profile_id));
    }
    if (this.db.social_icons) {
      this.db.social_icons = this.db.social_icons.filter(
        s => !targetProfileIds.includes(s.profile_id)
      );
    }
    if (this.db.link_clicks) {
      this.db.link_clicks = this.db.link_clicks.filter(
        c => !targetProfileIds.includes(c.profile_id)
      );
    }

    saveDbState(this.db);

    for (const pid of targetProfileIds) {
      try {
        localStorage.removeItem('linknest_custom_profile_' + pid);
        localStorage.removeItem('linknest_custom_social_' + pid);
        localStorage.removeItem('linknest_links_initialized_' + pid);
      } catch {}
    }

    this.setSession(null);
    return { error: null };
  }

  // RPC: increment_view_count
  public async rpc(funcName: string, args: Record<string, any>) {
    this.db = getInitialDbState();
    if (funcName === 'increment_view_count') {
      const profile = this.db.profiles.find(p => p.id === args.p_profile_id);
      if (profile) {
        profile.view_count = (profile.view_count || 0) + 1;
        saveDbState(this.db);
      }
      return { data: null, error: null };
    }
    if (funcName === 'increment_link_click') {
      const linkId = args.p_link_id || args.link_id;
      const link = this.db.links.find(l => l.id === linkId);
      if (link) {
        link.click_count = (link.click_count || 0) + 1;
        link.last_clicked_at = new Date().toISOString();
        if (!this.db.link_clicks) this.db.link_clicks = [];
        this.db.link_clicks.push({
          id: 'click_' + Math.random().toString(36).substring(2, 10),
          link_id: link.id,
          profile_id: link.profile_id,
          clicked_at: new Date().toISOString(),
        });
        saveDbState(this.db);
      }
      return { data: null, error: null };
    }
    return { data: null, error: { message: `Unknown RPC function: ${funcName}` } };
  }

  // Storage upload simulation (returns preview data URL or local url)
  public storage = {
    from: (bucket: string) => ({
      upload: async (filePath: string, file: File) => {
        return new Promise<{ data: { path: string } | null; error: any }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve({ data: { path: result }, error: null });
          };
          reader.onerror = () => {
            resolve({ data: null, error: { message: 'File read failed' } });
          };
          reader.readAsDataURL(file);
        });
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: path },
      }),
    }),
  };

  // Mock Query Builder for table queries
  public from(tableName: string) {
    this.db = getInitialDbState();
    const currentUserId = this.currentSession?.user?.id;

    return new MockQueryBuilder(this.db, tableName, currentUserId, (updatedDb) => {
      this.db = updatedDb;
      saveDbState(this.db);
    });
  }

  // Helper for UI testing: reset to seed
  public resetToDefaultSeed() {
    const initial: LocalDatabaseState = {
      profiles: [SEED_PROFILE_SILVIO],
      links: [...SEED_LINKS_SILVIO],
      social_icons: [...SEED_SOCIAL_SILVIO],
      link_clicks: [],
      users: [
        {
          id: SEED_PROFILE_SILVIO.user_id,
          email: 'silvio@linknest.app',
          passwordHash: 'demo123',
        },
      ],
    };
    saveDbState(initial);
    this.db = initial;
  }
}

class MockQueryBuilder {
  private db: LocalDatabaseState;
  private table: string;
  private currentUserId?: string;
  private onCommit: (db: LocalDatabaseState) => void;
  private filters: ((item: any) => boolean)[] = [];
  private orderField?: string;
  private orderAsc: boolean = true;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private operation: 'select' | 'delete' | 'update' | 'insert' | 'upsert' = 'select';
  private updatePayload: any = null;
  private insertPayload: any = null;
  private limitCount?: number;

  constructor(
    db: LocalDatabaseState,
    table: string,
    currentUserId: string | undefined,
    onCommit: (db: LocalDatabaseState) => void
  ) {
    this.db = db;
    this.table = table;
    this.currentUserId = currentUserId;
    this.onCommit = onCommit;
  }

  public select(columns = '*') {
    if (this.operation !== 'insert' && this.operation !== 'update' && this.operation !== 'upsert') {
      this.operation = 'select';
    }
    return this;
  }

  public insert(record: any | any[]) {
    this.operation = 'insert';
    this.insertPayload = record;
    return this;
  }

  public upsert(record: any | any[]) {
    this.operation = 'upsert';
    this.insertPayload = record;
    return this;
  }

  public update(updates: any) {
    this.operation = 'update';
    this.updatePayload = updates;
    return this;
  }

  public delete() {
    this.operation = 'delete';
    return this;
  }

  public eq(field: string, value: any) {
    this.filters.push((item) => {
      if (item[field] === undefined || item[field] === null) return value === null;
      if (typeof item[field] === 'string' && typeof value === 'string') {
        return item[field].toLowerCase() === value.toLowerCase();
      }
      return item[field] === value;
    });
    return this;
  }

  public neq(field: string, value: any) {
    this.filters.push((item) => {
      if (item[field] === undefined || item[field] === null) return value !== null;
      if (typeof item[field] === 'string' && typeof value === 'string') {
        return item[field].toLowerCase() !== value.toLowerCase();
      }
      return item[field] !== value;
    });
    return this;
  }

  public in(field: string, values: any[]) {
    this.filters.push((item) => {
      const itemVal = item[field];
      return values.some((v) => {
        if (typeof itemVal === 'string' && typeof v === 'string') {
          return itemVal.toLowerCase() === v.toLowerCase();
        }
        return itemVal === v;
      });
    });
    return this;
  }

  public gte(field: string, value: any) {
    this.filters.push((item) => item[field] >= value);
    return this;
  }

  public lte(field: string, value: any) {
    this.filters.push((item) => item[field] <= value);
    return this;
  }

  public order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = options?.ascending ?? true;
    return this;
  }

  public limit(count: number) {
    this.limitCount = count;
    return this;
  }

  public single() {
    this.isSingle = true;
    return this;
  }

  public maybeSingle() {
    this.isSingle = true;
    this.isMaybeSingle = true;
    return this;
  }

  private applyFilters(items: any[]): any[] {
    let result = items.filter((item) => this.filters.every((f) => f(item)));
    if (this.orderField) {
      const field = this.orderField;
      const asc = this.orderAsc;
      result.sort((a, b) => {
        const valA = a[field] ?? 0;
        const valB = b[field] ?? 0;
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
    }
    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }
    return result;
  }

  public executeDelete() {
    let affected = 0;
    if (this.filters.length === 0) {
      console.warn(`[LocalSimulator] Blocked delete on table '${this.table}' with 0 filters applied to prevent wiping table.`);
      return { data: null, error: { message: 'Delete requires at least one filter' }, count: 0 };
    }

    if (this.table === 'profiles') {
      const before = this.db.profiles.length;
      const toDelete = this.applyFilters(this.db.profiles);
      this.db.profiles = this.db.profiles.filter((p) => !toDelete.includes(p));
      affected = before - this.db.profiles.length;
    } else if (this.table === 'links') {
      const before = this.db.links.length;
      const toDelete = this.applyFilters(this.db.links);
      this.db.links = this.db.links.filter((l) => !toDelete.includes(l));
      affected = before - this.db.links.length;
    } else if (this.table === 'social_icons') {
      const before = this.db.social_icons.length;
      const toDelete = this.applyFilters(this.db.social_icons);
      this.db.social_icons = this.db.social_icons.filter((s) => !toDelete.includes(s));
      affected = before - this.db.social_icons.length;
    }

    this.onCommit(this.db);
    return { data: null, error: null, count: affected };
  }

  public executeUpdate() {
    let affected = 0;
    if (this.filters.length === 0) {
      console.warn(`[LocalSimulator] Blocked update on table '${this.table}' with 0 filters applied.`);
      return { data: null, error: { message: 'Update requires at least one filter' }, count: 0 };
    }

    const updatedItems: any[] = [];
    const updates = this.updatePayload || {};

    if (this.table === 'profiles') {
      const targets = this.applyFilters(this.db.profiles);
      for (const p of targets) {
        if (updates.username && updates.username.toLowerCase() !== p.username.toLowerCase()) {
          const exists = this.db.profiles.some(
            (other) => other.id !== p.id && other.username.toLowerCase() === updates.username.toLowerCase()
          );
          if (exists) {
            return { data: null, error: { message: `Username "@${updates.username}" is already taken.` } };
          }
        }
        Object.assign(p, updates);
        affected++;
        updatedItems.push(p);
      }
    } else if (this.table === 'links') {
      const targets = this.applyFilters(this.db.links);
      for (const l of targets) {
        Object.assign(l, updates);
        affected++;
        updatedItems.push(l);
      }
    } else if (this.table === 'social_icons') {
      const targets = this.applyFilters(this.db.social_icons);
      for (const s of targets) {
        Object.assign(s, updates);
        affected++;
        updatedItems.push(s);
      }
    }

    this.onCommit(this.db);
    const resultData = this.isSingle
      ? (updatedItems[0] || (this.isMaybeSingle ? null : { message: 'Row not found' }))
      : updatedItems;
    return { data: resultData, error: null, count: affected };
  }

  public executeInsert() {
    const rawItems = Array.isArray(this.insertPayload) ? this.insertPayload : [this.insertPayload];
    const insertedList: any[] = [];

    for (const record of rawItems) {
      const newItem = {
        ...record,
        id: record.id || `${this.table}_${Math.random().toString(36).substring(2, 10)}`,
        created_at: record.created_at || new Date().toISOString(),
      };

      if (this.table === 'profiles') {
        const existingIdx = this.db.profiles.findIndex(
          (p) => p.username.toLowerCase() === (newItem.username || '').toLowerCase() || p.id === newItem.id
        );
        if (existingIdx >= 0) {
          this.db.profiles[existingIdx] = { ...this.db.profiles[existingIdx], ...newItem };
          insertedList.push(this.db.profiles[existingIdx]);
        } else {
          this.db.profiles.push(newItem);
          insertedList.push(newItem);
        }
      } else if (this.table === 'links') {
        const existingIdx = this.db.links.findIndex((l) => l.id === newItem.id);
        if (existingIdx >= 0) {
          this.db.links[existingIdx] = { ...this.db.links[existingIdx], ...newItem };
          insertedList.push(this.db.links[existingIdx]);
        } else {
          this.db.links.push(newItem);
          insertedList.push(newItem);
        }
      } else if (this.table === 'social_icons') {
        const existingIdx = this.db.social_icons.findIndex((s) => s.id === newItem.id);
        if (existingIdx >= 0) {
          this.db.social_icons[existingIdx] = { ...this.db.social_icons[existingIdx], ...newItem };
          insertedList.push(this.db.social_icons[existingIdx]);
        } else {
          this.db.social_icons.push(newItem);
          insertedList.push(newItem);
        }
      } else if (this.table === 'link_clicks') {
        if (!this.db.link_clicks) this.db.link_clicks = [];
        this.db.link_clicks.push(newItem);
        insertedList.push(newItem);
      }
    }

    this.onCommit(this.db);
    const resultData = this.isSingle
      ? (insertedList[0] || null)
      : (Array.isArray(this.insertPayload) ? insertedList : insertedList[0]);
    return { data: resultData, error: null };
  }

  public executeSelect() {
    let sourceList: any[] = [];
    if (this.table === 'profiles') sourceList = this.db.profiles;
    else if (this.table === 'links') sourceList = this.db.links;
    else if (this.table === 'social_icons') sourceList = this.db.social_icons;
    else if (this.table === 'link_clicks') sourceList = this.db.link_clicks || [];

    const matched = this.applyFilters(sourceList);

    if (this.isMaybeSingle) {
      return { data: matched[0] || null, error: null };
    }
    if (this.isSingle) {
      return {
        data: matched[0] || null,
        error: matched[0] ? null : { message: 'Row not found', code: 'PGRST116' },
      };
    }
    return { data: matched, error: null };
  }

  public async then(resolve: (res: any) => void, reject?: (err: any) => void) {
    try {
      let res: any;
      if (this.operation === 'delete') {
        res = this.executeDelete();
      } else if (this.operation === 'update') {
        res = this.executeUpdate();
      } else if (this.operation === 'insert' || this.operation === 'upsert') {
        res = this.executeInsert();
      } else {
        res = this.executeSelect();
      }
      resolve(res);
      return res;
    } catch (err: any) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }
}

export const localSimulator = new LocalSupabaseSimulator();

export function isUuid(value: any): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Local persistence for link descriptions when the remote Supabase table schema
// does not have the 'description' column created yet (PGRST204 resilience)
export const LINK_DESCRIPTIONS_KEY = 'linknest_link_descriptions';

export function getLocalLinkDescriptions(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LINK_DESCRIPTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const LOCAL_CLICKS_KEY = 'linknest_recorded_clicks';

export function getLocalRecordedClicks(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_CLICKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordLinkClick(
  linkId: string,
  currentCount: number = 0,
  profileId?: string
): number {
  if (!linkId) return currentCount;
  try {
    const clicks = getLocalRecordedClicks();
    const existing = clicks[linkId] !== undefined ? clicks[linkId] : currentCount;
    const newCount = existing + 1;
    clicks[linkId] = newCount;
    localStorage.setItem(LOCAL_CLICKS_KEY, JSON.stringify(clicks));

    const effectiveProfileId =
      profileId ||
      localSimulator.db.links.find((l) => l.id === linkId)?.profile_id ||
      '';

    const nowIso = new Date().toISOString();
    const clickEvent: LinkClickEvent = {
      id: 'click_' + Math.random().toString(36).substring(2, 10),
      link_id: linkId,
      profile_id: effectiveProfileId,
      clicked_at: nowIso,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
    };

    // Update localSimulator state
    try {
      const linkInDb = localSimulator.db.links.find((l) => l.id === linkId);
      if (linkInDb) {
        linkInDb.click_count = newCount;
        linkInDb.last_clicked_at = nowIso;
      }
      if (!localSimulator.db.link_clicks) localSimulator.db.link_clicks = [];
      localSimulator.db.link_clicks.push(clickEvent);
      saveDbState(localSimulator.db);
    } catch {}

    // Dispatch global event and BroadcastChannel for instant UI responsiveness
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('linknest:click_tracked', {
          detail: { linkId, clickCount: newCount, clickEvent },
        })
      );
      try {
        const bc = new BroadcastChannel('linknest_clicks_channel');
        bc.postMessage({ linkId, clickCount: newCount, clickEvent });
        bc.close();
      } catch {}
    }

    // Background call to remote Supabase if available
    (async () => {
      try {
        if (realClient && isUuid(linkId)) {
          // 1. Increment link counter
          try {
            await realClient.rpc('increment_link_click', { link_id: linkId });
          } catch {
            await realClient
              .from('links')
              .update({ click_count: newCount, last_clicked_at: nowIso })
              .eq('id', linkId);
          }

          // 2. Insert detailed event log to link_clicks table
          if (effectiveProfileId && isUuid(effectiveProfileId)) {
            await realClient.from('link_clicks').insert({
              link_id: linkId,
              profile_id: effectiveProfileId,
              clicked_at: nowIso,
              user_agent: clickEvent.user_agent,
              referrer: clickEvent.referrer,
            });
          }
        }
      } catch (e) {
        console.warn('Remote click logging warning:', e);
      }
    })();

    return newCount;
  } catch {
    return currentCount + 1;
  }
}

export function saveLocalLinkDescription(linkId: string, description: string | null) {
  if (!linkId) return;
  try {
    const map = getLocalLinkDescriptions();
    if (description) {
      map[linkId] = description;
    } else {
      delete map[linkId];
    }
    localStorage.setItem(LINK_DESCRIPTIONS_KEY, JSON.stringify(map));
  } catch {}
}

export function enrichLinksWithLocalDescriptions<T extends { id?: string; description?: string | null; click_count?: number }>(links: T[]): T[] {
  if (!Array.isArray(links)) return links;
  const localMap = getLocalLinkDescriptions();
  const clickMap = getLocalRecordedClicks();
  return links.map(l => {
    if (!l?.id) return l;
    const enriched = { ...l };
    const localDesc = localMap[l.id];
    if ((enriched.description === undefined || enriched.description === null || enriched.description === '') && localDesc) {
      enriched.description = localDesc;
    }
    const trackedClicks = clickMap[l.id];
    if (trackedClicks !== undefined && trackedClicks > (enriched.click_count || 0)) {
      enriched.click_count = trackedClicks;
    }
    return enriched;
  });
}

// Unified resilient API that routes to real Supabase when schema tables exist,
// or gracefully falls back to the local database simulator when tables are missing
export const supabase = {
  get auth() {
    if (realClient) {
      return {
        ...realClient.auth,
        signInWithPassword: async (credentials: any) => {
          try {
            const res = await realClient!.auth.signInWithPassword(credentials);
            if (!res.error && res.data?.session) return res;

            // If Supabase returned an explicit error (like Email not confirmed), do not bypass if real account
            if (res.error?.message?.toLowerCase().includes('email not confirmed')) {
              return res;
            }

            // Fallback to local simulator for local accounts or offline testing
            const localRes = await localSimulator.auth.signInWithPassword(credentials);
            if (!localRes.error && localRes.data?.session) return localRes;

            // If real client had a network/fetch error or if local simulator returned a specific validation error, prefer localRes
            if (
              !res.error ||
              res.error.message?.toLowerCase().includes('failed to fetch') ||
              res.error.message?.toLowerCase().includes('networkerror') ||
              localRes?.error
            ) {
              return localRes;
            }

            return res;
          } catch {
            return localSimulator.auth.signInWithPassword(credentials);
          }
        },
        signUp: async (args: any) => {
          try {
            const res = await realClient!.auth.signUp(args);
            // If sign up succeeded on Supabase
            if (!res.error && res.data?.user) {
              // Return Supabase's result directly (whether session is active or requires email confirmation)
              return res;
            }
            if (res.error) {
              // If there was an error in Supabase (e.g. rate limit, schema), fall back to local simulator
              return await localSimulator.auth.signUp(args);
            }
            return res;
          } catch {
            return await localSimulator.auth.signUp(args);
          }
        },
        getSession: async () => {
          try {
            const res = await realClient!.auth.getSession();
            if (res.data?.session) return res;
            const localSession = await localSimulator.auth.getSession();
            return localSession.data?.session ? localSession : res;
          } catch {
            return localSimulator.auth.getSession();
          }
        },
        onAuthStateChange: (callback: (event: string, session: any) => void) => {
          let currentActiveUserId: string | null = null;

          // 1. Subscribe to real Supabase auth state changes
          const realSub = realClient!.auth.onAuthStateChange((event: string, session: any) => {
            if (session?.user) {
              currentActiveUserId = session.user.id;
              callback(event, session);
            } else {
              // Real client has no session. Check if local simulator has an active session.
              const localSession = localSimulator.getCurrentSession();
              if (localSession?.user) {
                currentActiveUserId = localSession.user.id;
                callback('SIGNED_IN', localSession);
              } else {
                currentActiveUserId = null;
                callback(event, null);
              }
            }
          });

          // 2. Subscribe to local simulator auth state changes
          const localSub = localSimulator.auth.onAuthStateChange((event: string, session: any) => {
            if (session?.user) {
              currentActiveUserId = session.user.id;
              callback(event, session);
            } else {
              // Local simulator has no session. Check if real client has an active session.
              realClient!.auth.getSession().then(({ data }: any) => {
                if (data?.session?.user) {
                  currentActiveUserId = data.session.user.id;
                  callback('SIGNED_IN', data.session);
                } else {
                  currentActiveUserId = null;
                  callback(event, null);
                }
              }).catch(() => {
                currentActiveUserId = null;
                callback(event, null);
              });
            }
          });

          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  try {
                    realSub?.data?.subscription?.unsubscribe();
                  } catch {}
                  try {
                    localSub?.data?.subscription?.unsubscribe();
                  } catch {}
                },
              },
            },
          };
        },
        signOut: async () => {
          await localSimulator.auth.signOut();
          try {
            return await realClient!.auth.signOut();
          } catch {
            return { error: null };
          }
        },
        resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
          try {
            const res = await realClient!.auth.resetPasswordForEmail(email, options);
            if (!res.error) return res;

            // If network fails or project offline, fallback to local simulator
            return await localSimulator.auth.resetPasswordForEmail(email, options);
          } catch {
            return await localSimulator.auth.resetPasswordForEmail(email, options);
          }
        },
        updatePasswordDirectly: async (email: string, newPassword: string) => {
          return await localSimulator.auth.updatePasswordDirectly(email, newPassword);
        },
        deleteAccount: async (userId: string, profileId?: string) => {
          return await deleteUserAccount(userId, profileId);
        },
      };
    }
    return localSimulator.auth;
  },

  storage: {
    from: (bucket: string) => {
      if (realClient) {
        return realClient.storage.from(bucket);
      }
      return localSimulator.storage.from(bucket);
    },
  },

  rpc: async (funcName: string, args: any) => {
    if (realClient && remoteTablesReady === true) {
      try {
        let fn = funcName;
        let fnArgs = { ...args };

        // Handle profile view counter: user's SQL defined `increment_profile_view(profile_username text)`
        if (funcName === 'increment_profile_view' || funcName === 'increment_view_count') {
          fn = 'increment_profile_view';
          const username = args.profile_username || args.username;
          if (username) {
            fnArgs = { profile_username: username };
          }
        }

        // Handle link click counter: user's SQL defined `increment_link_click(link_id uuid)`
        if (funcName === 'increment_link_click') {
          fn = 'increment_link_click';
          const linkId = args.link_id || args.p_link_id;
          if (linkId && isUuid(linkId)) {
            fnArgs = { link_id: linkId };
          }
        }

        const res = await realClient.rpc(fn, fnArgs);
        if (!res.error) return res;
      } catch {
        // Fallback to local RPC
      }
    }
    return localSimulator.rpc(funcName, args);
  },

  from: (tableName: string) => {
    if (realClient && remoteTablesReady === true) {
      interface ProxyContext {
        op?: string;
        payload?: any;
        filterId?: string;
        filterColumn?: string;
        filterValue?: any;
      }

      const wrapProxy = (targetObj: any, context: ProxyContext = {}): any => {
        const getLocalBuilder = () => {
          let sim: any = localSimulator.from(tableName);
          if (context.op === 'delete') sim = sim.delete();
          else if (context.op === 'update') sim = sim.update(context.payload);
          else if (context.op === 'insert') sim = sim.insert(context.payload);
          else if (context.op === 'select') sim = sim.select();
          return sim;
        };

        return new Proxy(targetObj, {
          get(target: any, prop: string | symbol) {
            if (prop === 'eq') {
              return (column: string, value: any) => {
                const isUuidColumn = ['id', 'user_id', 'profile_id', 'link_id'].includes(column);
                if (isUuidColumn && typeof value === 'string' && !isUuid(value)) {
                  // Non-UUID in a UUID column (e.g. demo account or demo link) -> route directly to local simulator with full operation context
                  return getLocalBuilder().eq(column, value);
                }
                try {
                  const next = target.eq(column, value);
                  const nextCtx: ProxyContext = {
                    ...context,
                    filterColumn: column,
                    filterValue: value,
                  };
                  if (column === 'id' && typeof value === 'string') {
                    nextCtx.filterId = value;
                  }
                  return wrapProxy(next, nextCtx);
                } catch {
                  return getLocalBuilder().eq(column, value);
                }
              };
            }
            if (prop === 'delete') {
              return () => {
                try {
                  const next = target.delete();
                  return wrapProxy(next, { ...context, op: 'delete' });
                } catch {
                  return localSimulator.from(tableName).delete();
                }
              };
            }
            if (prop === 'update') {
              return (payload: any) => {
                try {
                  const next = target.update(payload);
                  return wrapProxy(next, { ...context, op: 'update', payload });
                } catch {
                  return localSimulator.from(tableName).update(payload);
                }
              };
            }
            if (prop === 'insert') {
              return (record: any) => {
                const recs = Array.isArray(record) ? record : [record];
                if (
                  recs.some(
                    r =>
                      (r.user_id && typeof r.user_id === 'string' && !isUuid(r.user_id)) ||
                      (r.profile_id && typeof r.profile_id === 'string' && !isUuid(r.profile_id))
                  )
                ) {
                  return localSimulator.from(tableName).insert(record);
                }
                try {
                  const next = target.insert(record);
                  return wrapProxy(next, { ...context, op: 'insert', payload: record });
                } catch {
                  return localSimulator.from(tableName).insert(record);
                }
              };
            }
            if (prop === 'select') {
              return (...args: any[]) => {
                try {
                  const next = target.select(...args);
                  return wrapProxy(next, { ...context, op: 'select' });
                } catch {
                  return localSimulator.from(tableName).select(...args);
                }
              };
            }
            if (prop === 'then') {
              return (resolve: any, reject: any) => {
                return target.then(async (res: any) => {
                  // If PostgreSQL throws invalid UUID error or RLS denial, gracefully fall back to local simulator
                  if (
                    res?.error &&
                    (String(res.error.message || '').toLowerCase().includes('invalid input syntax for type uuid') ||
                      res.error.code === '22P02' ||
                      String(res.error.message || '').includes('violates row-level security'))
                  ) {
                    try {
                      let localQuery: any = localSimulator.from(tableName);
                      if (context.op === 'update' && context.payload) localQuery = localQuery.update(context.payload);
                      else if (context.op === 'insert' && context.payload) localQuery = localQuery.insert(context.payload);
                      else if (context.op === 'delete') localQuery = localQuery.delete();
                      else if (context.op === 'select') localQuery = localQuery.select();

                      if (context.filterColumn && context.filterValue !== undefined) {
                        localQuery = localQuery.eq(context.filterColumn, context.filterValue);
                      }
                      const localRes = await localQuery;
                      return resolve ? resolve(localRes) : localRes;
                    } catch {}
                  }

                  // Synchronize local simulator on deletes
                  if (context.op === 'delete') {
                    try {
                      if (context.filterColumn && context.filterValue !== undefined) {
                        await localSimulator.from(tableName).delete().eq(context.filterColumn, context.filterValue);
                      }
                    } catch {}
                  }

                  // Synchronize local simulator on updates
                  if (context.op === 'update' && context.payload) {
                    try {
                      if (context.filterColumn && context.filterValue !== undefined) {
                        await localSimulator.from(tableName).update(context.payload).eq(context.filterColumn, context.filterValue);
                      } else if (context.filterId) {
                        await localSimulator.from(tableName).update(context.payload).eq('id', context.filterId);
                      }
                    } catch {}
                  }

                  // Synchronize profile updates locally
                  if (tableName === 'profiles' && context.op === 'update' && context.payload) {
                    try {
                      const current = localStorage.getItem('linknest_saved_profile');
                      const parsed = current ? JSON.parse(current) : {};
                      localStorage.setItem('linknest_saved_profile', JSON.stringify({ ...parsed, ...context.payload }));
                    } catch {}
                  }

                  // Handle PGRST204 on 'links' table when 'description' column is missing in remote Supabase schema cache
                  if (
                    tableName === 'links' &&
                    res?.error &&
                    (res.error.code === 'PGRST204' || String(res.error.message || '').includes('description'))
                  ) {
                    // 1. If update failed due to missing description column
                    if (context.op === 'update' && context.payload && typeof context.payload === 'object') {
                      const linkId = context.filterId || context.payload.id;
                      const descriptionVal = context.payload.description;
                      if (linkId && descriptionVal !== undefined) {
                        saveLocalLinkDescription(linkId, descriptionVal);
                        try {
                          localSimulator.from('links').update({ description: descriptionVal }).eq('id', linkId);
                        } catch {}
                      }

                      const { description, ...cleanPayload } = context.payload;
                      // If only description was being updated
                      if (Object.keys(cleanPayload).length === 0) {
                        const resolvedRes = {
                          data: linkId ? [{ id: linkId, description: descriptionVal }] : null,
                          error: null,
                          status: 200,
                          statusText: 'OK',
                        };
                        return resolve ? resolve(resolvedRes) : resolvedRes;
                      }

                      // If other fields exist, retry updating without description column
                      try {
                        let retryQuery = realClient!.from(tableName).update(cleanPayload);
                        if (context.filterId) {
                          retryQuery = retryQuery.eq('id', context.filterId);
                        }
                        const retryRes: any = await retryQuery;
                        if (!retryRes.error) {
                          if (retryRes.data && linkId && descriptionVal !== undefined) {
                            if (Array.isArray(retryRes.data)) {
                              retryRes.data.forEach((r: any) => {
                                if (r.id === linkId) r.description = descriptionVal;
                              });
                            } else if (typeof retryRes.data === 'object') {
                              retryRes.data.description = descriptionVal;
                            }
                          }
                          return resolve ? resolve(retryRes) : retryRes;
                        }
                      } catch {}
                    }

                    // 2. If insert failed due to missing description column
                    if (context.op === 'insert' && context.payload) {
                      const records = Array.isArray(context.payload) ? context.payload : [context.payload];
                      const cleanRecords = records.map(({ description, ...rest }) => rest);
                      try {
                        const retryRes = await realClient!.from(tableName).insert(cleanRecords).select();
                        if (!retryRes.error && Array.isArray(retryRes.data)) {
                          retryRes.data.forEach((row: any, idx: number) => {
                            const origDesc = records[idx]?.description;
                            if (origDesc && row.id) {
                              saveLocalLinkDescription(row.id, origDesc);
                              row.description = origDesc;
                            }
                          });
                          return resolve ? resolve(retryRes) : retryRes;
                        }
                      } catch {}
                    }
                  }

                  // If select on 'links', enrich with local descriptions and live clicks
                  if (tableName === 'links' && !res?.error && Array.isArray(res?.data)) {
                    res.data = enrichLinksWithLocalDescriptions(res.data);
                  }

                  return resolve ? resolve(res) : res;
                }, reject);
              };
            }
            const val = target[prop];
            if (typeof val === 'function') {
              return (...args: any[]) => {
                try {
                  const result = val.apply(target, args);
                  if (result && typeof result === 'object') {
                    return wrapProxy(result, context);
                  }
                  return result;
                } catch {
                  return localSimulator.from(tableName);
                }
              };
            }
            return val;
          },
        });
      };

      return wrapProxy(realClient.from(tableName));
    }
    return localSimulator.from(tableName);
  },
} as any;

/**
 * Permanently deletes a user account, their profiles, links, social links, and analytics.
 */
export async function deleteUserAccount(userId: string, profileId?: string): Promise<{ error: any }> {
  try {
    // 1. If real Supabase client is connected, delete remote data
    if (realClient && remoteTablesReady === true) {
      if (profileId) {
        try {
          await realClient.from('link_clicks').delete().eq('profile_id', profileId);
        } catch {}
        try {
          await realClient.from('links').delete().eq('profile_id', profileId);
        } catch {}
        try {
          await realClient.from('social_icons').delete().eq('profile_id', profileId);
        } catch {}
        try {
          await realClient.from('profiles').delete().eq('id', profileId);
        } catch {}
      }
      try {
        await realClient.auth.signOut();
      } catch {}
    }

    // 2. Delete from local simulator
    await localSimulator.deleteAccount(userId, profileId);

    // 3. Clean specific local storage keys
    if (profileId) {
      try {
        localStorage.removeItem('linknest_custom_profile_' + profileId);
        localStorage.removeItem('linknest_custom_social_' + profileId);
        localStorage.removeItem('linknest_links_initialized_' + profileId);
      } catch {}
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('linknest:account_deleted'));
    }

    return { error: null };
  } catch (err: any) {
    console.error('Delete account failed:', err);
    return { error: err };
  }
}

