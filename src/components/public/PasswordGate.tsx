import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Profile, ThemeConfig } from '../../types';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface PasswordGateProps {
  profile: Profile;
  theme: ThemeConfig;
  onUnlock: () => void;
  onOpenDashboard?: () => void;
  isOwner?: boolean;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({
  profile,
  theme,
  onUnlock,
  onOpenDashboard,
  isOwner = false,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Background determination
  const containerStyle: React.CSSProperties = {
    background: theme.bg_value || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #000000 100%)',
    fontFamily: `"${theme.font_family || 'Plus Jakarta Sans'}", sans-serif`,
  };

  const isLight =
    theme.bg_value.toLowerCase().includes('f8fafc') ||
    theme.bg_value.toLowerCase().includes('fdfbf7') ||
    theme.bg_value.toLowerCase().includes('ffffff') ||
    theme.bg_value.toLowerCase().includes('light');

  const textContrastClass = isLight ? 'text-slate-900' : 'text-white';
  const subtextContrastClass = isLight ? 'text-slate-600' : 'text-slate-300';
  const cardBgClass = isLight
    ? 'bg-white/80 border-slate-200/90 text-slate-900 shadow-xl'
    : 'bg-slate-900/80 border-slate-800 text-white shadow-2xl';

  const expectedPassword = (
    profile.profile_password ||
    profile.theme?.profile_password ||
    ''
  ).trim();

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const entered = passwordInput.trim();
    if (!entered) {
      setError('Please enter the password to view this profile.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      // Direct comparison
      if (entered === expectedPassword) {
        try {
          sessionStorage.setItem(`unlocked_profile_${profile.id}`, 'true');
        } catch {}
        onUnlock();
      } else {
        setError('Incorrect password. Please verify and try again.');
        setIsVerifying(false);
      }
    }, 200);
  };

  const handleOwnerBypass = () => {
    try {
      sessionStorage.setItem(`unlocked_profile_${profile.id}`, 'true');
    } catch {}
    onUnlock();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors relative overflow-hidden"
      style={containerStyle}
    >
      {/* Background ambient glow */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundColor: theme.accent_color || '#6366f1' }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ backgroundColor: theme.accent_color || '#6366f1' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`max-w-md w-full rounded-3xl p-6 sm:p-8 backdrop-blur-xl border ${cardBgClass} relative z-10`}
      >
        {/* Profile Avatar with Lock Overlay */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3.5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-20 h-20 rounded-full object-cover ring-4 shadow-lg"
                style={{ ringColor: `${theme.accent_color || '#6366f1'}40` }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: theme.accent_color || '#6366f1' }}
              >
                {profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md ring-2 ring-slate-900"
              style={{ backgroundColor: theme.accent_color || '#6366f1' }}
            >
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <h2 className={`text-xl font-bold ${textContrastClass}`}>
            {profile.display_name}
          </h2>
          <span className="text-xs font-mono text-indigo-400 mt-0.5">
            @{profile.username}
          </span>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>Password Protected Profile</span>
          </div>

          <p className={`text-xs ${subtextContrastClass} mt-3 leading-relaxed max-w-xs`}>
            This profile is private. Please enter the password provided by the creator to view their links and updates.
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold ${subtextContrastClass} mb-1.5 text-left`}>
              Access Password
            </label>
            <div className="relative">
              <input
                id="profile-password-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all outline-none pr-11 ${
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500'
                    : 'bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            id="unlock-profile-btn"
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            style={{
              backgroundColor: theme.accent_color || '#6366f1',
              boxShadow: `0 10px 25px -5px ${theme.accent_color || '#6366f1'}40`,
            }}
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock Profile</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer / Owner Options */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center gap-2.5 text-center">
          {isOwner && (
            <button
              type="button"
              onClick={handleOwnerBypass}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>You own this profile (Bypass Gate)</span>
            </button>
          )}

          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Profile &amp; Security in Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
