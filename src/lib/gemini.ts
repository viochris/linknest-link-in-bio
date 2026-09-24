import { AiGeneratedDescriptionResponse } from '../types';

export interface GenerateDescriptionParams {
  url: string;
  title: string;
  category?: string;
  tone?: 'professional' | 'punchy' | 'engaging' | 'minimalist';
}

function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Intelligent client-side fallback if backend API is unreachable or deployed as a static SPA on Vercel
 */
function generateLocalSmartDescription(params: GenerateDescriptionParams): AiGeneratedDescriptionResponse {
  const { url = '', title = '', category = 'Work' } = params;
  const domain = extractDomain(url).toLowerCase();
  const rawTitle = title || 'Featured Link';

  let primary = '';
  let alt1 = '';
  let alt2 = '';
  let icon = 'globe';
  let cat = category || 'Work';

  if (domain.includes('github.com')) {
    primary = 'Explore open-source repositories, developer tools, and architecture.';
    alt1 = 'Production-ready code repositories and developer tools.';
    alt2 = 'Inspect active code contributions and open-source libraries.';
    icon = 'github';
    cat = 'Projects';
  } else if (domain.includes('linkedin.com')) {
    primary = 'Connect for professional career updates, tech insights, and networking.';
    alt1 = 'Professional work experience, enterprise projects, and technical network.';
    alt2 = 'Follow career milestones and connect directly on LinkedIn.';
    icon = 'linkedin';
    cat = 'Social';
  } else if (domain.includes('kaggle.com')) {
    primary = 'Browse competitive machine learning models, notebooks, and datasets.';
    alt1 = 'Data science benchmarks, predictive models, and Kaggle kernels.';
    alt2 = 'Explore end-to-end ML experiments and algorithm competitions.';
    icon = 'kaggle';
    cat = 'Projects';
  } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
    primary = 'Follow for real-time tech updates, developer commentary, and build logs.';
    alt1 = 'Daily insights, AI breakthroughs, and engineering thoughts.';
    alt2 = 'Join the conversation and keep up with latest build updates.';
    icon = 'x';
    cat = 'Social';
  } else if (domain.includes('instagram.com')) {
    primary = 'Daily developer behind-the-scenes, engineering lifestyle, and visual stories.';
    alt1 = 'Behind the screen: daily coding, workstation setup, and tech stories.';
    alt2 = 'Visual snippets of tech builds, workspace, and community life.';
    icon = 'instagram';
    cat = 'Social';
  } else if (domain.includes('medium.com') || domain.includes('substack.com') || domain.includes('dev.to')) {
    primary = 'Read in-depth technical guides, engineering articles, and system breakdowns.';
    alt1 = 'Deep dives on artificial intelligence, software design, and architecture.';
    alt2 = 'Tutorials, system benchmarks, and practical full-stack insights.';
    icon = 'medium';
    cat = 'Work';
  } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    primary = 'Watch technical walkthroughs, project demos, and software tutorials.';
    alt1 = 'Video deep-dives, live coding sessions, and architecture breakdowns.';
    alt2 = 'Comprehensive video tutorials on AI, full-stack systems, and design.';
    icon = 'youtube';
    cat = 'Projects';
  } else if (rawTitle.toLowerCase().includes('portfolio') || domain.includes('vercel.app')) {
    primary = 'Interactive portfolio showcasing production AI systems and full-stack apps.';
    alt1 = 'Featured client case studies, live demo deployments, and interactive work.';
    alt2 = 'Explore engineered web applications, performance metrics, and projects.';
    icon = 'briefcase';
    cat = 'Work';
  } else {
    primary = `Explore ${rawTitle} and discover verified resources and updates.`;
    alt1 = `Direct link to ${rawTitle} on ${domain || 'the web'}.`;
    alt2 = `Essential updates and resources from ${rawTitle}.`;
    icon = 'globe';
    cat = 'Resources';
  }

  return {
    success: true,
    description: primary,
    alternatives: [
      { tone: 'Punchy & Direct', text: alt1 },
      { tone: 'Value-Driven', text: alt2 },
      { tone: 'Engaging & Modern', text: primary },
    ],
    suggestedIcon: icon,
    suggestedCategory: cat,
  };
}

/**
 * Calls the Gemini API endpoint to generate a professional,
 * high-converting link description based on the URL, title, and target metadata.
 * Works seamlessly on local server, Cloud Run, and Vercel serverless / static deployments.
 */
export async function generateLinkDescription(
  params: GenerateDescriptionParams
): Promise<AiGeneratedDescriptionResponse> {
  const { url, title, category, tone = 'professional' } = params;

  if (!url && !title) {
    throw new Error('Please enter a URL or Title first so Gemini can analyze it.');
  }

  try {
    const res = await fetch('/api/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        title,
        category,
        tone,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    // Detect if Vercel or static host returned index.html SPA fallback
    if (contentType.includes('text/html')) {
      console.warn('Vercel returned HTML for /api/generate-description. Using smart fallback generator.');
      return generateLocalSmartDescription(params);
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.description) {
        return data as AiGeneratedDescriptionResponse;
      }
    } else {
      let errorMsg = 'Failed to generate link description';
      try {
        const errData = await res.json();
        if (errData.error) errorMsg = errData.error;
      } catch {
        // ignore
      }
      console.warn('API error from /api/generate-description:', errorMsg);
    }
  } catch (netErr) {
    console.warn('Network call to /api/generate-description failed:', netErr);
  }

  // Graceful smart generation so the user on Vercel NEVER encounters an uncaught error
  return generateLocalSmartDescription(params);
}
