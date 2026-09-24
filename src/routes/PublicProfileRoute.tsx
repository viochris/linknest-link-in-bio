import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MetaTags } from '../components/common/MetaTags';
import { PublicProfilePage } from '../components/public/PublicProfilePage';
import { fetchUserProfileData } from '../lib/profileFetcher';
import { generateProfileSEO } from '../utils/seo';
import { Profile } from '../types';

export type { MetaTagsProps } from '../components/common/MetaTags';
export { fetchUserProfileData } from '../lib/profileFetcher';
export { generateProfileSEO } from '../utils/seo';

export const PublicProfileRoute: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const rawUsername = username?.trim() || 'demo';
  const cleanUsername = rawUsername.toLowerCase();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Use the dedicated helper function to fetch profile data
  useEffect(() => {
    let isMounted = true;
    setProfile(null);

    fetchUserProfileData(cleanUsername).then((fetchedProfile) => {
      if (isMounted && fetchedProfile) {
        setProfile(fetchedProfile);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cleanUsername]);

  // Generate standardized SEO, Open Graph, and Twitter metadata using src/utils/seo.ts
  const seo = generateProfileSEO({
    profile,
    username: cleanUsername,
  });

  return (
    <div className="public-profile-route min-h-screen bg-slate-950 w-full max-w-full overflow-x-hidden flex flex-col items-center justify-start">
      {/* Dynamic meta tag system using react-helmet-async for search engine indexing */}
      <Helmet key={`helmet-${cleanUsername}`}>
        {/* Dynamic Standard Meta */}
        <title>{seo.standard.title}</title>
        <meta name="title" content={seo.standard.title} />
        <meta name="description" content={seo.standard.description} />
        <meta name="keywords" content={seo.standard.keywords} />
        <meta name="author" content={seo.standard.author} />
        <meta name="robots" content={seo.standard.robots} />
        <link rel="canonical" href={seo.standard.canonicalUrl} />

        {/* Dynamic Standardized Open Graph Meta Tags */}
        <meta property="og:site_name" content={seo.openGraph.siteName} />
        <meta property="og:type" content={seo.openGraph.type} />
        <meta property="og:title" content={seo.openGraph.title} />
        <meta property="og:description" content={seo.openGraph.description} />
        <meta property="og:url" content={seo.openGraph.url} />
        <meta property="og:image" content={seo.openGraph.image} />
        <meta property="og:image:secure_url" content={seo.openGraph.imageSecureUrl} />
        <meta property="og:image:alt" content={seo.openGraph.imageAlt} />
        <meta property="profile:username" content={seo.openGraph.profileUsername} />

        {/* Dynamic Standardized Twitter Card Meta Tags */}
        <meta name="twitter:card" content={seo.twitter.card} />
        <meta name="twitter:site" content={seo.twitter.site} />
        <meta name="twitter:creator" content={seo.twitter.creator} />
        <meta name="twitter:title" content={seo.twitter.title} />
        <meta name="twitter:description" content={seo.twitter.description} />
        <meta name="twitter:image" content={seo.twitter.image} />
        <meta name="twitter:image:alt" content={seo.twitter.imageAlt} />

        {/* JSON-LD Structured Data Schema */}
        <script type="application/ld+json">
          {JSON.stringify(seo.jsonLd)}
        </script>
      </Helmet>

      {/* Dynamic Open Graph Image & JSON-LD MetaTags component */}
      <MetaTags
        key={`meta-${cleanUsername}`}
        profile={profile}
        displayName={seo.displayName}
        bio={profile?.bio}
        avatarUrl={seo.avatarUrl}
        username={cleanUsername}
        canonicalUrl={seo.canonicalUrl}
        ogImageUrl={seo.openGraph.image}
      />

      {/* 
        Container layout:
        - Link container has max-width on larger screens (max-w-xl) while remaining full-width on mobile (w-full)
        - Consistent vertical spacing between social icon rows
        - Enhanced prominent avatar sizing and hierarchy (144px to 192px)
      */}
      <div className="w-full max-w-full flex flex-col items-center justify-start [&_.link-container]:w-full [&_.link-container]:max-w-xl [&_.link-container]:mx-auto [&_.social-icon-row]:my-4 [&_.social-icon-row]:gap-y-3.5 [&_.profile-avatar-container]:w-36 [&_.profile-avatar-container]:h-36 sm:[&_.profile-avatar-container]:w-44 sm:[&_.profile-avatar-container]:h-44 md:[&_.profile-avatar-container]:w-48 md:[&_.profile-avatar-container]:h-48">
        <PublicProfilePage
          username={cleanUsername}
          onProfileLoaded={(loaded) => setProfile(loaded)}
        />
      </div>
    </div>
  );
};

