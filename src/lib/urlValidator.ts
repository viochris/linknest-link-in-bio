import { normalizeUrl } from './linkMetadata';

export interface UrlReachabilityResult {
  isReachable: boolean;
  isBroken: boolean;
  status?: number;
  statusText?: string;
  domain?: string;
  message: string;
  error?: string;
}

/**
 * Validates whether a destination URL is active and reachable via the LinkNest backend.
 * Returns reachability status and warning message if the link appears broken.
 */
export async function validateUrlReachability(rawUrl: string): Promise<UrlReachabilityResult> {
  const cleanUrl = normalizeUrl(rawUrl);

  if (!cleanUrl || !cleanUrl.includes('.')) {
    return {
      isReachable: false,
      isBroken: true,
      message: 'Please provide a valid destination URL (e.g., https://example.com)',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`/api/validate-url?url=${encodeURIComponent(cleanUrl)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: UrlReachabilityResult = await res.json();
      return data;
    }
  } catch (err: any) {
    console.warn('[validateUrlReachability] Backend call failed, using fallback check', err);
  }

  // Fallback heuristic if server route is unreachable
  try {
    const parsed = new URL(cleanUrl);
    if (!parsed.hostname.includes('.')) {
      return {
        isReachable: false,
        isBroken: true,
        message: 'Invalid domain syntax. Please check the URL format.',
      };
    }
    return {
      isReachable: true,
      isBroken: false,
      domain: parsed.hostname,
      message: 'URL syntax is valid (live probe unavailable).',
    };
  } catch {
    return {
      isReachable: false,
      isBroken: true,
      message: 'Malformed URL. Please include a valid domain name.',
    };
  }
}
