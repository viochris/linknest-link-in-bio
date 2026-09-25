import React, { useState, useEffect } from 'react';
import { Profile, LinkItem, SocialIconItem, ThemeConfig, ButtonStyle } from '../../types';
import { supabase, resetTrialData, deleteUserAccount, localSimulator } from '../../lib/supabase';
import { THEME_PRESETS, FONT_OPTIONS, SOCIAL_PLATFORMS, DEFAULT_AVATARS } from '../../lib/constants';
import { RenderIcon } from '../../lib/icons';
import { generateClientOgSvg, buildOgImageUrl } from '../../lib/og';
import {
  Upload,
  Sparkles,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Palette,
  User,
  Share2,
  Type,
  Layout,
  ExternalLink,
  Smartphone,
  Image as ImageIcon,
  Copy,
  Check,
  QrCode,
  Download,
  Compass,
  Globe,
  Search,
  RotateCcw,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { SeoVisualPreview } from './SeoVisualPreview';

interface ProfileThemeTabProps {
  profile: Profile;
  links: LinkItem[];
  socialIcons: SocialIconItem[];
  onProfileUpdated: (updatedProfile: Profile) => void;
  onSocialUpdated: () => void;
  onAccountDeleted?: () => void;
}

export const ProfileThemeTab: React.FC<ProfileThemeTabProps> = ({
  profile,
  links,
  socialIcons,
  onProfileUpdated,
  onSocialUpdated,
  onAccountDeleted,
}) => {
  // Form State
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');

  // SEO Meta State
  const [metaTitle, setMetaTitle] = useState(profile.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(profile.meta_description || '');

  // Password Protection State
  const [isPasswordProtected, setIsPasswordProtected] = useState(
    Boolean(profile.is_password_protected || profile.theme?.is_password_protected)
  );
  const [profilePassword, setProfilePassword] = useState(
    profile.profile_password || profile.theme?.profile_password || ''
  );
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<ThemeConfig>({ ...profile.theme });

  // Social Icons State
  const [localSocial, setLocalSocial] = useState<SocialIconItem[]>([...socialIcons]);
  const [newPlatform, setNewPlatform] = useState('github');
  const [newUrl, setNewUrl] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync state if profile prop changes
  useEffect(() => {
    setDisplayName(profile.display_name);
    setUsername(profile.username);
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '');
    setMetaTitle(profile.meta_title || '');
    setMetaDescription(profile.meta_description || '');
    setTheme({ ...profile.theme });
    setLocalSocial([...socialIcons]);
    setIsPasswordProtected(Boolean(profile.is_password_protected || profile.theme?.is_password_protected));
    setProfilePassword(profile.profile_password || profile.theme?.profile_password || '');
  }, [profile, socialIcons]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';
  const currentProfileUrl = `${origin}/${username || profile.username}`;

  // Avatar file upload (Supabase Storage / local preview)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadErr) {
        throw uploadErr;
      }

      const publicUrl = supabase.storage.from('avatars').getPublicUrl(data?.path || filePath).data.publicUrl;
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.warn('Storage upload error, using local data URL fallback:', err);
      // Fallback to local Data URL
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Add social link
  const handleAddSocial = () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (newPlatform === 'email' && !url.startsWith('mailto:')) {
      url = `mailto:${url}`;
    } else if (!url.startsWith('http') && !url.startsWith('mailto:')) {
      url = `https://${url}`;
    }

    const newItem: SocialIconItem = {
      id: 'soc_' + Math.random().toString(36).substring(2, 9),
      profile_id: profile.id,
      platform: newPlatform,
      url,
      position: localSocial.length,
    };

    setLocalSocial([...localSocial, newItem]);
    setNewUrl('');
  };

  // Remove social link
  const handleRemoveSocial = (id: string) => {
    setLocalSocial(localSocial.filter((s) => s.id !== id));
  };

  // Apply Theme Preset
  const handleSelectPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTheme({ ...preset.theme });
    }
  };

  // Save All Changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
      if (!cleanUsername) {
        throw new Error('Please specify a valid username.');
      }

      // Check username uniqueness if changed (AC8)
      if (cleanUsername !== profile.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existing && existing.id !== profile.id) {
          throw new Error(`Username "@${cleanUsername}" is already taken. Please choose another.`);
        }
      }

      if (isPasswordProtected && !profilePassword.trim()) {
        throw new Error('Please specify an access password for your protected profile, or disable password protection.');
      }

      const updatedTheme: ThemeConfig = {
        ...theme,
        is_password_protected: isPasswordProtected,
        profile_password: isPasswordProtected ? profilePassword.trim() : null,
      };

      // 1. Update Profile in Supabase
      const updatedProfileData: Partial<Profile> = {
        display_name: displayName.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        avatar_url: avatarUrl,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
        is_password_protected: isPasswordProtected,
        profile_password: isPasswordProtected ? profilePassword.trim() : null,
        theme: updatedTheme,
      };

      const { error: profileErr } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', profile.id);

      if (profileErr && !String(profileErr.message || '').includes('invalid input syntax')) {
        console.warn('Supabase remote profile update note:', profileErr);
      }

      // Also sync to local simulator directly
      try {
        await localSimulator.from('profiles').update(updatedProfileData).eq('id', profile.id);
      } catch {}

      // 2. Sync Social Icons in Supabase
      try {
        await supabase.from('social_icons').delete().eq('profile_id', profile.id);
        if (localSocial.length > 0) {
          const formatted = localSocial.map((item, idx) => ({
            profile_id: profile.id,
            platform: item.platform,
            url: item.url,
            position: idx,
          }));
          await supabase.from('social_icons').insert(formatted);
          try {
            await localSimulator.from('social_icons').delete().eq('profile_id', profile.id);
            await localSimulator.from('social_icons').insert(formatted);
          } catch {}
        }
      } catch (socialErr) {
        console.warn('Social icons sync note:', socialErr);
      }

      // 3. Persist in local storage so theme & settings are permanently preserved
      const merged: Profile = {
        ...profile,
        ...updatedProfileData,
      } as Profile;

      try {
        localStorage.setItem('linknest_custom_profile_' + profile.id, JSON.stringify(merged));
        localStorage.setItem('linknest_custom_social_' + profile.id, JSON.stringify(localSocial));
      } catch {}

      // Update parent component state
      onProfileUpdated(merged);
      onSocialUpdated();
      setSuccessMsg('Settings and theme updated successfully! Live on your public page.');
      setShowSaveSuccessModal(true);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  // Permanently delete user account
  const handleDeleteAccount = async () => {
    const targetText = deleteConfirmText.trim();
    const isConfirmed =
      targetText.toLowerCase() === username.toLowerCase() ||
      targetText.toUpperCase() === 'DELETE' ||
      targetText.toLowerCase() === (profile.display_name || '').toLowerCase();

    if (!isConfirmed) {
      setDeleteError(`Please type "${username}" or "DELETE" to confirm.`);
      return;
    }

    setDeleteError(null);
    setIsDeletingAccount(true);
    try {
      const { error: delErr } = await deleteUserAccount(profile.user_id || profile.id, profile.id);
      if (delErr) {
        throw delErr;
      }
      setShowDeleteModal(false);
      if (onAccountDeleted) {
        onAccountDeleted();
      } else {
        window.location.href = '/admin/login?deleted=true';
      }
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const currentPreviewProfile: Profile = {
    ...profile,
    display_name: displayName,
    username,
    bio,
    avatar_url: avatarUrl,
    meta_title: metaTitle,
    meta_description: metaDescription,
    theme,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Profile & Theme Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Customize your bio, social platforms, fonts, and theme colors.
          </p>
        </div>

        <button
          id="save-changes-header-btn"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 w-full min-w-0">
          {/* Section 1: Basic Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Profile Details
            </h3>

            {/* Avatar Upload / Pick */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Avatar Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-indigo-500/40 shrink-0">
                  <img
                    src={avatarUrl || profile.avatar_url || '/icon.svg'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    JPG, PNG or WEBP. Uploads to Supabase Storage bucket.
                  </p>
                </div>
              </div>

              {/* Quick Preset Avatars */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[11px] text-slate-400">Or pick preset:</span>
                <div className="flex gap-1.5">
                  {DEFAULT_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border transition-transform hover:scale-110 ${
                        avatarUrl === url ? 'border-indigo-500 ring-2 ring-indigo-500/40' : 'border-slate-700 opacity-60'
                      }`}
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Name
              </label>
              <input
                id="settings-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full or artist name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Username / Slug (AC8) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username / Public Slug
              </label>
              <div className="relative flex items-center">
                <span className="text-xs font-mono text-slate-500 absolute left-3">
                  linknest.app/
                </span>
                <input
                  id="settings-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                  }
                  placeholder="username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-28 pr-3 text-sm font-mono text-indigo-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Must be unique. Validated against Supabase database on save (AC8).
              </p>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Bio / Tagline
                </label>
                <span className="text-[10px] text-slate-500">{bio.length}/160</span>
              </div>
              <textarea
                id="settings-bio"
                rows={3}
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A brief introduction or description about yourself..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Section 2: SEO & Meta Tag Customization (react-helmet-async) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                SEO &amp; Search Metadata
              </h3>
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                react-helmet-async
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Customize how your profile page appears in Google search engine results and social media cards (WhatsApp, Twitter/X, LinkedIn, Discord).
            </p>

            {/* Meta Title Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="seo-meta-title" className="text-xs font-semibold text-slate-300">
                  Meta Title (Page Title &amp; og:title)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMetaTitle(`${displayName || username} (@${username || profile.username}) | LinkNest`)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    metaTitle.length >= 30 && metaTitle.length <= 60
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {metaTitle.length}/60 chars (ideal: 30–60)
                  </span>
                </div>
              </div>
              <input
                id="seo-meta-title"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={`e.g. ${displayName || 'Alex Rivera'} – Creative Technologist & UI Engineer`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                Shown as the clickable headline in Google search snippets and browser tab titles.
              </p>
            </div>

            {/* Meta Description Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="seo-meta-description" className="text-xs font-semibold text-slate-300">
                  Meta Description (Google Snippet &amp; og:description)
                </label>
                <div className="flex items-center gap-2">
                  {bio && (
                    <button
                      type="button"
                      onClick={() => setMetaDescription(bio)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                    >
                      Copy from Bio
                    </button>
                  )}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    metaDescription.length >= 120 && metaDescription.length <= 160
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {metaDescription.length}/160 chars (ideal: 120–160)
                  </span>
                </div>
              </div>
              <textarea
                id="seo-meta-description"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="e.g. Explore my portfolio, open-source projects, and curated creative tech resources on LinkNest."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <p className="text-[11px] text-slate-500">
                A 1–2 sentence summary explaining your value proposition to search engine users.
              </p>
            </div>

            {/* Live Visual SEO & Google Search Snippet Preview */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>Google Search Snippet Preview</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Updates in real time as you edit Meta Title &amp; Description
                </span>
              </div>

              <SeoVisualPreview
                profile={currentPreviewProfile}
                linksCount={links.length}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
              />
            </div>

            {/* Trial / Demo Data Reset Option */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restore Sample Data / Reset Demo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Restore links and profile to clean, professional sample data if trial changes become cluttered.
                </p>
              </div>
              <button
                type="button"
                id="reset-trial-data-btn"
                onClick={() => {
                  if (window.confirm('Restore links and profile to clean, organized sample data?')) {
                    setResettingDemo(true);
                    const success = resetTrialData(profile.username);
                    if (success) {
                      setSuccessMsg('Sample data restored successfully! Refreshing...');
                      setTimeout(() => {
                        window.location.reload();
                      }, 600);
                    }
                  }
                }}
                disabled={resettingDemo}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resettingDemo ? 'animate-spin' : ''}`} />
                <span>{resettingDemo ? 'Restoring...' : 'Restore Sample Data'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Social Icons Manager (PRD Screen 4) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              Social Icons Row
            </h3>
            <p className="text-xs text-slate-400">
              Add your social media profiles. These will appear as quick icons below your bio.
            </p>

            {/* Current Social Links */}
            <div className="space-y-2">
              {localSocial.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 px-3 text-xs"
                >
                  <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-300">
                    <RenderIcon name={item.platform} className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-200 capitalize w-20 truncate">
                    {item.platform}
                  </span>
                  <span className="text-slate-500 truncate flex-1 font-mono text-[11px]">
                    {item.url}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Social Input */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://... or username"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={handleAddSocial}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Section 3: Theme Customization (AC6 & Screen 4) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              Theme & Styling
            </h3>

            {/* Theme Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Color Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      theme.bg_value === preset.theme.bg_value
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-800'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-inner"
                      style={{ background: preset.previewBg }}
                    />
                    <div className="truncate text-xs">
                      <span className="block font-semibold text-white truncate">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {preset.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Button Style Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Button Shape & Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['rounded', 'pill', 'sharp', 'glass', 'outline', 'shadow'] as ButtonStyle[]).map(
                  (style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTheme({ ...theme, button_style: style })}
                      className={`py-2 px-3 text-xs font-semibold capitalize border rounded-xl transition-all ${
                        theme.button_style === style
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {style}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Typography / Font Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Font Family
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTheme({ ...theme, font_family: f.id })}
                    className={`py-2 px-2.5 text-xs border rounded-xl transition-all text-left truncate ${
                      theme.font_family === f.id
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-semibold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate block">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Featured Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accent_color || '#818cf8'}
                    onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                    className="w-9 h-9 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.accent_color || '#818cf8'}
                    onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Discover Tab (Google Search Grounding) Toggle */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-start justify-between gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        Discover Tab (Google Search Grounding)
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">
                        AI Grounded
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Show trending articles and resources grounded in Google Search based on your bio interests on your public profile page.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="toggle-discover-tab"
                    checked={theme.show_discover_tab !== false}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        show_discover_tab: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* QR Code on Public Profile Toggle */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 shrink-0 mt-0.5">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        Show QR Code Card on Public Profile
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                        Scan &amp; Download
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Display an interactive QR code badge and scan card on your public bio page so visitors can instantly scan with their mobile devices or download the high-res PNG.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="toggle-qr-code-page"
                    checked={Boolean(theme.show_qr_code)}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        show_qr_code: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Optional Profile Password Protection Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          Password Protected Public Profile
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                            isPasswordProtected
                              ? 'bg-amber-900/60 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isPasswordProtected ? 'Protected' : 'Public'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Require visitors to enter an access password before viewing your profile links and content.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      id="toggle-profile-password"
                      checked={isPasswordProtected}
                      onChange={(e) => {
                        setIsPasswordProtected(e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {isPasswordProtected && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Profile Access Password</span>
                        <span className="text-[11px] text-amber-400 font-normal">
                          {profilePassword.length > 0 ? `${profilePassword.length} characters` : 'Required'}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          id="profile-password-field"
                          type={showPasswordText ? 'text' : 'password'}
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          placeholder="e.g. VIP2026, secret-pass, coffee-club"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordText(!showPasswordText)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                          title={showPasswordText ? 'Hide password' : 'Show password'}
                        >
                          {showPasswordText ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        When enabled, visitors will see the branded Password Gate screen and must enter this password to view your links.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Submit Button */}
          <div className="pt-2">
            <button
              id="save-settings-submit-btn"
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </form>

        {/* Danger Zone: Delete Account */}
        <div className="mt-8 pt-6 border-t border-rose-500/20">
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <h3 className="text-sm font-bold text-white">Danger Zone: Delete Account</h3>
                </div>
                <p className="text-xs text-rose-200/80 leading-relaxed max-w-xl">
                  Permanently delete your LinkNest account, release public username (@{username}), and wipe all links, click analytics, and profile settings.
                </p>
              </div>
              <button
                type="button"
                id="open-delete-account-modal-btn"
                onClick={() => {
                  setDeleteConfirmText('');
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-sm min-h-[40px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
          >
            <div
              className="bg-slate-900 border border-rose-500/30 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white">
                    Delete Account Permanently?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This action is irreversible. All of your created links, custom theme, and historical click analytics will be completely erased.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <span>The following data will be erased:</span>
                </div>
                <ul className="space-y-1 text-slate-400 pl-4 list-disc text-[11px]">
                  <li>Public username <span className="font-mono text-white">@{username}</span> will be freed up</li>
                  <li>All <span className="text-white font-medium">{links.length} links</span> and click events</li>
                  <li>Custom theme presets, avatar, and social icons</li>
                  <li>Your login credentials and active sessions</li>
                </ul>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Type <span className="font-mono font-bold text-rose-400">{username}</span> or <span className="font-mono font-bold text-rose-400">DELETE</span> to confirm:
                </label>
                <input
                  id="delete-account-confirm-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={username}
                  disabled={isDeletingAccount}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  id="cancel-delete-account-btn"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-delete-account-btn"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || !deleteConfirmText.trim()}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer min-h-[42px]"
                >
                  {isDeletingAccount ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Forever</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Success Confirmation Popup Modal */}
      {showSaveSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowSaveSuccessModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X Button */}
            <button
              type="button"
              id="close-save-modal-x-btn"
              onClick={() => setShowSaveSuccessModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Icon & Title */}
            <div className="flex flex-col items-center text-center space-y-2 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Changes Saved Successfully!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                Your profile, theme, and settings have been saved and are immediately active on your public page.
              </p>
            </div>

            {/* Snapshot Summary Box */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl || profile.avatar_url || '/icon.svg'}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate text-sm">
                    {displayName || username}
                  </p>
                  <p className="text-slate-400 font-mono text-[11px] truncate">
                    @{username}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                  Live Active
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Active Theme:</span>
                <span className="font-semibold text-indigo-300">{theme.name || 'Custom Theme'}</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Social Accounts:</span>
                <span className="font-semibold text-slate-200">{localSocial.length} Connected</span>
              </div>

              {/* Public URL Box */}
              <div className="pt-1">
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs">
                  <span className="font-mono text-slate-300 truncate px-1 text-[11px]">
                    {currentProfileUrl}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(currentProfileUrl);
                      setCopiedPublicUrl(true);
                      setTimeout(() => setCopiedPublicUrl(false), 2000);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedPublicUrl ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Public Profile</span>
              </a>

              <button
                type="button"
                id="close-save-success-modal-btn"
                onClick={() => setShowSaveSuccessModal(false)}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <span>Got it</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
