import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Palette,
  QrCode,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Lock,
  Smartphone,
  Globe,
  Layers,
  Zap,
  MousePointerClick,
  TrendingUp,
  Check,
  ChevronDown,
  ChevronUp,
  Share2,
  Printer,
  Eye,
  MessageCircle,
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Compass,
  HelpCircle,
  Copy,
  Menu,
  X,
} from 'lucide-react';
import { LinkNestLogo } from '../common/LinkNestLogo';

interface FaqItem {
  question: string;
  answer: string;
  linkUrl?: string;
  linkLabel?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is LinkNest completely free to use, and are there any link or feature limits?',
    answer: 'Yes! LinkNest is 100% free and open-source with zero subscription fees, artificial link caps, or hidden paywalls. You can create unlimited links, reorder them dynamically, configure scheduled launch and expiration dates, choose from custom theme presets, design unique color gradients, track click analytics over 7 days, and download high-resolution QR codes without ever needing to enter a credit card.',
  },
  {
    question: 'How does LinkNest keep my profile data safe, protected, and reliably stored?',
    answer: 'All profile records, link collections, theme configurations, and analytics logs are persisted in a production-grade Supabase PostgreSQL database protected by Row Level Security (RLS) policies. This architecture ensures that only authenticated creators can modify their own content. In addition, you can enable custom password protection on your public profile, allowing you to safeguard sensitive projects, exclusive portfolios, or private client links behind an access code.',
  },
  {
    question: 'What should I do if I encounter an error, bug, or technical issue?',
    answer: 'LinkNest is actively maintained as an open-source project. If you experience an unexpected error, visual glitch, or have an idea for a feature improvement, please report it directly on our official GitHub repository. Head over to https://github.com/viochris/linknest-link-in-bio and open a new issue describing what happened, including any reproducible steps or error screenshots. Our team reviews issues and deploys fixes promptly.',
    linkUrl: 'https://github.com/viochris/linknest-link-in-bio',
    linkLabel: 'Open an Issue on GitHub (viochris/linknest-link-in-bio)',
  },
  {
    question: 'Can I download print-ready QR codes and table-tent flyers for offline promotion?',
    answer: 'Absolutely! LinkNest includes a dedicated QR Code Studio and Flyer Generator engineered specifically for physical marketing, in-person networking, and retail promotion. You can customize the QR code color scheme (Indigo, Slate, Emerald, Classic Black), embed your profile avatar directly in the center, and export in scalable vector SVG (for commercial printers and large banners) or ultra-high-resolution PNG (up to 2048px HD). You can also download complete printable event standees and table-tent flyers ready for display.',
  },
  {
    question: 'How does the built-in 7-day link click analytics engine work?',
    answer: 'Every link click and profile visit is captured in real time through secure database events, eliminating the need for intrusive third-party tracking scripts or privacy-invasive advertising cookies. Inside your Admin Dashboard, an interactive chart powered by Recharts reveals your daily click velocity over the past 7 days, cumulative lifetime clicks, top-performing links ranked by engagement, and percentage distributions to help you understand your audience effectively.',
  },
  {
    question: 'What interactive integrations, social networks, and link types are supported?',
    answer: 'LinkNest supports standard web links, direct WhatsApp click-to-chat triggers with prefilled message templates, portfolio showcases with live status indicators (Live, Beta, WIP, Sold Out), and social icon badges for GitHub, LinkedIn, Instagram, X (Twitter), YouTube, Kaggle, Email, and more. You can also organize your links by category sections, pin priority links to the top, and enable an automated Trending & Discover tab that curates web resources tailored to your bio interests.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mockCopied, setMockCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCopyMockUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest-link-in-bio.vercel.app';
    navigator.clipboard.writeText(`${origin}/demo`);
    setMockCopied(true);
    setTimeout(() => setMockCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-indigo-900/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <LinkNestLogo size={34} />
            <span className="font-bold text-white text-base tracking-tight group-hover:text-indigo-200 transition-colors">
              LinkNest
            </span>
          </Link>

          {/* Desktop Navigation Links - comfortably spaced, only on xl screens */}
          <nav className="hidden xl:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#live-preview" className="hover:text-white transition-colors">Live Demo</a>
            <a href="#comparison" className="hover:text-white transition-colors">Why LinkNest</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Navigation CTAs & Responsive Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/admin/login"
              id="landing-login-btn"
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
            >
              Log In
            </Link>
            <Link
              to="/admin/login?mode=signup"
              id="landing-signup-btn"
              className="hidden sm:flex px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/25 items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Create Your Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Dropdown Hamburger Toggle Button for Screens Below xl */}
            <button
              type="button"
              id="nav-dropdown-toggle-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              className="xl:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-indigo-400" /> : <Menu className="w-4 h-4" />}
              <span className="hidden md:inline">Menu</span>
            </button>
          </div>
        </div>

        {/* Collapsible Dropdown Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="xl:hidden overflow-hidden border-t border-slate-800/80 mt-3 pt-3 pb-2 max-w-6xl mx-auto"
            >
              <div className="flex flex-col gap-1 text-sm font-medium">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors flex items-center justify-between"
                >
                  <span>Features</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors flex items-center justify-between"
                >
                  <span>How It Works</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </a>
                <a
                  href="#live-preview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors flex items-center justify-between"
                >
                  <span>Live Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </a>
                <a
                  href="#comparison"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors flex items-center justify-between"
                >
                  <span>Why LinkNest</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors flex items-center justify-between"
                >
                  <span>FAQ</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </a>

                {/* Mobile-only CTA */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2 sm:hidden">
                  <Link
                    to="/admin/login?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Create Your Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-20 sm:space-y-28 z-10">
        
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 pt-4 sm:pt-8">
          {/* Left Column: Hero Text & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex-1 text-center lg:text-left space-y-6 max-w-xl mx-auto lg:mx-0"
          >
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Gen Bio Link &amp; Creator Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Your links, portfolio, and identity in one place.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Create a custom bio link to share across WhatsApp, Instagram, and TikTok. Track real-time engagement with 7-day click analytics and generate print-ready QR code standees.
            </p>

            {/* Main Action Buttons */}
            <div className="pt-2 flex flex-col items-center lg:items-start gap-2.5 w-full max-w-md">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full">
                <button
                  type="button"
                  id="hero-get-started-btn"
                  onClick={() => navigate('/admin/login?mode=signup')}
                  className="flex-1 w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Create Your Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/demo"
                  id="hero-demo-profile-btn"
                  className="flex-1 w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>View Live Demo</span>
                </Link>
              </div>

              {/* Silvio's Live Profile - exclusively placed here with full matching width */}
              <Link
                to="/silvio"
                id="hero-silvio-profile-btn"
                className="w-full py-2.5 px-4 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm group"
              >
                <span>View Silvio's Live Profile (@silvio)</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Key Trust Badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-900 text-left">
              <div>
                <div className="text-lg font-bold text-white">100% Free</div>
                <div className="text-[11px] text-slate-500">No Paywalled Links</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">7-Day Charts</div>
                <div className="text-[11px] text-slate-500">Recharts Powered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">Vector SVG</div>
                <div className="text-[11px] text-slate-500">Printable Standees</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Code-Rendered Mobile Phone Mockup (NO AI-generated images) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
            className="w-full max-w-[340px] sm:max-w-[380px] shrink-0 mx-auto"
            id="live-preview"
          >
            {/* Phone Bezel */}
            <div className="relative rounded-[44px] p-3 bg-slate-900 border-4 border-slate-800 shadow-2xl shadow-indigo-950/40">
              {/* Symmetrical Centered Camera Punch-Hole & Speaker Pill */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-950 rounded-full z-30 flex items-center justify-center border border-slate-800 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700/70 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-indigo-900" />
                </div>
              </div>

              {/* Phone Screen Container */}
              <div className="rounded-[34px] bg-gradient-to-b from-[#0c1024] via-[#101432] to-[#0a0d1e] border border-slate-800/80 p-3.5 pt-8 text-center space-y-3 overflow-hidden relative shadow-inner">
                {/* Top Header Bar */}
                <div className="flex items-center justify-end gap-1.5 px-1">
                  <button
                    type="button"
                    onClick={() => navigate('/demo')}
                    className="w-6 h-6 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:text-white transition-colors cursor-pointer"
                    title="View QR Code"
                  >
                    <QrCode className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyMockUrl}
                    className="w-6 h-6 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Share Profile"
                  >
                    {mockCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                  </button>
                </div>

                {/* Profile Header */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="w-16 h-16 rounded-full mx-auto p-0.5 ring-2 ring-indigo-500/40 bg-gradient-to-tr from-indigo-500/30 to-purple-500/20 shadow-lg overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                      alt="Alex Rivera"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold text-white tracking-tight">
                      Alex Rivera
                    </h3>
                    <div className="text-[11px] text-slate-400 font-medium">@alex</div>
                    <div className="text-[11px] font-semibold text-slate-200">
                      Creative Technologist &amp; UI Engineer ✨
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug px-3 max-w-[260px] mx-auto">
                    Exploring AI design systems, WebGL interactions, and modern web products.
                  </p>
                </div>

                {/* Social Icons Row */}
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <span className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-300">
                    <Github className="w-3.5 h-3.5" />
                  </span>
                  <span className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-300">
                    <Twitter className="w-3 h-3" />
                  </span>
                  <span className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-300">
                    <Linkedin className="w-3 h-3" />
                  </span>
                  <span className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-300">
                    <Instagram className="w-3 h-3" />
                  </span>
                </div>

                {/* Section Tabs Switcher */}
                <div className="inline-flex p-0.5 rounded-lg bg-slate-900/90 border border-slate-800/90 mx-auto text-[10px]">
                  <div className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-semibold flex items-center gap-1 shadow-sm">
                    <span>Links</span>
                    <span className="px-1 py-0.1 rounded-full bg-indigo-700/80 text-[9px]">3</span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-md text-slate-400 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-slate-400" />
                    <span>Discover</span>
                    <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                      TRENDING
                    </span>
                  </div>
                </div>

                {/* Bio Links Cards */}
                <div className="space-y-2 pt-0.5 text-left">
                  {/* Card 1: LinkedIn (Featured with glowing border) */}
                  <div className="p-2.5 rounded-xl bg-slate-900/95 border border-indigo-500/50 shadow-md shadow-indigo-500/10 relative">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                        <Linkedin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-white truncate">Connect on LinkedIn</span>
                          <span className="text-[8px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Sparkles className="w-2 h-2" /> FEATURED
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Professional network &amp; career updates
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                    </div>
                  </div>

                  {/* Card 2: GitHub Open Source Projects */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-200 shrink-0">
                        <Github className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-white truncate">Open Source Projects</span>
                          <span className="text-[8px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-1 py-0.2 rounded">
                            GITHUB
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Explore developer tools &amp; repositories
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                    </div>
                  </div>

                  {/* Card 3: Daily Lifestyle & Tech on Instagram */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                        <Instagram className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-white truncate">Tech &amp; Design Stories</span>
                          <span className="text-[8px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded">
                            INSTAGRAM
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Workspace setups &amp; daily updates
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Footer Brand Pill */}
                <div className="pt-1.5 pb-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[9px] text-slate-400">
                    <span>Made with</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-slate-300">LinkNest</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Core Features Showcase Grid */}
        <section id="features" className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Everything You Need</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              Built for modern creators, freelancers, and businesses.
            </p>
            <p className="text-sm text-slate-400">
              Manage your presence across digital channels and offline print spaces from one unified admin dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Smart Link Organizer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add unlimited links, toggle visibility, reorder with drag &amp; drop, pin top links, and configure direct WhatsApp buttons.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Custom Themes &amp; Styles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose from 12+ aesthetic themes, fine-tune accent colors, button radius, typography, and avatar styles in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">7-Day Click Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track click velocities with Recharts daily charts, discover top-performing links, and measure audience conversion rates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Print-Ready QR &amp; Flyers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export scalable vector SVGs and high-definition PNGs for table tents, cafe standees, event badges, and stickers.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works (3 Steps) */}
        <section id="how-it-works" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Step-by-Step</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              Launch your bio link in 3 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3 relative">
              <div className="text-4xl font-extrabold text-slate-800">01</div>
              <h3 className="text-base font-bold text-white">Claim Your Unique Handle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up with your email to claim your personalized public address and unique custom handle.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3 relative">
              <div className="text-4xl font-extrabold text-slate-800">02</div>
              <h3 className="text-base font-bold text-white">Customize Links &amp; Theme</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your social channels, portfolio works, and direct contact options. Pick a theme that fits your personal brand aesthetic.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3 relative">
              <div className="text-4xl font-extrabold text-slate-800">03</div>
              <h3 className="text-base font-bold text-white">Share Online &amp; Print Standees</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste your link in Instagram, WhatsApp, and TikTok bios, or download printable QR standees for physical shops and pop-up events.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Matrix: LinkNest vs Legacy Tools */}
        <section id="comparison" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Feature Comparison</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              Why creators choose LinkNest
            </p>
          </div>

          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-4 font-semibold">Platform Feature</th>
                  <th className="py-3.5 px-4 font-bold text-indigo-400 bg-indigo-950/30">LinkNest</th>
                  <th className="py-3.5 px-4 font-semibold text-slate-400">Generic Bio Link Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-medium text-white">7-Day Click Analytics Visualization</td>
                  <td className="py-3 px-4 bg-indigo-950/20 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Included Free
                  </td>
                  <td className="py-3 px-4 text-slate-500">Requires Paid Pro Plan</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Print-Ready Standee Cards &amp; Event Flyers</td>
                  <td className="py-3 px-4 bg-indigo-950/20 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Built-in Flyer Generator
                  </td>
                  <td className="py-3 px-4 text-slate-500">Not Available</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Scalable Vector SVG QR Code Export</td>
                  <td className="py-3 px-4 bg-indigo-950/20 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Standard Vector Export
                  </td>
                  <td className="py-3 px-4 text-slate-500">Low-res PNG Only</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Interactive Portfolios with Status Dots</td>
                  <td className="py-3 px-4 bg-indigo-950/20 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Full Support
                  </td>
                  <td className="py-3 px-4 text-slate-500">Plain text links only</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Platform Branding / Watermarks</td>
                  <td className="py-3 px-4 bg-indigo-950/20 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Clean, Zero Intrusive Ads
                  </td>
                  <td className="py-3 px-4 text-slate-500">Prominent Logo Footer</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Interactive FAQ Accordion */}
        <section id="faq" className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Frequently Asked Questions</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              Got questions? We have answers.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-white flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{item.question}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 space-y-2.5">
                    <p>{item.answer}</p>
                    {item.linkUrl && (
                      <div className="pt-1">
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{item.linkLabel || item.linkUrl}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/20 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to claim your LinkNest bio page?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Join thousands of creators, artists, and independent entrepreneurs who use LinkNest to connect their digital and offline presence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              id="cta-bottom-signup-btn"
              onClick={() => navigate('/admin/login?mode=signup')}
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Create Your Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/demo"
              id="cta-bottom-demo-btn"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>View Live Demo</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Comprehensive Footer */}
      <footer className="w-full border-t border-slate-900 py-8 bg-slate-950/90 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LinkNestLogo size={24} />
            <span className="font-bold text-white text-sm">LinkNest</span>
            <span className="text-[11px] text-slate-500 ml-2">
              &copy; {new Date().getFullYear()} LinkNest Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-5 text-slate-400 font-medium flex-wrap justify-center">
            <Link to="/admin/login" className="hover:text-white transition-colors">Admin Dashboard</Link>
            <Link to="/demo" className="hover:text-white transition-colors">Live Demo</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
