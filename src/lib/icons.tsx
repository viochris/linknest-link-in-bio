import React from 'react';
import {
  Globe,
  Github,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Briefcase,
  Code,
  BookOpen,
  Sparkles,
  Star,
  Music,
  Video,
  ShoppingBag,
  Coffee,
  Camera,
  Heart,
  Podcast,
  FileText,
  Zap,
  Send,
  Terminal,
  Rocket,
  Share2,
  ExternalLink,
  Check,
  Copy,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Eye,
  MousePointerClick,
  BarChart3,
  Palette,
  Layout,
  Settings,
  LogOut,
  LogIn,
  User,
  Calendar,
  Lock,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Database,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  X as XIcon,
  Facebook,
  Twitch,
  Slack,
  MessageCircle,
  LucideProps
} from 'lucide-react';

/* =========================================================================
   Bespoke, Crisp Vector Icons for Major Social & Tech Platforms
   ========================================================================= */

export const KaggleIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  strokeWidth = 2.4,
  size = 24,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M5.5 4v16" />
    <path d="M18.5 4.5L9.5 13.5" />
    <path d="M12.5 11l6.5 9" />
  </svg>
);

export const SpotifyIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M7 9.5c3.5-1 7-0.5 10 1" />
    <path d="M8 12.5c3-0.8 6-0.3 8.5 1" />
    <path d="M9 15.5c2.5-0.5 5-0.2 7 0.8" />
  </svg>
);

export const DiscordIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 6a14.5 14.5 0 0 0-4-1.2 11.2 11.2 0 0 0-.5 1.2 13.5 13.5 0 0 0-3 0 11.2 11.2 0 0 0-.5-1.2A14.5 14.5 0 0 0 6 6a15.8 15.8 0 0 0-2.5 11c2 1.5 4 1.5 4 1.5.5-.7 1-1.4 1.4-2.2-1.4-.5-2-1.3-2-1.3s.2.1.4.3c3 1.8 6 1.8 9 0 .3-.2.4-.3.4-.3s-.6.8-2 1.3c.4.8.9 1.5 1.4 2.2 0 0 2 0 4-1.5A15.8 15.8 0 0 0 18 6z" />
    <circle cx="9.5" cy="12" r="1" fill="currentColor" />
    <circle cx="14.5" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const TikTokIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const TelegramIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21.5 3.5L2.5 10.8l6.8 2.6 2.4 7.1 3.5-3.5 4.8 3.5 1.5-17z" />
    <path d="M9.3 13.4l7.7-6.4" />
  </svg>
);

export const WhatsAppIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M9.5 9.5a1.5 1.5 0 0 0 2 2l1.5 1.5a1.5 1.5 0 0 0 2-2" />
  </svg>
);

export const ThreadsIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 1-6 0v-1a6 6 0 1 1 2 11.6" />
  </svg>
);

export const RedditIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="14" r="7" />
    <path d="M12 7V4l4 1" />
    <circle cx="17.5" cy="5" r="1" fill="currentColor" />
    <circle cx="5" cy="13" r="1.5" />
    <circle cx="19" cy="13" r="1.5" />
    <circle cx="9.5" cy="13.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="13.5" r="1" fill="currentColor" />
    <path d="M9.5 16.5c1 .8 4 .8 5 0" />
  </svg>
);

export const DribbbleIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
    <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
    <path d="M8.53 2.74c4.15 4.3 6.13 9.42 7.03 18.23" />
  </svg>
);

export const BehanceIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4 6h4a2.5 2.5 0 0 1 0 5H4v-5z" />
    <path d="M4 11h5a2.5 2.5 0 0 1 0 5H4v-5z" />
    <path d="M15 8h4" />
    <path d="M19 14.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
  </svg>
);

export const FigmaIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
  </svg>
);

export const PinterestIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 21.5c1-3 1.8-6.8 2-9" />
    <path d="M9.5 13c1.5 2 6 1.8 6-2a4 4 0 0 0-8-1c-.5 2 .5 4 1.5 4" />
  </svg>
);

export const SubstackIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4 5h16v2.5H4z" />
    <path d="M4 9.5h16V12H4z" />
    <path d="M4 14l8 5 8-5v5.5H4z" />
  </svg>
);

export const NotionIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 8v8l8-8v8" />
  </svg>
);

export const SteamIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="15.5" cy="8.5" r="2.5" />
    <circle cx="8.5" cy="15.5" r="2" />
    <path d="M10 14l3.5-4" />
  </svg>
);

export const SoundCloudIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 14v3M6 12v6M9 9v9M12 11v7" />
    <path d="M15 18h4a3 3 0 0 0 0-6h-.5A4.5 4.5 0 0 0 12 8" />
  </svg>
);

export const GitLabIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 13l-9 8-9-8 2.5-9 3.5 7h6l3.5-7z" />
  </svg>
);

export const PatreonIcon: React.FC<LucideProps> = ({
  className = 'w-4 h-4',
  size = 24,
  strokeWidth = 2,
  ...props
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="14.5" cy="9.5" r="4.5" />
    <path d="M5 5v14" />
  </svg>
);

/* =========================================================================
   Icon Registration Map
   ========================================================================= */

export const IconMap: Record<string, React.FC<LucideProps>> = {
  // Social & Platform Icons
  globe: Globe,
  website: Globe,
  github: Github,
  twitter: XIcon,
  x: XIcon,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
  spotify: SpotifyIcon,
  discord: DiscordIcon,
  twitch: Twitch,
  facebook: Facebook,
  threads: ThreadsIcon,
  telegram: TelegramIcon,
  whatsapp: WhatsAppIcon,
  reddit: RedditIcon,
  dribbble: DribbbleIcon,
  behance: BehanceIcon,
  figma: FigmaIcon,
  pinterest: PinterestIcon,
  medium: BookOpen,
  substack: SubstackIcon,
  kaggle: KaggleIcon,
  patreon: PatreonIcon,
  notion: NotionIcon,
  steam: SteamIcon,
  soundcloud: SoundCloudIcon,
  gitlab: GitLabIcon,
  slack: Slack,
  'apple-music': Music,

  // General & Utility Icons
  mail: Mail,
  email: Mail,
  briefcase: Briefcase,
  portfolio: Briefcase,
  code: Code,
  'book-open': BookOpen,
  sparkles: Sparkles,
  star: Star,
  music: Music,
  video: Video,
  'shopping-bag': ShoppingBag,
  coffee: Coffee,
  camera: Camera,
  heart: Heart,
  podcast: Podcast,
  'file-text': FileText,
  zap: Zap,
  send: Send,
  terminal: Terminal,
  rocket: Rocket,
  calendar: Calendar,
  message: MessageCircle,
};

export const AppIcons = {
  Share2,
  ExternalLink,
  Check,
  Copy,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Eye,
  MousePointerClick,
  BarChart3,
  Palette,
  Layout,
  Settings,
  LogOut,
  LogIn,
  User,
  Calendar,
  Lock,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Database,
  RefreshCw,
  AlertCircle,
  HelpCircle,
};

export function RenderIcon({
  name,
  className = 'w-5 h-5',
  fallback = Globe,
}: {
  name?: string;
  className?: string;
  fallback?: React.FC<LucideProps>;
}) {
  if (!name) {
    const FallbackComponent = fallback;
    return <FallbackComponent className={className} />;
  }
  const key = name.toLowerCase().trim();
  const Component = IconMap[key] || fallback;
  return <Component className={className} />;
}
