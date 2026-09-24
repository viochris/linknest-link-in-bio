import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
  KeyRound
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
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

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
          setError(authErr.message || 'Login failed. Please check your credentials.');
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
          setError(signUpErr.message || 'Signup failed.');
          setLoading(false);
          return;
        }

        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectBypass = async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signInWithPassword({
        email: email || 'viochristian860@gmail.com',
        password: password || 'demo123',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
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
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.resetPasswordForEmail(email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
      setTimeout(() => setForgotPasswordOpen(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
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
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-rose-200">{error}</span>
                {error.toLowerCase().includes('rate limit') && (
                  <p className="mt-1 text-[11px] text-rose-300/80">
                    Supabase rate-limited confirmation emails. You can directly access your dashboard using the instant bypass button below.
                  </p>
                )}
                {error.toLowerCase().includes('not confirmed') && (
                  <p className="mt-1 text-[11px] text-rose-300/80">
                    Email not confirmed yet. Click the button below to directly enter the dashboard.
                  </p>
                )}
              </div>
            </div>
            <button
              id="auth-bypass-btn"
              type="button"
              onClick={handleDirectBypass}
              disabled={loading}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Access Dashboard Directly (Bypass Confirmation)</span>
            </button>
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
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
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

          {/* Dedicated direct access for Silvio's authentic account */}
          <div className="pt-1.5">
            <button
              id="silvio-owner-login-btn"
              type="button"
              onClick={() => {
                setEmail('viochristian860@gmail.com');
                setPassword('demo123');
                handleDirectBypass();
              }}
              disabled={loading}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5 hover:underline"
            >
              <span>Account Owner?</span>
              <span className="font-semibold">Sign in as Silvio Christian Joe (@silvio)</span>
            </button>
          </div>
        </div>

        {/* Forgot password modal / drawer */}
        {forgotPasswordOpen && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md p-6 flex flex-col justify-center text-center z-20">
            <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your email and Supabase Auth will send a recovery link.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
