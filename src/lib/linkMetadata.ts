import { detectPlatformFromUrl, LinkPlatform } from './domainIcons';

export interface LinkMetadataResult {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  platform?: LinkPlatform | null;
}

/**
 * Normalizes input URL by trimming and prefixing https:// if scheme is missing.
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Extracts hostname safely from a URL string.
 */
export function extractHostname(rawUrl: string): string {
  try {
    const parsed = new URL(normalizeUrl(rawUrl));
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Fetches OpenGraph and page metadata (og:title, og:description, og:image, favicon)
 * from the URL via the LinkNest server API, with client fallback heuristics.
 */
export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadataResult> {
  const cleanUrl = normalizeUrl(rawUrl);
  const domain = extractHostname(cleanUrl);
  const platform = detectPlatformFromUrl(cleanUrl);

  const fallbackResult: LinkMetadataResult = {
    url: cleanUrl,
    domain,
    title: platform ? `${platform.label}` : domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : '',
    description: '',
    image: '',
    siteName: platform?.label || domain,
    favicon: domain ? `https://${domain}/favicon.ico` : '',
    platform,
  };

  if (!cleanUrl || !cleanUrl.includes('.')) {
    return fallbackResult;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`/api/metadata?url=${encodeURIComponent(cleanUrl)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        url: cleanUrl,
        domain: data.domain || domain,
        title: data.title || fallbackResult.title,
        description: data.description || '',
        image: data.image || '',
        siteName: data.siteName || platform?.label || domain,
        favicon: data.favicon || fallbackResult.favicon,
        platform,
      };
    }
  } catch (err) {
    // If server fails or offline, return fallback heuristics
    console.warn('[fetchLinkMetadata] Using client fallback for', cleanUrl, err);
  }

  return fallbackResult;
}
