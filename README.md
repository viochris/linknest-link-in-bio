<div align="center">

# 🔗 LinkNest, Personal Link-in-Bio Platform

**A customizable link-in-bio platform with a public profile page and a Supabase-backed admin dashboard, complete with AI-generated copy, a live Discover feed, and real analytics.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-linknest--link--in--bio.vercel.app-6366f1?style=for-the-badge)](https://linknest-link-in-bio.vercel.app/)
[![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-Google%20AI%20Studio%20%2B%20Gemini-4285F4?style=for-the-badge)](https://ai.studio)

**[Features](#features)** · **[Tech Stack](#tech-stack)** · **[Getting Started](#getting-started)** · **[Project Structure](#project-structure)** · **[How It Works](#how-it-works)** · **[Environment Variables](#environment-variables)**

</div>

---

## Overview

**LinkNest** is a self-owned alternative to link-in-bio tools like Linktree, built with a real Postgres backend (Supabase) rather than hardcoded, static content. It has two distinct surfaces, a public profile page anyone can visit without logging in, and an authenticated admin dashboard where the owner manages every aspect of that page, links, theme, analytics, and more.

The project was **vibe-coded in [Google AI Studio](https://ai.studio) using Gemini**, starting from a written Product Requirements Document that defined the public page and dashboard flow, the Supabase schema, and the Row Level Security rules. Beyond the core link-in-bio functionality, the app also includes a Google Search powered Discover tab, AI-generated link copywriting, a broken-link checker, password-protected profiles, CSV analytics export, and a first-time setup wizard for new accounts.

It is part of a broader personal portfolio series (alongside **[WishBox](https://github.com/viochris/wishbox-birthday-card)** and **[ForeverCard](https://github.com/viochris/forevercard-anniversary)**) demonstrating applied "vibe coding" ability outside of my primary technical focus areas (Data Science, NLP, and GenAI/LLM agent engineering). Unlike those two, LinkNest is a genuine full-stack application with a real backend, authentication, and Row Level Security, rather than a stateless front-end-only experience.

**Live demo, [linknest-link-in-bio.vercel.app](https://linknest-link-in-bio.vercel.app/)**

---

## Features

### Public Profile Page (`/:username`)
- Displays the owner's avatar, display name, bio, social icons, and an ordered list of active links, all styled according to a fully customizable theme (background, button style, colors, font).
- A featured link is visually highlighted, and links can be scheduled to only appear within a specific start and end date window.
- **Discover tab**, an optional tab powered by Gemini's Google Search grounding tool, surfacing trending articles and resources related to the owner's bio. Bio text is sanitized before use (URLs, emails, emoji, and prompt-injection trigger words stripped) and capped to a short query, results are cached server-side for 12 hours per profile with request coalescing to avoid duplicate searches, concurrent requests are rate-limited, a curated fallback list of resources is shown if the search returns nothing, and the owner can disable the tab entirely from the dashboard.
- **Optional password protection**, the owner can lock their public page behind a password, showing a gate screen to visitors until the correct password is entered.
- **Dynamic Open Graph previews**, unlike a typical single-page app where social previews only work client-side, LinkNest injects real, per-profile meta tags (title, description, `og:image`, Twitter Card tags) directly into the server-rendered HTML before it reaches the browser, so sharing a profile link on WhatsApp, Telegram, or X shows an accurate, branded preview card. The preview image itself is generated on the fly with Satori (with a hand-written SVG fallback if font loading fails), showing the owner's avatar initial, name, bio, and active link count.
- A shareable QR code can be generated and downloaded directly from the public page.

### Admin Dashboard (`/admin`, behind Supabase Auth)
- **Manage Links tab**, add, edit, delete, and drag-and-drop reorder links, toggle featured status, and schedule a link's visibility window. Every operation identifies links strictly by their database `id` (never by array position), includes a confirmation step before deleting, and falls back to re-fetching the authoritative state from Supabase if anything goes wrong, so a failed operation can never silently corrupt the list.
- **Three link states, Live, Hidden, and Archived.** Every link sits in one of three states, and the dashboard lets the owner filter and count links by each one.
  - **Live** means the link is active and currently visible to visitors on the public profile page (subject to its scheduled start and end dates, if any are set).
  - **Hidden** means the link is temporarily not shown on the public page, but it has not been set aside for long-term storage. This is the right choice when the owner simply does not want a link visible right now but expects to turn it back on again soon.
  - **Archived** means the link is not shown on the public page either, and technically behaves the same as Hidden in that respect, but it carries a different intent. Archiving is meant for a link the owner no longer actively uses but does not want to delete, for example an old project or a past campaign kept purely for record-keeping. In short, if a link is only being paused for now, Hidden is the appropriate state, if a link is done being used but worth keeping around for reference, Archived is the appropriate state, and if a link is no longer needed at all, deleting it outright is the appropriate action rather than leaving it archived indefinitely.
- **AI-generated link descriptions**, while adding or editing a link, a button calls a server-side Gemini endpoint that scrapes the destination URL's own metadata and generates a punchy, on-brand description plus three toned alternatives (Punchy & Direct, Value-Driven, Engaging & Modern). If no Gemini API key is configured, or the call fails, a domain-aware heuristic generator (GitHub, LinkedIn, Kaggle, X, Instagram, Medium, YouTube, and more each get tailored fallback copy) produces a still-useful result instead of an error.
- **Broken-link checker**, a link's destination can be checked for reachability (HEAD request with a GET fallback), distinguishing a genuinely broken link (404, 410, 5xx) from one that is simply blocking automated requests (401, 403, 429), so the owner isn't misled into thinking a working but bot-restricted link is dead.
- **Appearance tab**, customize background, button style, accent color, and font, with a live phone-sized preview of the public page updating as changes are made.
- **Analytics tab**, total profile views, total link clicks, most-clicked link, and a per-link click chart (built with Recharts, using a fully responsive container) sourced from an actual `link_clicks` event log table, not just a running counter, allowing time-series breakdowns. Analytics data can be exported to a CSV file for use in Excel, Google Sheets, or other reporting tools. This "Export Analytics" action is available from two separate buttons on the tab, one positioned near the top of the page and another near the bottom. Both buttons trigger the exact same export and produce an identical CSV file, they exist purely as a convenience so the owner can download the report without needing to scroll back up or down to find the button, whichever one is closer at hand works equally well.
- **QR Code tab**, generate and customize a QR code for the profile's public URL.
- **"Your Public Page" panel**, a prominent section at the top of the dashboard showing the owner's full public URL in a copyable field, with quick access to sharing and the QR code, so the dashboard itself is the natural place to grab the link to share, rather than the owner needing to already know their own URL.
- **First-time setup wizard**, new accounts are guided through choosing a display name, bio, and an avatar (including a small set of preset avatar images) before landing on the main dashboard.

### Authentication and Routing
- The root URL (`/`) shows a full marketing-style landing page (feature highlights, FAQ, and sign-in/sign-up entry points) to a logged-out visitor, and redirects straight to `/admin` for an already-authenticated owner.
- `/admin` is fully protected, redirecting to `/admin/login` if there is no active session, and the reverse holds for the login page itself.
- A one-click "Try Demo Account" option logs into a pre-seeded demo profile with sample links and analytics, useful for evaluating the dashboard without creating a real account.
- If Supabase is not configured at all (no environment variables set), the app transparently falls back to an in-browser local data simulator seeded with sample profiles, so the UI remains fully explorable even without a backend connection.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) with [React Router](https://reactrouter.com/) |
| **Language** | TypeScript |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) (via `@tailwindcss/vite`) |
| **Animation** | [Motion](https://motion.dev/) (`motion/react`) |
| **Backend and Database** | [Supabase](https://supabase.com/) (Postgres, Auth, Row Level Security, Storage) |
| **AI Copywriting and Discovery** | [Gemini API](https://ai.google.dev/) (`@google/genai`), including Google Search grounding for the Discover tab |
| **Open Graph Image Generation** | [Satori](https://github.com/vercel/satori) with an SVG fallback |
| **Charts** | [Recharts](https://recharts.org/) |
| **QR Codes** | [`qrcode`](https://www.npmjs.com/package/qrcode) |
| **CSV Export** | Custom RFC-4180 compliant generator with UTF-8 BOM for Excel/Sheets compatibility |
| **Meta Tags (client-side)** | [`react-helmet-async`](https://www.npmjs.com/package/react-helmet-async) |
| **Server** | Express, handling API routes, server-side meta tag injection, and the Satori OG image endpoint |
| **Hosting** | [Vercel](https://vercel.com/) |
| **Development Environment** | [Google AI Studio](https://ai.studio) (Build mode, powered by Gemini) |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (or an equivalent package manager, the project also ships a `bun.lock`, so [Bun](https://bun.sh/) works too)
- A [Supabase](https://supabase.com/) project (optional for exploring the UI, required for real persistent data)
- A [Gemini API key](https://ai.google.dev/) (optional, unlocks AI-generated link descriptions and the live Discover tab, both gracefully fall back without one)

### Installation and Local Development

```bash
# 1. Clone the repository
git clone https://github.com/viochris/linknest-link-in-bio.git
cd linknest-link-in-bio

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below), then run the app locally
npm run dev
```

The app will be available at `http://localhost:3000` by default.

### Setting Up Supabase
Run the SQL in `supabase/schema.sql` in your Supabase project's SQL Editor. This creates the `profiles`, `links`, `social_icons`, and `link_clicks` tables, enables Row Level Security with policies matching the access rules described above, sets up the `increment_view_count` and `increment_link_click` functions for safe anonymous counter updates, and provisions a public `avatars` storage bucket for profile picture uploads.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Express and Vite development server with hot module reloading |
| `npm run build` | Builds the client bundle with Vite and bundles the Express server into `dist/server.cjs` |
| `npm run start` | Runs the production server from the built `dist/` output |
| `npm run preview` | Serves the production client build locally for a final check |
| `npm run lint` | Runs a TypeScript type-check (`tsc --noEmit`) without emitting output |
| `npm run clean` | Removes the `dist/` build output |

### Deployment
The live demo is deployed on **Vercel**. Unlike the fully static WishBox and ForeverCard projects, LinkNest needs its Express server running (for the API routes, the server-side meta tag injection, and the Satori OG image endpoint), so `vercel.json` routes `/api/*` requests to the serverless functions and everything else to the client bundle.

---

## Project Structure

```
linknest-link-in-bio/
├── api/
│   ├── og.ts                        # Vercel serverless entry for the dynamic OG image endpoint
│   └── generate-description.ts      # Vercel serverless entry for the AI link description generator
├── server.ts                        # Express server, meta tag injection, OG image, Discover, and AI endpoints
├── supabase/
│   └── schema.sql                   # Tables, RLS policies, RPC functions, and storage bucket setup
├── src/
│   ├── components/
│   │   ├── landing/
│   │   │   └── LandingPage.tsx      # Marketing landing page for logged-out visitors at "/"
│   │   ├── auth/
│   │   │   ├── AdminLoginPage.tsx   # Login, sign-up, forgot password, and demo account access
│   │   │   └── AdminAuthModal.tsx   # Inline auth modal variant
│   │   ├── public/
│   │   │   ├── PublicProfilePage.tsx# The rendered public profile page
│   │   │   ├── DiscoverTab.tsx      # Google Search powered trending content tab
│   │   │   ├── PasswordGate.tsx     # Password-protection gate screen
│   │   │   ├── LinkButton.tsx       # Individual link button, tracks clicks
│   │   │   ├── SocialIconRow.tsx    # Social platform icon row
│   │   │   └── PublicQrCard.tsx     # Public-facing QR code card
│   │   └── dashboard/
│   │       ├── AdminDashboard.tsx   # Dashboard shell, "Your Public Page" panel, tab switching
│   │       ├── ManageLinksTab.tsx   # Link CRUD, drag-and-drop reorder, broken-link check
│   │       ├── AddEditLinkModal.tsx # Add/edit link form, AI description generator entry point
│   │       ├── ProfileThemeTab.tsx  # Appearance and Discover/password toggle settings
│   │       ├── AnalyticsTab.tsx     # Analytics summary and CSV export
│   │       ├── ClickAnalyticsChart.tsx # Recharts-based per-link click chart
│   │       ├── QrCodeTab.tsx / QrCodeGenerator.tsx / QrCodeModal.tsx # QR code generation
│   │       ├── PhonePreview.tsx     # Live phone-sized preview of the public page
│   │       └── SetupWizardModal.tsx # First-time onboarding wizard
│   ├── routes/
│   │   ├── PublicProfileRoute.tsx   # Route wrapper for "/:username"
│   │   └── AdminDashboardRoute.tsx  # Route wrapper for "/admin"
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client, plus an in-browser local simulator fallback
│   │   ├── gemini.ts                # Client-side helper calling the AI description endpoint
│   │   ├── linkMetadata.ts / profileFetcher.ts / urlValidator.ts / og.ts / csvExport.ts / domainIcons.ts
│   │   └── constants.ts
│   ├── types/index.ts               # Shared TypeScript types
│   └── App.tsx                      # Route definitions and top-level auth state
├── index.html
├── vite.config.ts
├── tsconfig.json
├── vercel.json
├── package.json
└── metadata.json
```

---

## How It Works

### Routing and Authentication State
`App.tsx` tracks a single `currentUser` state, synchronized with Supabase Auth through `getSession()` on load and an `onAuthStateChange` listener afterward. The root route (`/`) shows the `LandingPage` for a logged-out visitor and redirects to `/admin` for an authenticated one, `/admin` does the reverse, redirecting to `/admin/login` when there is no session. Successful login (including the demo account, which authenticates against a real seeded Supabase user) calls the auth state setter directly rather than waiting on the listener alone, which is what allows the demo login and any locally-simulated session to reliably land on the dashboard.

### Link CRUD Safety
Every add, edit, delete, and reorder operation in `ManageLinksTab.tsx` identifies its target exclusively by the link's database `id`. Deleting shows an inline "Are you sure you want to delete this link?" confirmation before calling Supabase, updates the local list by filtering out only the matching `id` (`prev.filter(l => l.id !== linkId)`), and on any Supabase error, surfaces a toast and triggers a re-fetch of the authoritative link list rather than leaving the UI in a state that could diverge from the database.

### Server-Side Meta Tags and the Discover Tab
`server.ts` intercepts requests to `/:username`, fetches that profile directly from Supabase, and rewrites the response HTML's `<title>`, description, and Open Graph and Twitter Card meta tags before sending it, so link-preview crawlers (which do not execute JavaScript) see accurate, per-profile content. The same server also exposes `/api/discover`, which extracts a handful of sanitized keywords from the profile's bio (stripping URLs, emails, emoji, and known prompt-injection trigger words), asks Gemini's Google Search grounding tool for trending resources related to those keywords, caches the result for 12 hours per profile, coalesces concurrent requests for the same profile into a single search, and falls back to a small curated list of resources if the live search returns nothing or the profile owner has no Gemini key configured.

### AI Link Descriptions
When generating a description for a link, the client calls `/api/generate-description`, which first scrapes the destination URL's own Open Graph and meta tags, then (if a `GEMINI_API_KEY` is configured) asks Gemini for a description under 100 characters plus three alternative tones, returned as structured JSON via a defined response schema. If no key is set, the call fails, or the response is malformed, a domain-aware heuristic generator produces tailored fallback copy for common platforms (GitHub, LinkedIn, Kaggle, X, Instagram, Medium, YouTube) so the feature never surfaces a hard error to the user.

---

## Environment Variables

Create a `.env.local` file (not committed to the repository) in the project root with the following.

```bash
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-or-publishable-key"
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="https://your-deployed-domain.com"
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` connect the app to a real Supabase project, without them, the app runs against the in-browser local simulator instead of a real database. `GEMINI_API_KEY` is read server-side only (never exposed to the client) and unlocks live AI-generated link descriptions and the Discover tab's Google Search grounding, both degrade gracefully without it. `APP_URL` tells the server what origin to use when building absolute URLs for Open Graph images and canonical links, if omitted, it is inferred from the incoming request's headers instead.

When deploying (for example on Vercel), set these same variables through the hosting provider's environment variable settings rather than relying on a local `.env.local` file, which has no effect on a deployed build.

---

## Project Background and Vibe Coding Process

LinkNest is part of a broader personal portfolio series demonstrating applied "vibe coding," the practice of using AI-assisted, prompt-driven development tools to design and ship complete, polished products outside of my primary technical focus areas (Data Science, NLP, and GenAI/LLM agent engineering). Unlike the other projects in this series, LinkNest genuinely required a real backend from the start, since a link-in-bio platform needs persistent, per-owner data and authenticated write access rather than static, hardcoded content, which is why Supabase was chosen as the foundation.

The project was designed around a written Product Requirements Document covering the public profile page, the admin dashboard, the Supabase schema, and the Row Level Security rules governing who can read and write which data. That document was then handed to Gemini inside Google AI Studio's Build mode, which generated the working application directly from the specification. From there, the app went through iterative rounds of refinement, improving the reliability of link management, the accuracy of social media link previews, the authentication flow, and the responsiveness of the dashboard across different screen sizes, alongside the addition of the Google Search powered Discover tab described above.

---

## License

This project is available for personal reference and learning purposes. Feel free to fork it and adapt it for your own use.

---

<div align="center">

**Made with 🔗 and vibe coding**

[Live Demo](https://linknest-link-in-bio.vercel.app/) · [Report an Issue](https://github.com/viochris/linknest-link-in-bio/issues)

</div>
