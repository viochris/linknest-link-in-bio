import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, localSimulator } from '../../lib/supabase';
import { Profile } from '../../types';
import {
  Sparkles,
  User,
  Camera,
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

const PRESET_AVATARS = [
  { id: 'dev', url: '/avatar-silvio.png', label: 'Silvio / Tech' },
  { id: 'creative', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', label: 'Creative' },
  { id: 'minimal', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', label: 'Modern' },
  { id: 'gradient', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', label: 'Vibrant' },
];

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  profile,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState(profile.username || '');
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '/avatar-silvio.png');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '/avatar-silvio.png');
      setStep(1);
      setUsernameError(null);
      setGeneralError(null);
      setSavedSuccess(false);
    }
  }, [isOpen, profile]);

  // Validate username format
  const sanitizeUsername = (val: string) => {
    return val.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = sanitizeUsername(e.target.value);
    setUsername(clean);
    if (clean.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
    } else {
      setUsernameError(null);
    }
  };

  // Check username availability when progressing from step 1
  const validateAndProceedToStep2 = async () => {
    const clean = username.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setUsernameError('Please choose a username with at least 3 characters');
      return;
    }

    // If unchanged, proceed directly
    if (clean === profile.username.toLowerCase()) {
      setStep(2);
      return;
    }

    setUsernameChecking(true);
    setUsernameError(null);

    try {
      // Check Supabase profiles
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .neq('id', profile.id)
        .maybeSingle();

      if (existingUser) {
        setUsernameError(`@${clean} is already claimed by another user. Try adding numbers or initials.`);
        return;
      }

      setStep(2);
    } catch {
      // In simulator or offline, allow
      setStep(2);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Handle avatar upload via file input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setGeneralError('Image must be smaller than 5MB');
      return;
    }

    setUploadingAvatar(true);
    setGeneralError(null);

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadErr) {
        throw uploadErr;
      }

      const publicUrl = supabase.storage
        .from('avatars')
        .getPublicUrl(data?.path || filePath).data.publicUrl;

      setAvatarUrl(publicUrl);
    } catch {
      // Immediate local Data URL fallback so the user always has a seamless preview
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save wizard updates and mark as completed
  const handleCompleteWizard = async () => {
    setSaving(true);
    setGeneralError(null);

    const finalUsername = sanitizeUsername(username) || profile.username;
    const finalDisplayName = displayName.trim() || profile.display_name || finalUsername;
    const finalAvatar = avatarUrl || profile.avatar_url;

    const updatedProfile: Profile = {
      ...profile,
      username: finalUsername,
      display_name: finalDisplayName,
      avatar_url: finalAvatar,
    };

    try {
      // 1. Update in remote Supabase
      await supabase
        .from('profiles')
        .update({
          username: finalUsername,
          display_name: finalDisplayName,
          avatar_url: finalAvatar,
        })
        .eq('id', profile.id);

      // 2. Update local simulator
      try {
        localSimulator
          .from('profiles')
          .update({
            username: finalUsername,
            display_name: finalDisplayName,
            avatar_url: finalAvatar,
          })
          .eq('id', profile.id);
      } catch {}

      // 3. Mark wizard completed in local storage
      const wizardKey = `setup_wizard_completed_${profile.user_id || profile.id}`;
      localStorage.setItem(wizardKey, 'true');

      setSavedSuccess(true);
      setTimeout(() => {
        onComplete(updatedProfile);
        onClose();
      }, 1000);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    const wizardKey = `setup_wizard_completed_${profile.user_id || profile.id}`;
    localStorage.setItem(wizardKey, 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="setup-wizard-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        id="setup-wizard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-wizard-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left my-8"
      >
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">
              New Creator Setup Wizard
            </span>
          </div>

          <button
            id="close-wizard-btn"
            type="button"
            onClick={handleSkip}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              step >= 1 ? 'bg-indigo-500' : 'bg-slate-800'
            }`}
          />
          <div
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              step >= 2 ? 'bg-indigo-500' : 'bg-slate-800'
            }`}
          />
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        {/* Success Splash */}
        {savedSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">You're All Set!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your custom username and profile picture have been saved. Launching your LinkNest dashboard...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* ================= STEP 1: CHOOSE USERNAME ================= */
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 id="setup-wizard-title" className="text-xl font-bold text-white tracking-tight">
                    Step 1: Choose Your Custom Username
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Pick a clean, memorable handle. This creates your permanent public link-in-bio URL.
                  </p>
                </div>

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Custom Username
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-semibold text-indigo-400 font-mono select-none">
                      @
                    </span>
                    <input
                      id="wizard-username-input"
                      type="text"
                      required
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="yourname"
                      maxLength={30}
                      className={`w-full bg-slate-950 border rounded-xl py-3 pl-8 pr-10 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                        usernameError
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {username && !usernameError && (
                      <span className="absolute right-3.5 text-emerald-400">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  {usernameError && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{usernameError}</span>
                    </p>
                  )}
                </div>

                {/* Optional Display Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      id="wizard-display-name-input"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Live URL Preview Pill */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400 truncate">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      Your link: <strong className="text-indigo-300 font-mono">linknest.app/{username || 'username'}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">
                    Live Link
                  </span>
                </div>

                {/* Step 1 Actions */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800/70">
                  <button
                    id="wizard-step1-skip-btn"
                    type="button"
                    onClick={handleSkip}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800"
                  >
                    Skip setup
                  </button>
                  <button
                    id="wizard-step1-next-btn"
                    type="button"
                    onClick={validateAndProceedToStep2}
                    disabled={usernameChecking || !username || !!usernameError}
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                  >
                    {usernameChecking ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue to Photo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ================= STEP 2: PROFILE PICTURE ================= */
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 id="setup-wizard-title" className="text-xl font-bold text-white tracking-tight">
                    Step 2: Upload Your Profile Picture
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Upload a custom portrait or select a preset avatar for @{username}.
                  </p>
                </div>

                {/* Avatar Display & Upload Area */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                  <div className="relative group shrink-0">
                    <img
                      id="wizard-avatar-preview"
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/60 ring-4 ring-indigo-500/10 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatar-silvio.png';
                      }}
                    />
                    <label
                      htmlFor="wizard-avatar-file-input"
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity"
                    >
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-semibold">Change</span>
                    </label>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <p className="text-xs font-semibold text-slate-200">
                      Upload from your device
                    </p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      PNG, JPG, or WebP up to 5MB. Square aspect ratio recommended.
                    </p>
                    <div className="pt-1">
                      <label
                        htmlFor="wizard-avatar-file-input"
                        className={`inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 cursor-pointer transition-all ${
                          uploadingAvatar ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {uploadingAvatar ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>{uploadingAvatar ? 'Uploading...' : 'Choose Image File'}</span>
                      </label>
                      <input
                        id="wizard-avatar-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatar Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Or pick from sample avatars:
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {PRESET_AVATARS.map((p) => {
                      const isSelected = avatarUrl === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAvatarUrl(p.url)}
                          className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.label}
                            className="w-10 h-10 rounded-full object-cover mb-1 border border-slate-700"
                          />
                          <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800/70">
                  <button
                    id="wizard-back-to-step1-btn"
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      id="wizard-step2-skip-btn"
                      type="button"
                      onClick={handleSkip}
                      disabled={saving}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800"
                    >
                      Skip
                    </button>
                    <button
                      id="wizard-finish-btn"
                      type="button"
                      onClick={handleCompleteWizard}
                      disabled={saving || uploadingAvatar}
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save & Launch Dashboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
