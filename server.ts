import express from 'express';
import path from 'path';
import fs from 'fs';
import React from 'react';
import satori from 'satori';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Server-Side Supabase Client for Metadata Injection
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('YOUR_') &&
  supabaseKey.length > 20
);

const serverSupabase: SupabaseClient | null = isSupabaseConfigured && supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface ServerProfileMeta {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  accentColor: string;
  linksCount: number;
  showDiscoverTab?: boolean;
}

const DEFAULT_SILVIO_PROFILE: ServerProfileMeta = {
  username: 'silvio',
  displayName: 'Silvio Christian Joe',
  bio: 'AI Engineer & Full-Stack Developer 🚀\nCheck out my portfolio, Kaggle models, and open-source projects below.',
  avatarUrl: '/avatar-silvio.png',
  accentColor: '#818cf8',
  linksCount: 9,
  showDiscoverTab: true,
};

const DEFAULT_DEMO_PROFILE: ServerProfileMeta = {
  username: 'demo',
  displayName: 'Alex Rivera',
  bio: 'Creative Technologist & UI Engineer ✨\nExploring AI-powered design systems, WebGL interactions, and modern web products.',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  accentColor: '#818cf8',
  linksCount: 5,
  showDiscoverTab: true,
};

async function getProfileForRoute(rawUsername?: string): Promise<ServerProfileMeta> {
  const username = (rawUsername || 'silvio').toLowerCase().trim();

  if (serverSupabase) {
    try {
      const { data: profile } = await serverSupabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, theme')
        .eq('username', username)
        .maybeSingle();

      if (profile) {
        let linksCount = 0;
        try {
          const { count } = await serverSupabase
            .from('links')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', profile.id)
            .eq('is_active', true);
          if (typeof count === 'number') linksCount = count;
        } catch {
          // ignore
        }

        return {
          username: profile.username || username,
          displayName: profile.display_name || profile.username || username,
          bio: profile.bio || '',
          avatarUrl: profile.avatar_url || '/avatar-silvio.png',
          accentColor: profile.theme?.accent_color || '#6366f1',
          linksCount,
          showDiscoverTab: profile.theme?.show_discover_tab !== false,
        };
      }
    } catch (err) {
      console.warn('Could not query Supabase profile on server:', err);
    }
  }

  if (username === 'silvio') {
    return DEFAULT_SILVIO_PROFILE;
  }

  if (username === 'demo') {
    return DEFAULT_DEMO_PROFILE;
  }

  return {
    username,
    displayName: username,
    bio: `Explore @${username}'s official links, social channels, and projects curated on LinkNest.`,
    avatarUrl: '/avatar-silvio.png',
    accentColor: '#6366f1',
    linksCount: 0,
    showDiscoverTab: true,
  };
}

function getRequestOrigin(req: express.Request): string {
  if (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader?.split(',')[0]) || req.protocol || 'http';
  const hostHeader = req.headers['x-forwarded-host'];
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader?.split(',')[0]) || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function buildOgUrl(origin: string, profile: ServerProfileMeta): string {
  const searchParams = new URLSearchParams();
  searchParams.set('username', profile.username || 'user');
  if (profile.displayName) searchParams.set('name', profile.displayName);
  if (profile.bio) searchParams.set('bio', profile.bio.replace(/\n/g, ' ').slice(0, 160));
  if (profile.accentColor) searchParams.set('accent', profile.accentColor);
  if (profile.linksCount !== undefined) searchParams.set('links', String(profile.linksCount));
  if (profile.avatarUrl) searchParams.set('avatar', profile.avatarUrl);

  return `${origin}/api/og?${searchParams.toString()}`;
}

function injectProfileMeta(html: string, origin: string, profile: ServerProfileMeta): string {
  const cleanName = profile.displayName || profile.username;
  const pageTitle = `${cleanName} (@${profile.username}) - LinkNest`;
  const rawBio = profile.bio ? profile.bio.replace(/\n/g, ' ').trim() : '';
  const description = rawBio
    ? `${rawBio} - Check out my verified links, projects, and social profiles on LinkNest.`
    : `Explore ${cleanName}'s official links, social channels, and projects curated on LinkNest.`;

  const ogImageUrl = buildOgUrl(origin, profile);
  const canonicalUrl = `${origin}/${profile.username}`;

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let res = html;

  // 1. <title>
  if (/<title>[\s\S]*?<\/title>/i.test(res)) {
    res = res.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(pageTitle)}</title>`);
  } else {
    res = res.replace('</head>', `  <title>${escape(pageTitle)}</title>\n</head>`);
  }

  // 2. <meta name="description" ...>
  if (/<meta\s+name=["']description["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escape(description)}" />`);
  } else {
    res = res.replace('</head>', `  <meta name="description" content="${escape(description)}" />\n</head>`);
  }

  // 3. <meta property="og:title" ...>
  if (/<meta\s+property=["']og:title["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escape(pageTitle)}" />`);
  } else {
    res = res.replace('</head>', `  <meta property="og:title" content="${escape(pageTitle)}" />\n</head>`);
  }

  // 4. <meta property="og:description" ...>
  if (/<meta\s+property=["']og:description["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escape(description)}" />`);
  } else {
    res = res.replace('</head>', `  <meta property="og:description" content="${escape(description)}" />\n</head>`);
  }

  // 5. <meta property="og:image" ...>
  if (/<meta\s+property=["']og:image["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${escape(ogImageUrl)}" />`);
  } else {
    res = res.replace('</head>', `  <meta property="og:image" content="${escape(ogImageUrl)}" />\n</head>`);
  }

  // 6. <meta property="og:url" ...>
  if (/<meta\s+property=["']og:url["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${escape(canonicalUrl)}" />`);
  } else {
    res = res.replace('</head>', `  <meta property="og:url" content="${escape(canonicalUrl)}" />\n</head>`);
  }

  // 7. Twitter Card tags
  if (/<meta\s+name=["']twitter:title["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escape(pageTitle)}" />`);
  } else {
    res = res.replace('</head>', `  <meta name="twitter:title" content="${escape(pageTitle)}" />\n</head>`);
  }

  if (/<meta\s+name=["']twitter:description["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escape(description)}" />`);
  } else {
    res = res.replace('</head>', `  <meta name="twitter:description" content="${escape(description)}" />\n</head>`);
  }

  if (/<meta\s+name=["']twitter:image["'][^>]*>/i.test(res)) {
    res = res.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${escape(ogImageUrl)}" />`);
  } else {
    res = res.replace('</head>', `  <meta name="twitter:image" content="${escape(ogImageUrl)}" />\n</head>`);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Font loading for Satori OG Image Generation
// ---------------------------------------------------------------------------
let cachedBoldFont: Buffer | null = null;
let cachedRegularFont: Buffer | null = null;

function loadFonts() {
  const boldCandidates = [
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/opentype/urw-base35/NimbusMonoPS-Bold.otf',
    '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf',
  ];

  const regCandidates = [
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/opentype/urw-base35/NimbusMonoPS-Regular.otf',
    '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf',
  ];

  for (const p of boldCandidates) {
    if (fs.existsSync(p)) {
      try {
        cachedBoldFont = fs.readFileSync(p);
        break;
      } catch {
        // continue
      }
    }
  }

  for (const p of regCandidates) {
    if (fs.existsSync(p)) {
      try {
        cachedRegularFont = fs.readFileSync(p);
        break;
      } catch {
        // continue
      }
    }
  }

  if (!cachedRegularFont && cachedBoldFont) {
    cachedRegularFont = cachedBoldFont;
  }
}

loadFonts();

// ---------------------------------------------------------------------------
// Fallback Vector SVG Generator
// ---------------------------------------------------------------------------
function generateFallbackSvg(params: {
  username: string;
  name: string;
  bio: string;
  accent: string;
  linksCount: number;
}): string {
  const escape = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const name = escape(params.name);
  const username = escape(params.username);
  const accent = params.accent || '#6366f1';
  const bio = escape(params.bio || 'Link in bio • Curated links and projects');
  const initial = escape((name[0] || username[0] || 'L').toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#030509" />
    </linearGradient>
    <radialGradient id="glow" cx="88%" cy="12%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect x="24" y="24" width="1152" height="582" rx="28" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
  
  <g transform="translate(64, 56)">
    <rect width="44" height="44" rx="12" fill="${accent}" />
    <text x="22" y="29" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#fff" text-anchor="middle">LN</text>
    <text x="58" y="32" font-family="-apple-system, sans-serif" font-size="28" font-weight="800" fill="#f8fafc">LinkNest</text>

    <g transform="translate(0, 110)">
      <circle cx="65" cy="65" r="65" fill="#0f172a" stroke="${accent}" stroke-width="4" />
      <text x="65" y="85" font-family="-apple-system, sans-serif" font-size="54" font-weight="800" fill="${accent}" text-anchor="middle">${initial}</text>
      
      <g transform="translate(160, 10)">
        <text x="0" y="44" font-family="-apple-system, sans-serif" font-size="46" font-weight="800" fill="#fff">${name}</text>
        <rect x="0" y="62" width="160" height="32" rx="8" fill="${accent}20" stroke="${accent}40" />
        <text x="12" y="84" font-family="-apple-system, sans-serif" font-size="18" font-weight="700" fill="#c7d2fe">@${username}</text>
        <text x="0" y="140" font-family="-apple-system, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">${bio}</text>
      </g>
    </g>

    <line x1="0" y1="450" x2="1072" y2="450" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
    <text x="0" y="495" font-family="-apple-system, sans-serif" font-size="22" font-weight="600" fill="#64748b">linknest.app/@${username}</text>
    <text x="1072" y="495" font-family="-apple-system, sans-serif" font-size="18" font-weight="700" fill="#a5b4fc" text-anchor="end">${params.linksCount} Active Links &amp; Projects</text>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Server-Side Gemini AI Client & URL Metadata Scraper
// ---------------------------------------------------------------------------
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

interface ScrapedMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  domain?: string;
  favicon?: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

async function fetchUrlMetadata(rawUrl: string): Promise<ScrapedMetadata> {
  const result: ScrapedMetadata = {};
  if (!rawUrl || typeof rawUrl !== 'string') return result;

  try {
    let cleanUrl = rawUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const parsed = new URL(cleanUrl);
    result.domain = parsed.hostname;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 LinkNestBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
        const text = (await res.text()).slice(0, 100000);

        // 1. Title: Prefer og:title / twitter:title, then <title>
        const ogTitleMatch =
          text.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
          text.match(/<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i);

        if (ogTitleMatch && ogTitleMatch[1]) {
          result.title = decodeHtmlEntities(ogTitleMatch[1].trim());
        } else {
          const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            result.title = decodeHtmlEntities(titleMatch[1].trim());
          }
        }

        // 2. Description: Prefer og:description / twitter:description, then meta description
        const descMatch =
          text.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
          text.match(/<meta\s+[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i) ||
          text.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);

        if (descMatch && descMatch[1]) {
          result.description = decodeHtmlEntities(descMatch[1].trim());
        }

        // 3. Image: og:image, twitter:image, image_src
        const imgMatch =
          text.match(/<meta\s+[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i) ||
          text.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
          text.match(/<meta\s+[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i) ||
          text.match(/<meta\s+[^>]*name=["']twitter:image:src["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<link\s+[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);

        if (imgMatch && imgMatch[1]) {
          const rawImg = imgMatch[1].trim();
          try {
            result.image = new URL(rawImg, cleanUrl).href;
          } catch {
            result.image = rawImg;
          }
        }

        // 4. Site Name: og:site_name
        const siteNameMatch =
          text.match(/<meta\s+[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) ||
          text.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
        if (siteNameMatch && siteNameMatch[1]) {
          result.siteName = decodeHtmlEntities(siteNameMatch[1].trim());
        }

        // 5. Favicon
        const faviconMatch =
          text.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i) ||
          text.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i);
        if (faviconMatch && faviconMatch[1]) {
          try {
            result.favicon = new URL(faviconMatch[1].trim(), cleanUrl).href;
          } catch {}
        }
      }
    }
  } catch {
    // Non-fatal if fetch fails or times out
  }

  // Fallback favicon
  if (!result.favicon && result.domain) {
    result.favicon = `https://${result.domain}/favicon.ico`;
  }

  return result;
}

function generateFallbackLinkDescription(
  title: string,
  url: string,
  metadata: ScrapedMetadata,
  tone: string = 'professional'
) {
  const domain = (metadata.domain || '').toLowerCase();
  const rawTitle = title || metadata.title || 'Featured Link';

  let primary = '';
  let alt1 = '';
  let alt2 = '';
  let icon = 'globe';
  let category = 'Work';

  if (domain.includes('github.com')) {
    primary = 'Explore open-source repositories, developer tools, and code architecture.';
    alt1 = 'Production-ready source code repositories and developer tools.';
    alt2 = 'Inspect active code contributions and open-source software libraries.';
    icon = 'github';
    category = 'Projects';
  } else if (domain.includes('linkedin.com')) {
    primary = 'Connect for professional career updates, industry insights, and networking.';
    alt1 = 'Professional work experience, enterprise projects, and technical network.';
    alt2 = 'Follow career milestones and connect directly on LinkedIn.';
    icon = 'linkedin';
    category = 'Social';
  } else if (domain.includes('kaggle.com')) {
    primary = 'Browse competitive machine learning models, notebooks, and datasets.';
    alt1 = 'Data science benchmarks, predictive models, and Kaggle kernels.';
    alt2 = 'Explore end-to-end ML experiments and algorithm competitions.';
    icon = 'kaggle';
    category = 'Projects';
  } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
    primary = 'Follow for real-time tech updates, developer commentary, and discussions.';
    alt1 = 'Daily insights, AI breakthroughs, and engineering thoughts.';
    alt2 = 'Join the conversation and keep up with latest build updates.';
    icon = 'x';
    category = 'Social';
  } else if (domain.includes('instagram.com')) {
    primary = 'Daily developer behind-the-scenes, engineering lifestyle, and visual updates.';
    alt1 = 'Behind the screen: daily coding, workstation setup, and tech stories.';
    alt2 = 'Visual snippets of tech builds, workspace, and community life.';
    icon = 'instagram';
    category = 'Social';
  } else if (domain.includes('medium.com') || domain.includes('substack.com') || domain.includes('dev.to')) {
    primary = 'Read in-depth technical guides, engineering articles, and case studies.';
    alt1 = 'Deep dives on artificial intelligence, software design, and architecture.';
    alt2 = 'Tutorials, system benchmarks, and practical full-stack insights.';
    icon = 'medium';
    category = 'Work';
  } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    primary = 'Watch technical walkthroughs, project demos, and software tutorials.';
    alt1 = 'Video deep-dives, live coding sessions, and architecture breakdowns.';
    alt2 = 'Comprehensive video tutorials on AI, full-stack systems, and design.';
    icon = 'youtube';
    category = 'Projects';
  } else if (rawTitle.toLowerCase().includes('portfolio') || domain.includes('vercel.app')) {
    primary = 'Interactive portfolio showcasing production AI systems and full-stack apps.';
    alt1 = 'Featured client case studies, live demo deployments, and interactive work.';
    alt2 = 'Explore engineered web applications, performance metrics, and projects.';
    icon = 'briefcase';
    category = 'Work';
  } else if (metadata.description && metadata.description.length > 15) {
    primary = metadata.description.length > 95
      ? metadata.description.slice(0, 92) + '...'
      : metadata.description;
    alt1 = `Discover ${rawTitle} with verified resources and insights.`;
    alt2 = `Direct access to ${rawTitle} curated on LinkNest.`;
    icon = 'external-link';
    category = 'Resources';
  } else {
    primary = `Explore ${rawTitle} and discover verified resources and updates.`;
    alt1 = `Direct link to ${rawTitle} on ${domain || 'the web'}.`;
    alt2 = `Essential updates and resources from ${rawTitle}.`;
    icon = 'globe';
    category = 'Resources';
  }

  return {
    description: primary,
    alternatives: [
      { tone: 'Punchy & Direct', text: alt1 },
      { tone: 'Value-Driven', text: alt2 },
      { tone: 'Engaging & Modern', text: primary },
    ],
    suggestedIcon: icon,
    suggestedCategory: category,
  };
}

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    features: ['open-graph-satori', 'dynamic-meta', 'react-helmet', 'gemini-link-optimizer', 'google-search-discover', 'link-preview-metadata'],
    timestamp: new Date().toISOString(),
  });
});

// URL Metadata Scraping Endpoint (OpenGraph, Twitter card, Title, Image, Favicon)
app.get(['/api/metadata', '/api/links/preview-metadata'], async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'url query parameter is required.' });
  }

  try {
    const metadata = await fetchUrlMetadata(rawUrl);
    return res.json({
      success: true,
      url: rawUrl,
      domain: metadata.domain || '',
      title: metadata.title || '',
      description: metadata.description || '',
      image: metadata.image || '',
      siteName: metadata.siteName || '',
      favicon: metadata.favicon || '',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch metadata from URL.',
      url: rawUrl,
    });
  }
});

app.post(['/api/metadata', '/api/links/preview-metadata'], async (req, res) => {
  const { url = '' } = req.body || {};
  const rawUrl = String(url).trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'url parameter is required.' });
  }

  try {
    const metadata = await fetchUrlMetadata(rawUrl);
    return res.json({
      success: true,
      url: rawUrl,
      domain: metadata.domain || '',
      title: metadata.title || '',
      description: metadata.description || '',
      image: metadata.image || '',
      siteName: metadata.siteName || '',
      favicon: metadata.favicon || '',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch metadata from URL.',
      url: rawUrl,
    });
  }
});

// URL Reachability & Active Status Validation Endpoint
async function checkUrlReachability(rawUrl: string): Promise<{
  isReachable: boolean;
  isBroken: boolean;
  status?: number;
  statusText?: string;
  domain?: string;
  error?: string;
  message: string;
}> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isReachable: false,
      isBroken: true,
      message: 'Destination URL is required.',
    };
  }

  let cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  try {
    const parsed = new URL(cleanUrl);
    const domain = parsed.hostname;

    if (!domain || !domain.includes('.')) {
      return {
        isReachable: false,
        isBroken: true,
        domain,
        message: 'Invalid domain name format. Please enter a valid URL (e.g., https://example.com).',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    let response: Response;
    try {
      // First try HEAD method for fast reachability verification
      response = await fetch(cleanUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 LinkNestValidator/1.0',
          'Accept': '*/*',
        },
        redirect: 'follow',
      });

      // If HEAD is not allowed (HTTP 405 Method Not Allowed), retry with GET
      if (response.status === 405 || response.status === 501) {
        response = await fetch(cleanUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 LinkNestValidator/1.0',
            'Accept': 'text/html,*/*',
          },
          redirect: 'follow',
        });
      }
    } finally {
      clearTimeout(timeout);
    }

    const status = response.status;

    // 2xx Success & 3xx Redirect: active & reachable
    if (status >= 200 && status < 400) {
      return {
        isReachable: true,
        isBroken: false,
        status,
        statusText: response.statusText,
        domain,
        message: `Link is active and reachable (HTTP ${status} OK).`,
      };
    }

    // 401 Unauthorized / 403 Forbidden / 429 Too Many Requests:
    // Destination server is alive and functioning, but restricts bot scraping or requires user login
    if (status === 401 || status === 403 || status === 429) {
      return {
        isReachable: true,
        isBroken: false,
        status,
        statusText: response.statusText,
        domain,
        message: `Server is online (HTTP ${status}), but destination restricts automated requests or requires login.`,
      };
    }

    // 404 Not Found / 410 Gone: conclusively broken
    if (status === 404 || status === 410) {
      return {
        isReachable: false,
        isBroken: true,
        status,
        statusText: response.statusText,
        domain,
        message: `Page not found (HTTP ${status}). This URL does not exist or has been deleted.`,
      };
    }

    // 5xx Internal Server Error: destination server is broken/down
    if (status >= 500) {
      return {
        isReachable: false,
        isBroken: true,
        status,
        statusText: response.statusText,
        domain,
        message: `Target server reported an error (HTTP ${status} ${response.statusText || 'Server Error'}).`,
      };
    }

    return {
      isReachable: false,
      isBroken: true,
      status,
      domain,
      message: `Destination returned unexpected status HTTP ${status}.`,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Connection failed';
    const isTimeout = err?.name === 'AbortError' || errorMsg.includes('aborted');

    return {
      isReachable: false,
      isBroken: true,
      error: errorMsg,
      message: isTimeout
        ? 'Connection timed out after 4.5s. Destination server is unresponsive.'
        : `Could not connect to host. Domain may not exist, or DNS/network resolution failed.`,
    };
  }
}

app.get(['/api/validate-url', '/api/links/validate-url'], async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  const validation = await checkUrlReachability(rawUrl);
  return res.json(validation);
});

app.post(['/api/validate-url', '/api/links/validate-url'], async (req, res) => {
  const { url = '' } = req.body || {};
  const validation = await checkUrlReachability(String(url).trim());
  return res.json(validation);
});

// Gemini Link Description Generator Endpoint (Server-Side)
app.post(['/api/generate-description', '/api/links/generate-description'], async (req, res) => {
  const { url = '', title = '', category = '', tone = 'professional' } = req.body || {};

  if (!url && !title) {
    return res.status(400).json({
      error: 'Please provide at least a URL or link Title to generate a description.',
    });
  }

  // 1. Scrape metadata from URL
  const metadata = await fetchUrlMetadata(url);

  // 2. Check if Gemini Client is available
  const ai = getGeminiClient();

  if (!ai) {
    // Return high-quality heuristic fallback with helpful message
    const fallback = generateFallbackLinkDescription(title, url, metadata, tone);
    return res.json({
      success: true,
      description: fallback.description,
      alternatives: fallback.alternatives,
      suggestedIcon: fallback.suggestedIcon,
      suggestedCategory: fallback.suggestedCategory,
      metadata: {
        domain: metadata.domain,
        pageTitle: metadata.title,
        metaDescription: metadata.description,
      },
      isFallback: true,
      message: 'Generated using link metadata. Add GEMINI_API_KEY in Settings > Secrets to unlock live Gemini-powered copywriting.',
      model: 'heuristic-metadata-v1',
    });
  }

  // 3. Call Gemini (gemini-2.5-flash is fast & highly reliable; fallback to gemini-3.8-flash)
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const prompt = `You are an elite link copywriter for digital creator and professional link-in-bio profiles (LinkNest).
Analyze the following link and generate a concise, compelling, professional description optimized for high click-through rates.

Link Title: "${title || 'Untitled Link'}"
Destination URL: "${url || 'Unknown'}"
Domain: "${metadata.domain || ''}"
Webpage Title (from target page metadata): "${metadata.title || ''}"
Webpage Meta Description (from target page metadata): "${metadata.description || ''}"
Category Context: "${category || 'General'}"
Requested Tone: "${tone}"

Guidelines:
1. Primary Description: Write an exceptional, engaging, and professional 1-sentence description (around 10-18 words, STRICT MAXIMUM 100 characters). Clearly articulate what the visitor will experience, learn, or access.
2. Alternatives: Provide 3 diverse variations in different tones:
   - "Punchy & Direct" (ultra-concise, action verb first)
   - "Value-Driven" (focuses on tangible benefit to the visitor)
   - "Engaging & Creative" (modern, creator-friendly tone)
3. Suggested Icon: Recommend the best-matching icon ID from this list: [globe, github, linkedin, twitter, instagram, youtube, medium, mail, briefcase, code, terminal, book, file-text, star, external-link, sparkler, zap]
4. Suggested Category: Recommend one category from: [Work, Projects, Social, Resources, Personal]`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert copywriter specializing in link-in-bio profiles, portfolio links, and personal branding. You produce concise, high-impact, professional copy strictly formatted in JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: 'The primary optimized description (strict maximum 100 characters).',
              },
              alternatives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tone: { type: Type.STRING, description: 'The tone style name' },
                    text: { type: Type.STRING, description: 'The alternative description text' },
                  },
                  required: ['tone', 'text'],
                },
                description: '3 alternative variations in different tones.',
              },
              suggestedIcon: {
                type: Type.STRING,
                description: 'Recommended icon name from the allowed list.',
              },
              suggestedCategory: {
                type: Type.STRING,
                description: 'Recommended category name.',
              },
            },
            required: ['description', 'alternatives'],
          },
        },
      });

      const text = response.text;
      const parsed = JSON.parse(text || '{}');

      return res.json({
        success: true,
        description: parsed.description || title,
        alternatives: parsed.alternatives || [],
        suggestedIcon: parsed.suggestedIcon || 'globe',
        suggestedCategory: parsed.suggestedCategory || category || 'Work',
        metadata: {
          domain: metadata.domain,
          pageTitle: metadata.title,
          metaDescription: metadata.description,
        },
        isFallback: false,
        model,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} attempt failed:`, err?.message || err);
      // Continue to next model in loop
    }
  }

  // If both models fail, fallback gracefully to domain heuristics
  console.error('All Gemini model attempts failed, using domain heuristic fallback:', lastError);
  const fallback = generateFallbackLinkDescription(title, url, metadata, tone);
  return res.json({
    success: true,
    description: fallback.description,
    alternatives: fallback.alternatives,
    suggestedIcon: fallback.suggestedIcon,
    suggestedCategory: fallback.suggestedCategory,
    metadata: {
      domain: metadata.domain,
      pageTitle: metadata.title,
      metaDescription: metadata.description,
    },
    isFallback: true,
    message: 'Generated using link metadata heuristics.',
    errorDetails: lastError?.message,
    model: 'heuristic-metadata-fallback',
  });
});

// ---------------------------------------------------------------------------
// Google Search Grounding Discover Endpoint (Server-Side)
// ---------------------------------------------------------------------------
interface DiscoverItem {
  id: string;
  title: string;
  source: string;
  snippet: string;
  url: string;
}

interface DiscoverCacheEntry {
  timestamp: number;
  items: DiscoverItem[];
  topics: string[];
}

// 12-hour server-side cache per profile to eliminate redundant queries & API costs
const DISCOVER_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const discoverCache = new Map<string, DiscoverCacheEntry>();
// Coalesce concurrent requests during cold cache / traffic spikes so only 1 Google Search runs
const discoverInFlight = new Map<string, Promise<{ items: DiscoverItem[]; topics: string[] }>>();

function extractSanitizedBioKeywords(bio?: string): string[] {
  if (!bio || typeof bio !== 'string') {
    return ['Artificial Intelligence', 'Software Engineering', 'Open Source'];
  }

  // 1. Strip URLs and email addresses
  let cleaned = bio
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');

  // 2. Strip prompt injection triggers and control directives
  cleaned = cleaned.replace(
    /\b(ignore|previous|instructions|system|prompt|assistant|dan|jailbreak|eval|execute|sudo|format|template)\b/gi,
    ''
  );

  // 3. Remove emojis and unusual symbols
  cleaned = cleaned.replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2700}-\u{27BF}]/gu, ' ');

  // 4. Treat &, +, commas, pipes, bullets, slashes, and newlines as delimiters
  const segments = cleaned.split(/[\n,\|\/•&\+]+/);
  const stopWords = new Set([
    'and', 'the', 'with', 'for', 'from', 'about', 'check', 'out', 'my', 'me',
    'our', 'your', 'click', 'here', 'welcome', 'official', 'page', 'portfolio',
    'links', 'social', 'contact', 'dm', 'follow', 'view', 'like', 'subscribe',
    'models', 'projects', 'stuff', 'things', 'below', 'above', 'here'
  ]);

  const candidates: string[] = [];
  for (const seg of segments) {
    const rawWords = seg.replace(/[^a-zA-Z0-9\s\-]/g, ' ').trim().split(/\s+/);
    const words = rawWords.filter((w) => w.length > 1 && !stopWords.has(w.toLowerCase()));
    if (words.length > 0 && words.length <= 3) {
      const phrase = words.join(' ').trim();
      if (
        phrase.length >= 2 &&
        phrase.length <= 32 &&
        !candidates.some((c) => c.toLowerCase() === phrase.toLowerCase())
      ) {
        candidates.push(phrase);
      }
    }
  }

  const selected = candidates.slice(0, 4);
  return selected.length > 0 ? selected : ['Artificial Intelligence', 'Software Engineering', 'Open Source'];
}

function sanitizePlainString(str: any, maxLen = 200): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // strip any HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // strip control characters
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // strip markdown link syntax
    .replace(/[*_~`#]/g, '') // strip markdown markers
    .trim()
    .slice(0, maxLen);
}

function isValidHttpUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function queryGoogleSearchGrounding(
  topics: string[],
  username: string
): Promise<DiscoverItem[]> {
  const ai = getGeminiClient();
  if (!ai) {
    return [];
  }

  // Cap sanitized query string strictly to alphanumeric, hyphens, and spaces under 60 chars
  const safeQuery = topics.join(' ').replace(/[^a-zA-Z0-9\s\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!safeQuery) return [];

  const prompt = `Find 3 to 4 currently trending, high-quality news articles, tutorials, or open-source resources related to: "${safeQuery}".
Format each item strictly with this structure:
---
TITLE: <concise title without markup or quotes>
SOURCE: <name of website or publication>
SNIPPET: <1-2 sentence factual summary under 140 characters>
URL: <direct or web destination URL>
---`;

  // Timeout guard (25 seconds) to give Google Search grounding ample time
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        abortSignal: controller.signal,
      },
    });

    clearTimeout(timeoutId);

    const rawText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const items: DiscoverItem[] = [];
    const blocks = rawText
      .split('---')
      .map((b) => b.trim())
      .filter((b) => /TITLE:/i.test(b));

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const titleMatch = block.match(/TITLE:\s*([^\n\r]+)/i);
      const sourceMatch = block.match(/SOURCE:\s*([^\n\r]+)/i);
      const snippetMatch = block.match(/SNIPPET:\s*([\s\S]*?)(?=\n\s*URL:|$)/i);
      const urlMatch = block.match(/URL:\s*(https?:\/\/[^\s\n\r\)]+)/i);

      let title = titleMatch ? sanitizePlainString(titleMatch[1], 100) : '';
      let source = sourceMatch ? sanitizePlainString(sourceMatch[1], 50) : '';
      let snippet = snippetMatch
        ? sanitizePlainString(snippetMatch[1].replace(/\n+/g, ' '), 220)
        : '';
      let url = urlMatch ? urlMatch[1].trim() : '';

      // Match grounding chunks if URL is missing or redirect
      if (!isValidHttpUrl(url) && groundingChunks[i]?.web?.uri) {
        url = groundingChunks[i].web.uri;
        if (!source && groundingChunks[i].web.title) {
          source = sanitizePlainString(groundingChunks[i].web.title, 50);
        }
      }

      if (!isValidHttpUrl(url)) {
        const altChunk = groundingChunks.find((c) => c.web?.uri && isValidHttpUrl(c.web.uri));
        if (altChunk?.web?.uri) {
          url = altChunk.web.uri;
          if (!source && altChunk.web.title) {
            source = sanitizePlainString(altChunk.web.title, 50);
          }
        }
      }

      if (title && isValidHttpUrl(url)) {
        items.push({
          id: `disc-${username}-${i}-${Date.now()}`,
          title,
          source: source || 'Web Resource',
          snippet: snippet || 'Trending resource curated via Google Search.',
          url,
        });
      }

      if (items.length >= 4) break;
    }

    // Fallback: If blocks parsing didn't find items but grounding chunks exist
    if (items.length === 0 && groundingChunks.length > 0) {
      groundingChunks.slice(0, 4).forEach((chunk, idx) => {
        if (chunk.web?.uri && isValidHttpUrl(chunk.web.uri)) {
          items.push({
            id: `disc-${username}-chunk-${idx}-${Date.now()}`,
            title: sanitizePlainString(chunk.web.title || `Trending Resource in ${topics[0] || 'Tech'}`, 100),
            source: sanitizePlainString(new URL(chunk.web.uri).hostname.replace(/^www\./, ''), 50),
            snippet: `Trending article and resource curated via Google Search based on ${topics.slice(0, 2).join(' & ')}.`,
            url: chunk.web.uri,
          });
        }
      });
    }

    return items;
  } catch (err: any) {
    console.warn(`[Discover] Grounding search warning for @${username}:`, err.message || err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// Curated pool of high-quality trending resources used when live search grounding needs fallback
const CURATED_DISCOVER_RESOURCES: DiscoverItem[] = [
  {
    id: 'curated-ai-01',
    title: 'Hugging Face Open LLM Leaderboard & Benchmarks',
    source: 'Hugging Face',
    snippet: 'Tracking, ranking, and evaluating open-source Large Language Models and multimodal reasoning agents.',
    url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
  },
  {
    id: 'curated-ai-02',
    title: 'Google DeepMind Research & Gemini Architecture Breakthroughs',
    source: 'Google DeepMind',
    snippet: 'Exploring foundational intelligence, multimodality advancements, and frontier AI reasoning benchmarks.',
    url: 'https://deepmind.google/discover/blog/',
  },
  {
    id: 'curated-web-01',
    title: 'GitHub Trending: Most Starred Open-Source Repositories',
    source: 'GitHub',
    snippet: 'Discover the codebases, developer tools, and libraries capturing the global developer community this week.',
    url: 'https://github.com/trending',
  },
  {
    id: 'curated-web-02',
    title: 'Modern Web Standards & Cross-Browser Baseline',
    source: 'Web.dev',
    snippet: 'Comprehensive guide to modern cross-browser CSS container queries, subgrid, and performance best practices.',
    url: 'https://web.dev/explore/baseline',
  },
  {
    id: 'curated-tech-01',
    title: 'Hacker News: Top Software Engineering & Tech Discussions',
    source: 'Y Combinator',
    snippet: 'Curated tech industry news, startup engineering post-mortems, and developer community insights.',
    url: 'https://news.ycombinator.com',
  },
  {
    id: 'curated-tech-02',
    title: 'Kaggle Machine Learning Competitions & Open Benchmarks',
    source: 'Kaggle',
    snippet: 'Explore competitive data science benchmarks, exploratory notebooks, and open model weights.',
    url: 'https://www.kaggle.com/competitions',
  },
  {
    id: 'curated-ui-01',
    title: 'Modern UI Components & Fluid Interaction Patterns',
    source: 'Tailwind Labs',
    snippet: 'Production-ready responsive layouts, fluid typography, and accessible micro-interaction design patterns.',
    url: 'https://tailwindcss.com/blog',
  },
];

app.get('/api/discover', async (req, res) => {
  const username = String(req.query.username || 'silvio').toLowerCase().trim();
  const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';

  try {
    // 1. Fetch profile metadata to verify status, bio, and owner settings
    const profile = await getProfileForRoute(username);

    // 2. Check if the profile owner disabled the Discover tab
    if (profile.showDiscoverTab === false) {
      return res.json({
        success: true,
        enabled: false,
        items: [],
        topics: [],
        message: 'Discover tab is disabled by the profile owner in settings.',
      });
    }

    // 3. Purge cache on forced refresh request
    if (forceRefresh) {
      discoverCache.delete(username);
      discoverInFlight.delete(username);
    }

    // 4. Check server-side cache (12-hour TTL) unless force refreshing
    const cached = discoverCache.get(username);
    const now = Date.now();
    if (!forceRefresh && cached && now - cached.timestamp < DISCOVER_CACHE_TTL_MS) {
      return res.json({
        success: true,
        enabled: true,
        items: cached.items,
        topics: cached.topics,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
        expiresAt: new Date(cached.timestamp + DISCOVER_CACHE_TTL_MS).toISOString(),
      });
    }

    // 5. Rate-limit & coalesce concurrent in-flight requests per profile
    if (!forceRefresh && discoverInFlight.has(username)) {
      const existingResult = await discoverInFlight.get(username)!;
      return res.json({
        success: true,
        enabled: true,
        items: existingResult.items,
        topics: existingResult.topics,
        cached: false,
      });
    }

    // 6. Extract sanitized keywords from the owner's bio
    const topics = extractSanitizedBioKeywords(profile.bio);

    // 7. Launch ground search as coalesced promise
    const searchPromise = (async () => {
      try {
        let items = await queryGoogleSearchGrounding(topics, username);
        // If grounding search returned 0 items (e.g. offline, rate-limited, or no API key),
        // supply curated real trending tech resources, shuffled so refresh provides fresh items!
        if (items.length === 0) {
          const shuffled = [...CURATED_DISCOVER_RESOURCES].sort(() => 0.5 - Math.random());
          items = shuffled.slice(0, 4).map((c, i) => ({
            ...c,
            id: `disc-${username}-curated-${i}-${Date.now()}`,
          }));
        }

        if (items.length > 0) {
          discoverCache.set(username, {
            timestamp: Date.now(),
            items,
            topics,
          });
        }
        return { items, topics };
      } finally {
        discoverInFlight.delete(username);
      }
    })();

    discoverInFlight.set(username, searchPromise);
    const result = await searchPromise;

    return res.json({
      success: true,
      enabled: true,
      items: result.items,
      topics: result.topics,
      cached: false,
      empty: result.items.length === 0,
      refreshed: forceRefresh,
      message: result.items.length === 0 ? 'Nothing to discover right now' : undefined,
    });
  } catch (err: any) {
    console.warn(`[Discover] Unexpected handler error for @${username}:`, err.message || err);
    // Gracefully provide fallback curated items
    const shuffled = [...CURATED_DISCOVER_RESOURCES].sort(() => 0.5 - Math.random()).slice(0, 4);
    return res.json({
      success: true,
      enabled: true,
      items: shuffled,
      topics: ['Technology', 'Software Engineering', 'AI & Web'],
      empty: false,
      message: undefined,
    });
  }
});

// Dynamic Open Graph Image Generator (Satori + SVG fallback)
app.get('/api/og', async (req, res) => {
  const username = String(req.query.username || 'silvio').toLowerCase().trim();
  const name = String(req.query.name || (username === 'silvio' ? 'Silvio Christian Joe' : username)).trim();
  const bio = String(
    req.query.bio ||
      (username === 'silvio'
        ? 'AI Engineer & Full-Stack Developer 🚀\nCheck out my portfolio, Kaggle models, and open-source projects.'
        : 'Curated links, social profiles, and projects.')
  ).trim();
  const accent = String(req.query.accent || '#6366f1').trim();
  const linksCount = parseInt(String(req.query.links || '9'), 10) || 0;
  const initial = (name[0] || username[0] || 'L').toUpperCase();

  // Try Satori first if fonts are loaded
  if (cachedBoldFont) {
    try {
      const bioLines = bio.split('\n').filter(Boolean);
      const bioPrimary = bioLines[0] || 'Link in bio';
      const bioSecondary = bioLines.slice(1).join(' ') || `${linksCount} curated portfolio links & projects`;

      const element = React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '1200px',
            height: '630px',
            backgroundColor: '#090d16',
            backgroundImage: `radial-gradient(circle at 90% 10%, ${accent}35 0%, transparent 55%), radial-gradient(circle at 10% 90%, #3b82f625 0%, transparent 45%)`,
            padding: '54px 64px',
            justifyContent: 'space-between',
            fontFamily: 'LiberationSans',
            border: '6px solid #1e293b',
            boxSizing: 'border-box',
          },
        },
        // Top Header
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
            React.createElement(
              'div',
              {
                style: {
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '22px',
                },
              },
              'LN'
            ),
            React.createElement(
              'span',
              { style: { fontSize: '28px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' } },
              'LinkNest'
            )
          ),
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: `${accent}20`,
                border: `1px solid ${accent}45`,
                color: '#c7d2fe',
                fontSize: '15px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              },
            },
            'Verified Creator'
          )
        ),
        // Middle Profile Section
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '36px' } },
          React.createElement(
            'div',
            {
              style: {
                width: '136px',
                height: '136px',
                borderRadius: '36px',
                backgroundColor: '#0f172a',
                border: `5px solid ${accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
                fontWeight: 800,
                color: accent,
                boxShadow: `0 10px 30px ${accent}40`,
              },
            },
            initial
          ),
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 } },
            React.createElement(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
              React.createElement(
                'span',
                { style: { fontSize: '46px', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px' } },
                name
              ),
              React.createElement(
                'span',
                {
                  style: {
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#c7d2fe',
                    backgroundColor: `${accent}25`,
                    border: `1px solid ${accent}40`,
                    padding: '4px 14px',
                    borderRadius: '8px',
                  },
                },
                `@${username}`
              )
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  lineHeight: 1.35,
                  maxWidth: '850px',
                },
              },
              bioPrimary
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '20px',
                  color: '#94a3b8',
                  lineHeight: 1.35,
                  maxWidth: '850px',
                },
              },
              bioSecondary
            )
          )
        ),
        // Bottom Footer
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '22px',
            },
          },
          React.createElement(
            'span',
            { style: { fontSize: '22px', color: '#64748b', fontWeight: 600 } },
            `linknest.app/@${username}`
          ),
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '17px',
                fontWeight: 700,
                color: '#a5b4fc',
              },
            },
            `${linksCount} Active Links & Showcases`
          )
        )
      );

      type FontItem = {
        name: string;
        data: Buffer | ArrayBuffer;
        weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
        style: 'normal' | 'italic';
      };
      const fontsConfig: FontItem[] = [
        { name: 'LiberationSans', data: cachedBoldFont, weight: 700, style: 'normal' }
      ];
      if (cachedRegularFont && cachedRegularFont !== cachedBoldFont) {
        fontsConfig.push({ name: 'LiberationSans', data: cachedRegularFont, weight: 400, style: 'normal' });
      }

      const svg = await satori(element, {
        width: 1200,
        height: 630,
        fonts: fontsConfig,
      });

      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.send(svg);
    } catch (err) {
      console.warn('Satori rendering failed, using high-fidelity fallback SVG:', err);
    }
  }

  // Fallback vector SVG
  const fallbackSvg = generateFallbackSvg({
    username,
    name,
    bio,
    accent,
    linksCount,
  });

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.send(fallbackSvg);
});

// ---------------------------------------------------------------------------
// Static Assets & Vite Handling
// ---------------------------------------------------------------------------
app.use(express.static(path.join(process.cwd(), 'public')));

async function start() {
  let vite: ViteDevServer | null = null;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
  }

  const RESERVED_NAMES = new Set([
    'admin',
    'dashboard',
    'login',
    'api',
    'public',
    'assets',
    'src',
    'favicon.ico',
    'avatar-silvio.png',
  ]);

  const renderHtml = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    profileUsername?: string
  ) => {
    try {
      const origin = getRequestOrigin(req);
      let template: string;
      if (process.env.NODE_ENV !== 'production' && vite) {
        const raw = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, raw);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      }

      if (profileUsername) {
        const profile = await getProfileForRoute(profileUsername);
        template = injectProfileMeta(template, origin, profile);
      }

      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(template);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production' && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  };

  // Route "/" -> Landing / Dashboard entry point (serves base template)
  app.get('/', async (req, res, next) => {
    await renderHtml(req, res, next);
  });

  // Route "/:username" -> profile page with real server-injected meta tags
  app.get('/:username', async (req, res, next) => {
    const username = req.params.username;
    if (
      !username ||
      RESERVED_NAMES.has(username.toLowerCase()) ||
      username.includes('.') ||
      username.startsWith('@')
    ) {
      // If starts with @, strip it and handle, or pass next
      if (username.startsWith('@')) {
        return renderHtml(req, res, next, username.slice(1));
      }
      return next();
    }
    await renderHtml(req, res, next, username);
  });

  // Fallback for all other HTML navigation routes (/admin, /admin/login, etc.)
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return next();
    }
    await renderHtml(req, res, next);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkNest Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
