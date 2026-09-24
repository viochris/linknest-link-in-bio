/**
 * Utility for automatically detecting and mapping social media & web domains
 * to professional icons, brand colors, and badges.
 */

export interface DetectedPlatform {
  platform: string;       // Unique platform slug e.g. 'instagram'
  label: string;          // Human friendly name e.g. 'Instagram'
  iconKey: string;        // Matching key in IconMap (src/lib/icons.tsx)
  brandColor: string;     // Official hex brand color
  gradientClass?: string; // Optional tailwind gradient
  badgeBg: string;        // Soft background for chips/tags
  badgeBorder: string;    // Subtle border for chips
}

export type LinkPlatform = DetectedPlatform;

// Ordered rules: more specific domains first
const PLATFORM_RULES: Array<{
  domains: string[];
  patterns?: RegExp[];
  platform: DetectedPlatform;
}> = [
  {
    domains: ['instagram.com', 'instagr.am'],
    platform: {
      platform: 'instagram',
      label: 'Instagram',
      iconKey: 'instagram',
      brandColor: '#E1306C',
      badgeBg: 'rgba(225, 48, 108, 0.12)',
      badgeBorder: 'rgba(225, 48, 108, 0.35)',
    },
  },
  {
    domains: ['twitter.com', 'x.com', 't.co'],
    platform: {
      platform: 'twitter',
      label: 'X (Twitter)',
      iconKey: 'twitter',
      brandColor: '#1DA1F2',
      badgeBg: 'rgba(29, 161, 242, 0.12)',
      badgeBorder: 'rgba(29, 161, 242, 0.35)',
    },
  },
  {
    domains: ['github.com', 'gist.github.com'],
    platform: {
      platform: 'github',
      label: 'GitHub',
      iconKey: 'github',
      brandColor: '#f0f6fc',
      badgeBg: 'rgba(240, 246, 252, 0.12)',
      badgeBorder: 'rgba(240, 246, 252, 0.35)',
    },
  },
  {
    domains: ['youtube.com', 'youtu.be'],
    platform: {
      platform: 'youtube',
      label: 'YouTube',
      iconKey: 'youtube',
      brandColor: '#FF0000',
      badgeBg: 'rgba(255, 0, 0, 0.12)',
      badgeBorder: 'rgba(255, 0, 0, 0.35)',
    },
  },
  {
    domains: ['linkedin.com', 'lnkd.in'],
    platform: {
      platform: 'linkedin',
      label: 'LinkedIn',
      iconKey: 'linkedin',
      brandColor: '#0A66C2',
      badgeBg: 'rgba(10, 102, 194, 0.12)',
      badgeBorder: 'rgba(10, 102, 194, 0.35)',
    },
  },
  {
    domains: ['tiktok.com', 'vm.tiktok.com'],
    platform: {
      platform: 'tiktok',
      label: 'TikTok',
      iconKey: 'tiktok',
      brandColor: '#FE2C55',
      badgeBg: 'rgba(254, 44, 85, 0.12)',
      badgeBorder: 'rgba(254, 44, 85, 0.35)',
    },
  },
  {
    domains: ['spotify.com', 'spoti.fi'],
    platform: {
      platform: 'spotify',
      label: 'Spotify',
      iconKey: 'spotify',
      brandColor: '#1ED760',
      badgeBg: 'rgba(30, 215, 96, 0.12)',
      badgeBorder: 'rgba(30, 215, 96, 0.35)',
    },
  },
  {
    domains: ['discord.gg', 'discord.com', 'discordapp.com'],
    platform: {
      platform: 'discord',
      label: 'Discord',
      iconKey: 'discord',
      brandColor: '#5865F2',
      badgeBg: 'rgba(88, 101, 242, 0.12)',
      badgeBorder: 'rgba(88, 101, 242, 0.35)',
    },
  },
  {
    domains: ['twitch.tv'],
    platform: {
      platform: 'twitch',
      label: 'Twitch',
      iconKey: 'twitch',
      brandColor: '#A970FF',
      badgeBg: 'rgba(169, 112, 255, 0.12)',
      badgeBorder: 'rgba(169, 112, 255, 0.35)',
    },
  },
  {
    domains: ['facebook.com', 'fb.com', 'fb.watch'],
    platform: {
      platform: 'facebook',
      label: 'Facebook',
      iconKey: 'facebook',
      brandColor: '#1877F2',
      badgeBg: 'rgba(24, 119, 242, 0.12)',
      badgeBorder: 'rgba(24, 119, 242, 0.35)',
    },
  },
  {
    domains: ['threads.net'],
    platform: {
      platform: 'threads',
      label: 'Threads',
      iconKey: 'threads',
      brandColor: '#ffffff',
      badgeBg: 'rgba(255, 255, 255, 0.12)',
      badgeBorder: 'rgba(255, 255, 255, 0.35)',
    },
  },
  {
    domains: ['t.me', 'telegram.org', 'telegram.me'],
    platform: {
      platform: 'telegram',
      label: 'Telegram',
      iconKey: 'telegram',
      brandColor: '#26A5E4',
      badgeBg: 'rgba(38, 165, 228, 0.12)',
      badgeBorder: 'rgba(38, 165, 228, 0.35)',
    },
  },
  {
    domains: ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
    platform: {
      platform: 'whatsapp',
      label: 'WhatsApp',
      iconKey: 'whatsapp',
      brandColor: '#25D366',
      badgeBg: 'rgba(37, 211, 102, 0.12)',
      badgeBorder: 'rgba(37, 211, 102, 0.35)',
    },
  },
  {
    domains: ['reddit.com', 'redd.it'],
    platform: {
      platform: 'reddit',
      label: 'Reddit',
      iconKey: 'reddit',
      brandColor: '#FF4500',
      badgeBg: 'rgba(255, 69, 0, 0.12)',
      badgeBorder: 'rgba(255, 69, 0, 0.35)',
    },
  },
  {
    domains: ['dribbble.com'],
    platform: {
      platform: 'dribbble',
      label: 'Dribbble',
      iconKey: 'dribbble',
      brandColor: '#EA4C89',
      badgeBg: 'rgba(234, 76, 137, 0.12)',
      badgeBorder: 'rgba(234, 76, 137, 0.35)',
    },
  },
  {
    domains: ['behance.net'],
    platform: {
      platform: 'behance',
      label: 'Behance',
      iconKey: 'behance',
      brandColor: '#1769FF',
      badgeBg: 'rgba(23, 105, 255, 0.12)',
      badgeBorder: 'rgba(23, 105, 255, 0.35)',
    },
  },
  {
    domains: ['figma.com'],
    platform: {
      platform: 'figma',
      label: 'Figma',
      iconKey: 'figma',
      brandColor: '#F24E1E',
      badgeBg: 'rgba(242, 78, 30, 0.12)',
      badgeBorder: 'rgba(242, 78, 30, 0.35)',
    },
  },
  {
    domains: ['pinterest.com', 'pin.it'],
    platform: {
      platform: 'pinterest',
      label: 'Pinterest',
      iconKey: 'pinterest',
      brandColor: '#BD081C',
      badgeBg: 'rgba(189, 8, 28, 0.12)',
      badgeBorder: 'rgba(189, 8, 28, 0.35)',
    },
  },
  {
    domains: ['medium.com'],
    platform: {
      platform: 'medium',
      label: 'Medium',
      iconKey: 'medium',
      brandColor: '#00AB6C',
      badgeBg: 'rgba(0, 171, 108, 0.12)',
      badgeBorder: 'rgba(0, 171, 108, 0.35)',
    },
  },
  {
    domains: ['substack.com'],
    platform: {
      platform: 'substack',
      label: 'Substack',
      iconKey: 'substack',
      brandColor: '#FF6719',
      badgeBg: 'rgba(255, 103, 25, 0.12)',
      badgeBorder: 'rgba(255, 103, 25, 0.35)',
    },
  },
  {
    domains: ['kaggle.com'],
    platform: {
      platform: 'kaggle',
      label: 'Kaggle',
      iconKey: 'kaggle',
      brandColor: '#20BEFF',
      badgeBg: 'rgba(32, 190, 255, 0.12)',
      badgeBorder: 'rgba(32, 190, 255, 0.35)',
    },
  },
  {
    domains: ['patreon.com'],
    platform: {
      platform: 'patreon',
      label: 'Patreon',
      iconKey: 'patreon',
      brandColor: '#FF424D',
      badgeBg: 'rgba(255, 66, 77, 0.12)',
      badgeBorder: 'rgba(255, 66, 77, 0.35)',
    },
  },
  {
    domains: ['ko-fi.com'],
    platform: {
      platform: 'ko-fi',
      label: 'Ko-fi',
      iconKey: 'coffee',
      brandColor: '#FF5E5B',
      badgeBg: 'rgba(255, 94, 91, 0.12)',
      badgeBorder: 'rgba(255, 94, 91, 0.35)',
    },
  },
  {
    domains: ['buymeacoffee.com'],
    platform: {
      platform: 'buymeacoffee',
      label: 'Buy Me a Coffee',
      iconKey: 'coffee',
      brandColor: '#FFDD00',
      badgeBg: 'rgba(255, 221, 0, 0.12)',
      badgeBorder: 'rgba(255, 221, 0, 0.35)',
    },
  },
  {
    domains: ['steamcommunity.com', 'steampowered.com'],
    platform: {
      platform: 'steam',
      label: 'Steam',
      iconKey: 'steam',
      brandColor: '#66c0f4',
      badgeBg: 'rgba(102, 192, 244, 0.12)',
      badgeBorder: 'rgba(102, 192, 244, 0.35)',
    },
  },
  {
    domains: ['music.apple.com', 'podcasts.apple.com'],
    platform: {
      platform: 'apple-music',
      label: 'Apple Music / Podcasts',
      iconKey: 'music',
      brandColor: '#FA243C',
      badgeBg: 'rgba(250, 36, 60, 0.12)',
      badgeBorder: 'rgba(250, 36, 60, 0.35)',
    },
  },
  {
    domains: ['soundcloud.com'],
    platform: {
      platform: 'soundcloud',
      label: 'SoundCloud',
      iconKey: 'soundcloud',
      brandColor: '#FF5500',
      badgeBg: 'rgba(255, 85, 0, 0.12)',
      badgeBorder: 'rgba(255, 85, 0, 0.35)',
    },
  },
  {
    domains: ['gitlab.com'],
    platform: {
      platform: 'gitlab',
      label: 'GitLab',
      iconKey: 'gitlab',
      brandColor: '#FC6D26',
      badgeBg: 'rgba(252, 109, 38, 0.12)',
      badgeBorder: 'rgba(252, 109, 38, 0.35)',
    },
  },
  {
    domains: ['notion.so', 'notion.site'],
    platform: {
      platform: 'notion',
      label: 'Notion',
      iconKey: 'notion',
      brandColor: '#ffffff',
      badgeBg: 'rgba(255, 255, 255, 0.12)',
      badgeBorder: 'rgba(255, 255, 255, 0.35)',
    },
  },
  {
    domains: ['slack.com'],
    platform: {
      platform: 'slack',
      label: 'Slack',
      iconKey: 'slack',
      brandColor: '#ECB22E',
      badgeBg: 'rgba(236, 178, 46, 0.12)',
      badgeBorder: 'rgba(236, 178, 46, 0.35)',
    },
  },
  {
    domains: ['calendly.com', 'cal.com'],
    platform: {
      platform: 'calendar',
      label: 'Calendar / Booking',
      iconKey: 'calendar',
      brandColor: '#006BFF',
      badgeBg: 'rgba(0, 107, 255, 0.12)',
      badgeBorder: 'rgba(0, 107, 255, 0.35)',
    },
  },
  {
    domains: [
      'vercel.app',
      'netlify.app',
      'github.io',
      'pages.dev',
      'render.com',
      'surge.sh',
      'web.app',
      'firebaseapp.com',
    ],
    platform: {
      platform: 'portfolio',
      label: 'Interactive Portfolio',
      iconKey: 'briefcase',
      brandColor: '#6366F1', // Vibrant Indigo/Purple
      badgeBg: 'rgba(99, 102, 241, 0.14)',
      badgeBorder: 'rgba(99, 102, 241, 0.35)',
    },
  },
];

export const PORTFOLIO_PLATFORM: DetectedPlatform = {
  platform: 'portfolio',
  label: 'Interactive Portfolio',
  iconKey: 'briefcase',
  brandColor: '#6366F1',
  badgeBg: 'rgba(99, 102, 241, 0.14)',
  badgeBorder: 'rgba(99, 102, 241, 0.35)',
};

export const WEBSITE_PLATFORM: DetectedPlatform = {
  platform: 'website',
  label: 'Website',
  iconKey: 'globe',
  brandColor: '#06B6D4', // Vibrant Cyan
  badgeBg: 'rgba(6, 182, 212, 0.14)',
  badgeBorder: 'rgba(6, 182, 212, 0.35)',
};

/**
 * Extracts a normalized hostname from any URL string, handling:
 * - protocols (http, https)
 * - query params and hash fragments
 * - mailto: schemes
 * - raw domains (e.g. "github.com/myrepo")
 */
export function extractHostname(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Check email
  if (trimmed.startsWith('mailto:') || (trimmed.includes('@') && !trimmed.includes('/'))) {
    return 'mailto';
  }

  let sanitized = trimmed;
  if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    sanitized = `https://${sanitized}`;
  }

  try {
    const parsed = new URL(sanitized);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    // Fallback regex if URL constructor fails
    const match = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?([^/?#]+)/i);
    return match ? match[1].toLowerCase() : '';
  }
}

/**
 * Detects social media or web platform based on the destination URL domain.
 */
export function detectPlatformFromUrl(url?: string): DetectedPlatform | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Special case: mailto
  if (trimmed.startsWith('mailto:') || (trimmed.includes('@') && !trimmed.includes('/'))) {
    return {
      platform: 'mail',
      label: 'Email / Contact',
      iconKey: 'mail',
      brandColor: '#EA4335',
      badgeBg: 'rgba(234, 67, 53, 0.12)',
      badgeBorder: 'rgba(234, 67, 53, 0.35)',
    };
  }

  const hostname = extractHostname(trimmed);
  if (!hostname) return null;

  for (const rule of PLATFORM_RULES) {
    for (const domain of rule.domains) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return rule.platform;
      }
    }
  }

  return null;
}

/**
 * Resolves which icon and badge to use for a link:
 * - If the link explicitly has a custom non-default icon (not 'globe' and not empty),
 *   it respects that custom choice while still providing platform detection.
 * - If the link's icon is undefined, empty, or default ('globe'), it automatically
 *   detects the domain and provides the matching professional social icon.
 */
export function resolveLinkIcon(
  customIcon?: string,
  url?: string
): {
  iconKey: string;
  isAutoDetected: boolean;
  platform: DetectedPlatform | null;
} {
  const detected = detectPlatformFromUrl(url);

  // If custom icon is explicitly chosen and not the default 'globe', respect user customization
  const hasCustomIcon = Boolean(
    customIcon &&
    customIcon.trim() !== '' &&
    customIcon.trim() !== 'globe' &&
    customIcon.trim() !== 'auto'
  );

  // Determine platform detection with smart portfolio & website fallback
  let resolvedPlatform = detected;
  const isPortfolioMatch =
    customIcon === 'briefcase' ||
    customIcon === 'portfolio' ||
    (url && (url.toLowerCase().includes('portfolio') || url.toLowerCase().includes('vercel.app')));

  if (!resolvedPlatform && isPortfolioMatch) {
    resolvedPlatform = PORTFOLIO_PLATFORM;
  } else if (!resolvedPlatform && (url || customIcon)) {
    resolvedPlatform = WEBSITE_PLATFORM;
  }

  if (hasCustomIcon && customIcon) {
    return {
      iconKey: customIcon.trim().toLowerCase(),
      isAutoDetected: false,
      platform: resolvedPlatform,
    };
  }

  // If auto-detected from URL domain or portfolio
  if (resolvedPlatform) {
    return {
      iconKey: resolvedPlatform.iconKey,
      isAutoDetected: true,
      platform: resolvedPlatform,
    };
  }

  // Fallback to custom icon or default 'globe'
  return {
    iconKey: customIcon || 'globe',
    isAutoDetected: false,
    platform: WEBSITE_PLATFORM,
  };
}
