-- ==============================================================================
-- LinkNest — Supabase Database Schema, Row Level Security (RLS) & RPC Functions
-- Corresponds to PRD Sections 7.3 and 7.4
-- ==============================================================================

-- 1. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url VARCHAR(500) DEFAULT '',
    theme JSONB NOT NULL DEFAULT '{
      "bg_type": "preset",
      "bg_value": "gradient-midnight",
      "button_style": "rounded",
      "button_bg": "#1e293b",
      "button_text": "#ffffff",
      "accent_color": "#6366f1",
      "font_family": "Plus Jakarta Sans",
      "show_view_count": true
    }'::jsonb,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on username for high-performance public profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);

-- 3. Links Table
CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    icon VARCHAR(64) DEFAULT 'globe',
    category VARCHAR(64) DEFAULT 'General',
    description TEXT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE NULL,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    click_count INTEGER NOT NULL DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure backwards compatibility if links table was created prior to description/category columns
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'General';

CREATE INDEX IF NOT EXISTS idx_links_profile_position ON public.links (profile_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_links_active_dates ON public.links (is_active, start_date, end_date);

-- 4. Social Icons Table
CREATE TABLE IF NOT EXISTS public.social_icons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_social_icons_profile ON public.social_icons (profile_id, position ASC);

-- ==============================================================================
-- 5. Row Level Security (RLS) Policies (PRD Section 7.4)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_icons ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Public read access: Anyone can read profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Authenticated owner can create their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Authenticated owner can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Authenticated owner can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = user_id);


-- Links Policies
-- Public read: Anonymous visitors can ONLY see active links within start/end date window
-- Owner read: Profile owner can see ALL their links (active, inactive, scheduled, expired)
CREATE POLICY "Active links are viewable by public, all links viewable by owner" 
ON public.links FOR SELECT 
USING (
    (
        is_active = true 
        AND (start_date IS NULL OR start_date <= timezone('utc'::text, now()))
        AND (end_date IS NULL OR end_date >= timezone('utc'::text, now()))
    )
    OR 
    (
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = links.profile_id)
    )
);

-- Owner can insert links for their profile
CREATE POLICY "Users can insert links to their own profiles" 
ON public.links FOR INSERT 
WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = links.profile_id)
);

-- Owner can update their links
CREATE POLICY "Users can update links of their own profiles" 
ON public.links FOR UPDATE 
USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = links.profile_id)
);

-- Owner can delete their links
CREATE POLICY "Users can delete links of their own profiles" 
ON public.links FOR DELETE 
USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = links.profile_id)
);


-- Social Icons Policies
-- Public read: Anyone can see social icons
CREATE POLICY "Social icons are viewable by everyone" 
ON public.social_icons FOR SELECT 
USING (true);

-- Owner can insert social icons
CREATE POLICY "Users can insert social icons to their profile" 
ON public.social_icons FOR INSERT 
WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = social_icons.profile_id)
);

-- Owner can update social icons
CREATE POLICY "Users can update their social icons" 
ON public.social_icons FOR UPDATE 
USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = social_icons.profile_id)
);

-- Owner can delete social icons
CREATE POLICY "Users can delete their social icons" 
ON public.social_icons FOR DELETE 
USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = social_icons.profile_id)
);

-- ==============================================================================
-- 6. RPC Functions for Anonymous View and Click Increments (PRD Section 7.4)
-- ==============================================================================

-- Function to safely increment profile view count without granting update rights to public
CREATE OR REPLACE FUNCTION public.increment_view_count(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET view_count = view_count + 1
    WHERE id = p_profile_id;
END;
$$;

-- Function to safely increment link click count and record last_clicked_at and click event
CREATE TABLE IF NOT EXISTS public.link_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_agent TEXT,
    referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_clicks_profile_time ON public.link_clicks (profile_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link ON public.link_clicks (link_id, clicked_at DESC);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Public can insert click records via RPC; profile owners can view their click analytics
CREATE POLICY "Profile owners can view their link clicks"
ON public.link_clicks FOR SELECT
USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = link_clicks.profile_id)
);

CREATE OR REPLACE FUNCTION public.increment_link_click(p_link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    UPDATE public.links
    SET click_count = click_count + 1,
        last_clicked_at = timezone('utc'::text, now())
    WHERE id = p_link_id
    RETURNING profile_id INTO v_profile_id;

    IF v_profile_id IS NOT NULL THEN
        INSERT INTO public.link_clicks (link_id, profile_id, clicked_at)
        VALUES (p_link_id, v_profile_id, timezone('utc'::text, now()));
    END IF;
END;
$$;

-- ==============================================================================
-- 7. Supabase Storage Bucket Setup (for Avatar uploads)
-- ==============================================================================
-- Run in Supabase SQL editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
