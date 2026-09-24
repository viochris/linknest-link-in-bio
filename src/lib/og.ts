/**
 * Open Graph & SEO metadata utilities for LinkNest.
 * Provides dynamic OG image URL generation and client-side vector SVG rendering
 * for instant social share previews and downloads.
 */

export interface OgImageParams {
  username: string;
  displayName: string;
  bio?: string;
  accentColor?: string;
  linksCount?: number;
  avatarUrl?: string;
}

/**
 * Builds the URL for the server-side Satori Open Graph image generation endpoint.
 */
export function buildOgImageUrl(params: OgImageParams): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const searchParams = new URLSearchParams();

  searchParams.set('username', params.username || 'user');
  if (params.displayName) searchParams.set('name', params.displayName);
  if (params.bio) searchParams.set('bio', params.bio.replace(/\n/g, ' ').slice(0, 160));
  if (params.accentColor) searchParams.set('accent', params.accentColor);
  if (params.linksCount !== undefined) searchParams.set('links', String(params.linksCount));
  if (params.avatarUrl) searchParams.set('avatar', params.avatarUrl);

  return `${origin}/api/og?${searchParams.toString()}`;
}

/**
 * Computes canonical page metadata for React Helmet.
 */
export function getProfileSeoMetadata(params: {
  username: string;
  displayName: string;
  bio?: string;
  metaTitle?: string;
  metaDescription?: string;
  accentColor?: string;
  linksCount?: number;
  avatarUrl?: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';
  const cleanName = params.displayName || params.username;
  const pageTitle = params.metaTitle?.trim() || `${cleanName} (@${params.username}) | LinkNest`;
  
  const rawBio = params.bio ? params.bio.replace(/\n/g, ' ').trim() : '';
  const metaDescription = params.metaDescription?.trim() || (rawBio
    ? `${rawBio} - Check out my verified links, projects, and social profiles on LinkNest.`
    : `Explore ${cleanName}'s official links, social channels, and projects curated on LinkNest.`);

  const canonicalUrl = `${origin}/${params.username}`;
  const ogImageUrl = buildOgImageUrl(params);

  return {
    title: pageTitle,
    description: metaDescription,
    canonicalUrl,
    ogImageUrl,
    username: params.username,
    displayName: cleanName,
  };
}

/**
 * Generates an SVG string representation of the Open Graph card directly in client-side JS.
 * Used for zero-latency in-app previews, data URLs, and vector downloads.
 */
export function generateClientOgSvg(params: OgImageParams): string {
  const name = escapeXml(params.displayName || params.username);
  const username = escapeXml(params.username);
  const accent = params.accentColor || '#6366f1';
  const linksCount = params.linksCount ?? 0;
  
  // Clean first and second lines of bio for card
  const bioLines = (params.bio || 'Link in bio • Curated links and social profiles')
    .replace(/🚀\s*\|\s*/g, '🚀\n')
    .split('\n')
    .map(l => escapeXml(l.trim()))
    .filter(Boolean);

  const bioLine1 = bioLines[0] || 'Link in bio';
  const bioLine2 = bioLines[1] || (linksCount > 0 ? `${linksCount} active links & portfolio showcases` : 'Curated links & profile');
  const initial = (name[0] || username[0] || 'L').toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="50%" stop-color="#070a12" />
      <stop offset="100%" stop-color="#030509" />
    </linearGradient>
    <radialGradient id="glowTopRight" cx="90%" cy="10%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowBottomLeft" cx="10%" cy="90%" r="45%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
    </radialGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#glowTopRight)" />
  <rect width="1200" height="630" fill="url(#glowBottomLeft)" />

  <!-- Outer Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="28" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="2" />

  <!-- Main Card Container -->
  <g transform="translate(64, 56)">
    <!-- Top Brand Header -->
    <g transform="translate(0, 0)">
      <!-- LinkNest Icon Box -->
      <rect width="46" height="46" rx="12" fill="url(#brandGrad)" />
      <path d="M 17 23 C 17 19.5 19.5 17 23 17 L 27 17 C 30.5 17 33 19.5 33 23 C 33 26.5 30.5 29 27 29 L 23 29 C 19.5 29 17 26.5 17 23 Z" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 21 21 L 29 25" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
      <circle cx="23" cy="23" r="2" fill="#ffffff" />
      
      <!-- Brand Name -->
      <text x="60" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#f8fafc" letter-spacing="-0.5">LinkNest</text>

      <!-- Verified Profile Pill -->
      <g transform="translate(860, 2)">
        <rect width="210" height="40" rx="20" fill="${accent}20" stroke="${accent}50" stroke-width="1.5" />
        <circle cx="24" cy="20" r="5" fill="${accent}" />
        <text x="120" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#e0e7ff" text-anchor="middle" letter-spacing="1">VERIFIED CREATOR</text>
      </g>
    </g>

    <!-- Center Profile Section -->
    <g transform="translate(0, 110)">
      <!-- Avatar with Accent Glow Ring -->
      <circle cx="70" cy="70" r="70" fill="#0f172a" stroke="${accent}" stroke-width="5" />
      <circle cx="70" cy="70" r="62" fill="#1e293b" />
      <text x="70" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="800" fill="${accent}" text-anchor="middle">${initial}</text>

      <!-- Profile Info -->
      <g transform="translate(175, 10)">
        <!-- Display Name -->
        <text x="0" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#ffffff" letter-spacing="-1">${name}</text>
        
        <!-- Handle Pill -->
        <g transform="translate(0, 64)">
          <rect width="180" height="34" rx="8" fill="${accent}22" stroke="${accent}40" stroke-width="1" />
          <text x="12" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#c7d2fe">@${username}</text>
        </g>

        <!-- Bio Line 1 -->
        <text x="0" y="142" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" fill="#f1f5f9">${bioLine1}</text>

        <!-- Bio Line 2 -->
        <text x="0" y="178" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">${bioLine2}</text>
      </g>
    </g>

    <!-- Bottom Footer Row -->
    <g transform="translate(0, 440)">
      <line x1="0" y1="0" x2="1072" y2="0" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />
      
      <!-- Canonical Profile URL -->
      <text x="0" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="#94a3b8">linknest.app/@${username}</text>

      <!-- Active Links Counter Badge -->
      <g transform="translate(830, 18)">
        <rect width="242" height="44" rx="12" fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />
        <text x="121" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="700" fill="#c7d2fe" text-anchor="middle">${linksCount} Active Links &amp; Projects</text>
      </g>
    </g>
  </g>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
