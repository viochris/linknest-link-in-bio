import { supabase, localSimulator } from './supabase';
import { Profile } from '../types';
import { buildOgImageUrl } from './og';

export interface UserProfileMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  themeColor: string;
}

/**
 * Helper function to fetch user profile data by username.
 * Queries the Supabase `profiles` table, with graceful fallback to the local simulator
 * for demo profiles or offline local states.
 *
 * @param username The slug/username of the profile to retrieve
 * @returns Promise<Profile | null> The profile record or null if not found
 */
export async function fetchUserProfileData(username: string): Promise<Profile | null> {
  const cleanUsername = username?.trim().toLowerCase();
  if (!cleanUsername) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (data && !error) {
      return data as Profile;
    }

    // Fallback for default @silvio profile or public @demo profile
    if (cleanUsername === 'silvio' || cleanUsername === 'demo') {
      const res = await localSimulator
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();
      if (res.data) {
        return res.data as Profile;
      }
    }

    return null;
  } catch (err) {
    console.warn(`[fetchUserProfileData] Failed fetching profile for @${cleanUsername}:`, err);
    return null;
  }
}

/**
 * Computes dynamic SEO and Open Graph metadata values for react-helmet-async
 * based on the retrieved user profile or username.
 */
export function getUserProfileMetadata(
  username: string,
  profile: Profile | null,
  baseUrl?: string
): UserProfileMetadata {
  const cleanUsername = (username || profile?.username || 'silvio').trim().toLowerCase();
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app');
  const canonicalUrl = `${origin}/${cleanUsername}`;

  const displayName = (profile?.display_name || cleanUsername).trim();
  const rawBio = (profile?.bio || '').trim();
  const cleanBio = rawBio ? rawBio.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';

  // Dynamic document and OG Title
  const title = profile?.display_name
    ? `${displayName} (@${cleanUsername}) | LinkNest`
    : `@${cleanUsername} | LinkNest - Verified Bio & Links`;

  // Dynamic meta description
  const description = cleanBio
    ? `${cleanBio} - Explore verified links, projects, and social profiles for @${cleanUsername} on LinkNest.`
    : `Explore @${cleanUsername}'s official verified links, projects, and social profiles on LinkNest. Connect on GitHub, LinkedIn, Instagram, and more.`;

  // Avatar URL
  let avatar = profile?.avatar_url || '/avatar-silvio.png';
  if (avatar.startsWith('/')) {
    avatar = `${origin}${avatar}`;
  }

  const themeColor = profile?.theme?.accent_color || '#6366f1';

  // Dynamic OG image URL
  const ogImage = buildOgImageUrl({
    username: cleanUsername,
    displayName,
    bio: cleanBio,
    accentColor: themeColor,
    linksCount: profile ? 9 : undefined,
    avatarUrl: avatar,
  });
  const absoluteOgImage = ogImage.startsWith('/') ? `${origin}${ogImage}` : ogImage;

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage: absoluteOgImage,
    ogUrl: canonicalUrl,
    username: cleanUsername,
    displayName,
    avatarUrl: avatar,
    themeColor,
  };
}
