interface VercelRequest {
  query: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  send: (body: any) => void;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const username = String(req.query.username || 'silvio').toLowerCase().trim();
  const rawName = String(req.query.name || (username === 'silvio' ? 'Silvio Christian Joe' : username)).trim();
  const rawBio = String(
    req.query.bio ||
      (username === 'silvio'
        ? 'AI Engineer & Full-Stack Developer 🚀\nCheck out my portfolio, Kaggle models, and open-source projects.'
        : 'Curated links, social profiles, and projects.')
  ).trim();
  const accent = String(req.query.accent || '#6366f1').trim();
  const linksCount = parseInt(String(req.query.links || '9'), 10) || 0;

  const name = escapeXml(rawName);
  const bioLines = rawBio.split('\n').filter(Boolean);
  const bioLine1 = escapeXml(bioLines[0] || 'Link in bio');
  const bioLine2 = escapeXml(bioLines.slice(1).join(' ') || `${linksCount} active links & portfolio showcases`);
  const initial = escapeXml((rawName[0] || username[0] || 'L').toUpperCase());

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
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
  </defs>

  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#glowTopRight)" />
  <rect width="1200" height="630" fill="url(#glowBottomLeft)" />

  <!-- Outer frame border -->
  <rect x="24" y="24" width="1152" height="582" rx="28" fill="none" stroke="#1e293b" stroke-width="3" stroke-opacity="0.8" />

  <!-- Top Bar: LinkNest Brand & Verification Badge -->
  <g transform="translate(72, 72)">
    <!-- Logo Badge -->
    <rect width="52" height="52" rx="14" fill="${accent}" />
    <text x="26" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">LN</text>
    
    <text x="70" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="800" fill="#f8fafc" letter-spacing="-0.5">LinkNest</text>

    <!-- Verified Badge pill -->
    <g transform="translate(860, 4)">
      <rect width="196" height="44" rx="22" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-opacity="0.4" stroke-width="1.5" />
      <circle cx="26" cy="22" r="8" fill="#10b981" />
      <text x="44" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#c7d2fe">Verified Profile</text>
    </g>
  </g>

  <!-- Center Content: Avatar & Identity -->
  <g transform="translate(72, 175)">
    <!-- Avatar circle -->
    <circle cx="68" cy="68" r="68" fill="${accent}" />
    <text x="68" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="900" fill="#ffffff" text-anchor="middle">${initial}</text>

    <!-- Display Name & Handle -->
    <g transform="translate(164, 25)">
      <text x="0" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#ffffff" letter-spacing="-0.5">${name}</text>
      <text x="0" y="82" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="600" fill="#94a3b8">@${username}</text>
    </g>
  </g>

  <!-- Bio Section with Card Background -->
  <g transform="translate(72, 335)">
    <rect width="1056" height="135" rx="18" fill="#0f172a" fill-opacity="0.75" stroke="#334155" stroke-width="1.5" />
    <text x="36" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" fill="#e2e8f0">${bioLine1}</text>
    <text x="36" y="94" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">${bioLine2}</text>
  </g>

  <!-- Bottom Stats Footer -->
  <g transform="translate(72, 532)">
    <rect width="190" height="38" rx="12" fill="#1e293b" fill-opacity="0.8" />
    <text x="20" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#cbd5e1">🔗 ${linksCount} Verified Links</text>

    <text x="1056" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#64748b" text-anchor="end">linknest.app/${username}</text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).send(svg);
}
