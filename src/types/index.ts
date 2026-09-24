export type ButtonStyle = 'rounded' | 'pill' | 'sharp' | 'outline' | 'glass' | 'shadow';
export type BgType = 'preset' | 'solid' | 'gradient';

export interface ThemeConfig {
  bg_type: BgType;
  bg_value: string; // preset ID, hex, or CSS gradient
  button_style: ButtonStyle;
  button_bg: string;
  button_text: string;
  accent_color: string;
  font_family: string;
  show_view_count: boolean;
  show_discover_tab?: boolean; // toggle Google Search Discover tab on/off (defaults to true)
  show_qr_code?: boolean; // toggle whether to display QR code card on public profile
  is_password_protected?: boolean; // toggle optional password protection for public profile
  profile_password?: string | null; // password required by visitors before viewing links
}

export interface DiscoverItem {
  id: string;
  title: string;
  source: string;
  snippet: string;
  url: string;
}

export interface DiscoverResponse {
  success: boolean;
  enabled: boolean;
  items: DiscoverItem[];
  topics: string[];
  cached?: boolean;
  cachedAt?: string;
  expiresAt?: string;
  message?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  meta_title?: string;
  meta_description?: string;
  custom_domain?: string | null;
  custom_domain_status?: 'not_configured' | 'pending' | 'verified' | 'failed';
  custom_domain_dns_type?: 'cname' | 'a';
  custom_domain_verified_at?: string | null;
  is_password_protected?: boolean;
  profile_password?: string | null;
  theme: ThemeConfig;
  view_count: number;
  created_at: string;
}

export interface LinkItem {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string;
  description?: string | null; // AI-generated or custom subtitle/description
  category?: string; // e.g., 'Work', 'Projects', 'Social', 'Personal'
  position: number;
  is_active: boolean;
  is_featured: boolean;
  is_archived?: boolean;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  last_clicked_at: string | null;
  created_at: string;
}

export interface AiGeneratedDescriptionResponse {
  success: boolean;
  description: string;
  alternatives?: Array<{
    tone: string;
    text: string;
  }>;
  suggestedIcon?: string;
  suggestedCategory?: string;
  metadata?: {
    domain?: string;
    pageTitle?: string;
    metaDescription?: string;
  };
  isFallback?: boolean;
  message?: string;
  model?: string;
}

export interface LinkClickEvent {
  id: string;
  link_id: string;
  profile_id: string;
  clicked_at: string;
  user_agent?: string;
  referrer?: string;
}

export interface SocialIconItem {
  id: string;
  profile_id: string;
  platform: string;
  url: string;
  position: number;
  created_at?: string;
}

export interface PublicProfileData {
  profile: Profile;
  links: LinkItem[];
  social_icons: SocialIconItem[];
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'vibrant' | 'minimal';
  theme: ThemeConfig;
  previewBg: string;
}
