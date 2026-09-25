import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { formatAuthError } from './AdminLoginPage';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Log in via Supabase Auth (PRD Section 7.2)
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authErr) {
          setError(formatAuthError(authErr.message));
          setLoading(false);
          return;
        }

        onSuccess();
        onClose();
      } else {
        // Sign up with username validation (PRD AC8)
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
        if (!cleanUsername) {
          setError('Please choose a valid username (letters, numbers, underscores, dashes).');
          setLoading(false);
          return;
        }

        // Check if username already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .single();

        if (existingProfile) {
          setError(`Username "@${cleanUsername}" is already taken. Please pick another.`);
          setLoading(false);
          return;
        }

        // Supabase sign up
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUsername,
              display_name: displayName || cleanUsername,
            },
          },
        });

        if (signUpErr) {
          setError(formatAuthError(signUpErr.message));
          setLoading(false);
          return;
        }

        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(formatAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: demoErr } = await supabase.auth.signInWithPassword({
        email: 'demo@linknest.app',
        password: 'demo123',
      });
      if (demoErr) {
        setError(demoErr.message);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
      if (resetErr) {
        setError(formatAuthError(resetErr.message));
      } else {
        setResetSubmitted(true);
        setError(null);
      }
    } catch (err: any) {
      setError(formatAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updateErr } = await (supabase.auth as any).updatePasswordDirectly(email, newPassword);
      if (updateErr) {
        setError(formatAuthError(updateErr.message));
        setLoading(false);
        return;
      }
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });
      if (loginErr) {
        setSuccessMsg('Password updated! Please sign in.');
        setForgotPasswordOpen(false);
        setResetSubmitted(false);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(formatAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header (Screen 2: LinkNest Dashboard) */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            LinkNest Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isLogin
              ? 'Log in to manage your links, theme & analytics'
              : 'Create your personal link-in-bio page'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              isLogin
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              !isLogin
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="font-medium text-rose-200">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="auth-display-name"
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username / Slug (URL-Safe)
                </label>
                <div className="relative flex items-center">
                  <span className="text-xs font-mono text-slate-500 absolute left-3">
                    linknest.app/
                  </span>
                  <input
                    id="auth-username"
                    type="text"
                    required
                    placeholder="yourname"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-28 pr-3 text-sm font-mono text-indigo-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Unique link for your public page (AC8 validation)
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <button
                type="button"
                id="auth-toggle-password-visibility-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Log In' : 'Create LinkNest Page'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access (Try Account) */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center space-y-2.5">
          <p className="text-xs text-slate-400">
            Want to test features right away?
          </p>
          <button
            id="demo-fast-login-btn"
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all group shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Try Demo Account (Guest Mode)</span>
          </button>
          <p className="text-[11px] text-slate-500">
            *Demo account comes with pre-configured sample links and interactive analytics.
          </p>
        </div>

        {/* Forgot password modal / drawer */}
        {forgotPasswordOpen && (
          <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-md p-6 flex flex-col justify-center text-center z-20">
            {resetSubmitted ? (
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Set New Password</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Enter new password for <span className="text-indigo-300 font-semibold">{email}</span>
                </p>
                {error && (
                  <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSetNewPassword} className="space-y-3 text-left">
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min. 6 chars)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pr-10 text-sm text-slate-100 outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setResetSubmitted(false);
                        setError(null);
                      }}
                      className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                    >
                      {loading ? 'Saving...' : 'Save & Sign In'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Reset Password</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Enter your account email to reset your password.
                </p>
                {error && (
                  <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                    {error}
                  </div>
                )}
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordOpen(false);
                        setError(null);
                      }}
                      className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                    >
                      {loading ? 'Checking...' : 'Continue'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
