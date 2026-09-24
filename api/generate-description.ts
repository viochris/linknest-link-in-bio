import { GoogleGenAI, Type } from '@google/genai';

interface ScrapedMetadata {
  title?: string;
  description?: string;
  siteName?: string;
  domain?: string;
}

function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function generateSmartFallback(
  title: string,
  url: string,
  metadata: ScrapedMetadata
) {
  const domain = (metadata.domain || extractDomain(url) || '').toLowerCase();
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

export default async function handler(req: any, res: any) {
  // CORS & Options
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url = '', title = '', category = '', tone = 'professional' } = req.body || {};

  if (!url && !title) {
    return res.status(400).json({
      error: 'Please provide at least a URL or link Title to generate a description.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = generateSmartFallback(title, url, {});
    return res.status(200).json(fallback);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert copywriter for a high-converting link-in-bio page like Linktree or Bento.
Generate a concise, punchy description (max 100 characters) for a link:
- Title: "${title || 'Untitled Link'}"
- URL: "${url || 'https://'}"
- Category: "${category || 'General'}"
- Desired Tone: "${tone}"

Return JSON matching the schema with description, alternatives, suggestedIcon, and suggestedCategory.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: 'Primary link description under 100 characters.',
            },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tone: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ['tone', 'text'],
              },
            },
            suggestedIcon: {
              type: Type.STRING,
              description: 'Lucide icon identifier such as github, linkedin, youtube, globe, etc.',
            },
            suggestedCategory: {
              type: Type.STRING,
              description: 'Category name such as Work, Social, Projects, Resources.',
            },
          },
          required: ['description', 'alternatives'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.status(200).json(parsed);
    }
  } catch (err: any) {
    console.error('Vercel Gemini invocation failed, fallback to smart generator:', err);
  }

  const fallback = generateSmartFallback(title, url, {});
  return res.status(200).json(fallback);
}
