import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Profile } from '../../types';
import { buildOgImageUrl } from '../../lib/og';

export interface MetaTagsProps {
  profile?: Profile | null;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  username?: string;
  accentColor?: string;
  linksCount?: number;
  canonicalUrl?: string;
  ogImageUrl?: string;
}

/**
 * MetaTags Component
 * Dynamically injects SEO-friendly title, description, Open Graph tags,
 * Twitter Cards, and JSON-LD structured data into the document head using react-helmet-async.
 */
export const MetaTags: React.FC<MetaTagsProps> = ({
  profile,
  displayName,
  bio,
  avatarUrl,
  username,
  accentColor,
  linksCount,
  canonicalUrl: customCanonicalUrl,
  ogImageUrl: customOgImageUrl,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';

  // Resolve values with priority to direct props, then profile object, then safe fallbacks
  const resolvedUsername = (username || profile?.username || 'silvio').trim();
  const resolvedDisplayName = (displayName || profile?.display_name || resolvedUsername).trim();
  const resolvedBio = (bio !== undefined ? bio : profile?.bio || '').trim();
  const rawAvatar = avatarUrl || profile?.avatar_url || '/avatar-silvio.png';
  const resolvedAccent = accentColor || profile?.theme?.accent_color || '#6366f1';

  // SEO Page Title based on meta_title first, then username and display name
  const pageTitle = (profile?.meta_title || '').trim() || (profile?.display_name
    ? `${resolvedDisplayName} (@${resolvedUsername}) | LinkNest`
    : `@${resolvedUsername} | LinkNest - Verified Bio & Links`);

  // Clean description for meta tags (one line, no raw newlines), prioritizing meta_description
  const cleanBio = resolvedBio ? resolvedBio.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const description = (profile?.meta_description || '').trim() || (cleanBio
    ? `${cleanBio} - Explore verified links, projects, and social channels for @${resolvedUsername} on LinkNest.`
    : `Explore @${resolvedUsername}'s official verified links, projects, and social profiles on LinkNest. Connect on GitHub, LinkedIn, Instagram, and more.`);

  // Absolute Avatar URL (required by crawlers)
  let absoluteAvatar = rawAvatar;
  if (absoluteAvatar.startsWith('/')) {
    absoluteAvatar = `${origin}${absoluteAvatar}`;
  }

  // Canonical profile URL
  const canonicalUrl = customCanonicalUrl || `${origin}/${resolvedUsername}`;

  // Open Graph preview image (uses dynamic server Satori endpoint with SVG/avatar fallbacks)
  const ogImage =
    customOgImageUrl ||
    buildOgImageUrl({
      username: resolvedUsername,
      displayName: resolvedDisplayName,
      bio: cleanBio,
      accentColor: resolvedAccent,
      linksCount: linksCount ?? (profile ? 9 : undefined),
      avatarUrl: absoluteAvatar,
    });

  // Make sure ogImage is absolute
  const absoluteOgImage = ogImage.startsWith('/') ? `${origin}${ogImage}` : ogImage;

  // JSON-LD structured data for Google Search Profile Page / Person Schema
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${resolvedDisplayName} on LinkNest`,
    url: canonicalUrl,
    description,
    mainEntity: {
      '@type': 'Person',
      name: resolvedDisplayName,
      alternateName: resolvedUsername,
      identifier: resolvedUsername,
      description: cleanBio || description,
      image: absoluteAvatar,
      url: canonicalUrl,
    },
  };

  return (
    <Helmet>
      {/* Primary Page Title & Standard Search Engine Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content={`${resolvedDisplayName}, ${resolvedUsername}, link in bio, portfolio, developer, open source, AI engineer, social links, LinkNest`}
      />
      <meta name="author" content={resolvedDisplayName} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags (Facebook, LinkedIn, Discord, Slack, WhatsApp) */}
      <meta property="og:site_name" content="LinkNest" />
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:secure_url" content={absoluteOgImage} />
      <meta property="og:image:alt" content={`${resolvedDisplayName}'s social card on LinkNest`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />
      <meta property="profile:username" content={resolvedUsername} />

      {/* X / Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@linknest" />
      <meta name="twitter:creator" content={`@${resolvedUsername}`} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      <meta name="twitter:image:alt" content={`${resolvedDisplayName}'s social card on LinkNest`} />

      {/* Structured Data (Schema.org JSON-LD) */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
};

export default MetaTags;
