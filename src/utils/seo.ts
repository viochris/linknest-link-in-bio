import { Profile } from '../types';
import { buildOgImageUrl } from '../lib/og';

/**
 * Standardized input parameters for generating user profile SEO metadata.
 */
export interface ProfileSEOInput {
  profile?: Profile | Partial<Profile> | null;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  accentColor?: string;
  origin?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  linksCount?: number;
}

/**
 * Standardized Open Graph meta tags object.
 */
export interface OpenGraphMeta {
  siteName: string;
  type: string;
  title: string;
  description: string;
  url: string;
  image: string;
  imageSecureUrl: string;
  imageAlt: string;
  profileUsername: string;
}

/**
 * Standardized Twitter Card meta tags object.
 */
export interface TwitterMeta {
  card: 'summary' | 'summary_large_image';
  site: string;
  creator: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

/**
 * Standard HTML document head meta data.
 */
export interface StandardMeta {
  title: string;
  description: string;
  keywords: string;
  author: string;
  robots: string;
  canonicalUrl: string;
}

/**
 * Key-value tag pair for standard meta rendering.
 */
export interface MetaTagItem {
  property?: string;
  name?: string;
  content: string;
}

/**
 * Complete standardized SEO result object.
 */
export interface ProfileSEOResult {
  title: string;
  description: string;
  canonicalUrl: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  standard: StandardMeta;
  openGraph: OpenGraphMeta;
  twitter: TwitterMeta;
  openGraphTags: Array<{ property: string; content: string }>;
  twitterTags: Array<{ name: string; content: string }>;
  jsonLd: Record<string, any>;
}

/**
 * Helper to resolve normalized inputs with safe fallbacks.
 */
function resolveProfileFields(input: ProfileSEOInput) {
  const origin =
    input.origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app');

  const username = (input.username || input.profile?.username || 'user')
    .toLowerCase()
    .trim();

  const displayName = (
    input.displayName ||
    input.profile?.display_name ||
    username
  ).trim();

  const rawBio = (
    input.bio !== undefined ? input.bio : input.profile?.bio || ''
  )
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawAvatar =
    input.avatarUrl || input.profile?.avatar_url || '/icon.svg';

  let absoluteAvatar = rawAvatar;
  if (absoluteAvatar.startsWith('/')) {
    absoluteAvatar = `${origin}${absoluteAvatar}`;
  }

  const accentColor =
    input.accentColor || input.profile?.theme?.accent_color || '#6366f1';

  const canonicalUrl = input.canonicalUrl || `${origin}/${username}`;

  // Generate or sanitize OG image URL
  const ogImageUrl =
    input.ogImageUrl ||
    buildOgImageUrl({
      username,
      displayName,
      bio: rawBio,
      accentColor,
      linksCount: input.linksCount ?? 8,
      avatarUrl: absoluteAvatar,
    });

  const absoluteOgImage = ogImageUrl.startsWith('/')
    ? `${origin}${ogImageUrl}`
    : ogImageUrl;

  const pageTitle =
    input.profile?.meta_title?.trim() ||
    (input.profile?.display_name
      ? `${displayName} (@${username}) | LinkNest`
      : `@${username} | LinkNest - Verified Bio & Links`);

  const metaDescription =
    input.profile?.meta_description?.trim() ||
    (rawBio
      ? `${rawBio} - Explore verified links, projects, and social channels for @${username} on LinkNest.`
      : `Explore @${username}'s official verified links, projects, and social profiles on LinkNest. Connect on GitHub, LinkedIn, and more.`);

  return {
    origin,
    username,
    displayName,
    bio: rawBio,
    avatarUrl: absoluteAvatar,
    accentColor,
    canonicalUrl,
    ogImageUrl: absoluteOgImage,
    pageTitle,
    metaDescription,
  };
}

/**
 * Generates standardized Open Graph metadata object for a user profile.
 */
export function generateProfileOpenGraph(input: ProfileSEOInput): OpenGraphMeta {
  const fields = resolveProfileFields(input);

  return {
    siteName: 'LinkNest',
    type: 'profile',
    title: fields.pageTitle,
    description: fields.metaDescription,
    url: fields.canonicalUrl,
    image: fields.ogImageUrl,
    imageSecureUrl: fields.ogImageUrl,
    imageAlt: `${fields.displayName}'s verified profile on LinkNest`,
    profileUsername: fields.username,
  };
}

/**
 * Generates standardized Twitter Card metadata object for a user profile.
 */
export function generateProfileTwitterCard(input: ProfileSEOInput): TwitterMeta {
  const fields = resolveProfileFields(input);

  return {
    card: 'summary_large_image',
    site: '@linknest',
    creator: `@${fields.username}`,
    title: fields.pageTitle,
    description: fields.metaDescription,
    image: fields.ogImageUrl,
    imageAlt: `${fields.displayName}'s verified profile on LinkNest`,
  };
}

/**
 * Generates standard document meta tags (title, description, canonical, robots).
 */
export function generateProfileStandardMeta(input: ProfileSEOInput): StandardMeta {
  const fields = resolveProfileFields(input);

  return {
    title: fields.pageTitle,
    description: fields.metaDescription,
    keywords: `${fields.displayName}, ${fields.username}, link in bio, portfolio, verified links, developer, LinkNest`,
    author: fields.displayName,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    canonicalUrl: fields.canonicalUrl,
  };
}

/**
 * Generates JSON-LD schema.org structured data object for search engines.
 */
export function generateProfileJsonLd(input: ProfileSEOInput): Record<string, any> {
  const fields = resolveProfileFields(input);

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${fields.displayName} on LinkNest`,
    url: fields.canonicalUrl,
    description: fields.metaDescription,
    mainEntity: {
      '@type': 'Person',
      name: fields.displayName,
      alternateName: fields.username,
      identifier: fields.username,
      description: fields.bio || fields.metaDescription,
      image: fields.avatarUrl,
      url: fields.canonicalUrl,
    },
  };
}

/**
 * Converts OpenGraphMeta into a standardized array of meta tag objects.
 */
export function getOpenGraphTagList(og: OpenGraphMeta): Array<{ property: string; content: string }> {
  return [
    { property: 'og:site_name', content: og.siteName },
    { property: 'og:type', content: og.type },
    { property: 'og:title', content: og.title },
    { property: 'og:description', content: og.description },
    { property: 'og:url', content: og.url },
    { property: 'og:image', content: og.image },
    { property: 'og:image:secure_url', content: og.imageSecureUrl },
    { property: 'og:image:alt', content: og.imageAlt },
    { property: 'profile:username', content: og.profileUsername },
  ];
}

/**
 * Converts TwitterMeta into a standardized array of meta tag objects.
 */
export function getTwitterTagList(tw: TwitterMeta): Array<{ name: string; content: string }> {
  return [
    { name: 'twitter:card', content: tw.card },
    { name: 'twitter:site', content: tw.site },
    { name: 'twitter:creator', content: tw.creator },
    { name: 'twitter:title', content: tw.title },
    { name: 'twitter:description', content: tw.description },
    { name: 'twitter:image', content: tw.image },
    { name: 'twitter:image:alt', content: tw.imageAlt },
  ];
}

/**
 * Master utility function: Generates all standardized SEO metadata objects
 * for a user profile in one convenient call.
 */
export function generateProfileSEO(input: ProfileSEOInput): ProfileSEOResult {
  const fields = resolveProfileFields(input);
  const openGraph = generateProfileOpenGraph(input);
  const twitter = generateProfileTwitterCard(input);
  const standard = generateProfileStandardMeta(input);
  const jsonLd = generateProfileJsonLd(input);

  return {
    title: fields.pageTitle,
    description: fields.metaDescription,
    canonicalUrl: fields.canonicalUrl,
    displayName: fields.displayName,
    username: fields.username,
    avatarUrl: fields.avatarUrl,
    standard,
    openGraph,
    twitter,
    openGraphTags: getOpenGraphTagList(openGraph),
    twitterTags: getTwitterTagList(twitter),
    jsonLd,
  };
}
