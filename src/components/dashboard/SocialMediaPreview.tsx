import React from 'react';
import { Profile } from '../../types';
import { SeoVisualPreview, SeoVisualPreviewProps } from './SeoVisualPreview';

export interface SocialMediaPreviewProps {
  profile: Profile;
  linksCount?: number;
  metaTitle?: string;
  metaDescription?: string;
}

/**
 * Backward-compatible wrapper that renders the enhanced SeoVisualPreview component,
 * supporting Google Search SERP, X (Twitter), LinkedIn, and chat cards with live title/desc sync.
 */
export const SocialMediaPreview: React.FC<SocialMediaPreviewProps> = (props) => {
  return <SeoVisualPreview {...props} />;
};

export { SeoVisualPreview };
