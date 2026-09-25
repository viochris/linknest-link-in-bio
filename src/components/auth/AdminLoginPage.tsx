import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
  Send,
  X,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess?: () => void;
  onLoginSuccess?: (user: { id: string; email?: string }) => void;
}

export function formatAuthError(rawMessage?: string | null): string {
  if (!rawMessage) return 'Sign in failed.';
  const lower = rawMessage.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return 'Connection error. Please try again.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Invalid email or password.';
  }
  if (
    lower.includes('user not found') ||
    lower.includes('akun tidak ditemukan') ||
    lower.includes('no account found') ||
    lower.includes('account not found')
  ) {
    return 'Account not found.';
  }
  if (
    lower.includes('kata sandi tidak sesuai') ||
    lower.includes('wrong password') ||
    lower.includes('invalid password') ||
    lower.includes('incorrect password')
  ) {
    return 'Incorrect password.';
  }
  if (
    lower.includes('already registered') ||
    lower.includes('already taken') ||
    lower.includes('sudah terdaftar') ||
    lower.includes('already in use')
  ) {
    return 'Email or username already registered.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email is not confirmed.';
  }
  return rawMessage;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignupMode = searchParams.get('mode') === 'signup';
  const isForgotMode = searchParams.get('mode') === 'forgot' || searchParams.get('mode') === 'forgot-password' || searchParams.get('forgot') === 'true';
  const [isLogin, setIsLogin] = useState(!isSignupMode && !isForgotMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(isForgotMode);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsLogin(false);
      setForgotPasswordOpen(false);
    } else if (searchParams.get('mode') === 'forgot' || searchParams.get('mode') === 'forgot-password' || searchParams.get('forgot') === 'true') {
      setForgotPasswordOpen(true);
      setIsLogin(true);
    }
  }, [searchParams]);

  // Keep forgotEmail in sync if user already typed email in login box
  useEffect(() => {
    if (email && !forgotEmail) {
      setForgotEmail(email);
    }
  }, [email, forgotEmail]);

  const handleSuccess = (user?: { id: string; email?: string }) => {
    if (onLoginSuccess && user) {
      onLoginSuccess(user);
    }
    if (onSuccess) onSuccess();
    navigate('/admin', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Log in via Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authErr) {
          setError(formatAuthError(authErr.message));
          setLoading(false);
          return;
        }

        if (!authData?.session) {
          setError('Please confirm your email before signing in.');
          setLoading(false);
          return;
        }

        handleSuccess(authData.session.user);
      } else {
        // Sign up with username validation
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
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
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

        // Check whether a valid session was returned
        if (!signUpData?.session) {
          setSuccessMsg('Account created! Please sign in with your credentials.');
          setIsLogin(true);
          setLoading(false);
          return;
        }

        setSuccessMsg('Account created! Redirecting to dashboard...');
        setTimeout(() => {
          handleSuccess(signUpData.session.user);
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
      const { data: demoData, error: demoErr } = await supabase.auth.signInWithPassword({
        email: 'demo@linknest.app',
        password: 'demo123',
      });
      if (demoErr) {
        setError(demoErr.message);
      } else if (demoData?.session?.user) {
        handleSuccess(demoData.session.user);
      } else {
        handleSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (forgotEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your email.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail);

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
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const targetEmail = (forgotEmail || email).trim().toLowerCase();
      const { error: updateErr } = await (supabase.auth as any).updatePasswordDirectly(targetEmail, newPassword);
      if (updateErr) {
        setError(formatAuthError(updateErr.message));
        setLoading(false);
        return;
      }

      // Automatically sign in with the new password
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: newPassword,
      });

      if (authErr || !authData?.session) {
        setSuccessMsg('Password updated! Please sign in.');
        setForgotPasswordOpen(false);
        setIsLogin(true);
        setPassword(newPassword);
      } else {
        setSuccessMsg('Password updated! Redirecting...');
        setTimeout(() => {
          handleSuccess(authData.session.user);
        }, 600);
      }
    } catch (err: any) {
      setError(formatAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Bar Back Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/"
          id="back-to-home-link"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Admin Portal</span>
        </span>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isLogin ? 'Admin Sign In' : 'Create Admin Account'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin
              ? 'Access your links, theme customization, and analytics'
              : 'Launch your personalized link-in-bio page in seconds'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
          <button
            type="button"
            id="tab-login-btn"
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
            id="tab-signup-btn"
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

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="font-medium text-rose-200">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
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
                    id="login-display-name"
                    type="text"
                    required
                    placeholder="e.g. Silvio Christian Joe"
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
                <div className="relative">
                  <span className="text-slate-500 font-mono text-xs absolute left-3 top-3">@</span>
                  <input
                    id="login-username-slug"
                    type="text"
                    required
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Public profile URL: <span className="text-slate-400 font-mono">linknest.app/{username || 'slug'}</span>
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
                id="login-email"
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
                  id="forgot-password-link"
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(true);
                    setError(null);
                    setSuccessMsg(null);
                    setResetSubmitted(false);
                    if (email) setForgotEmail(email);
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
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
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Dashboard' : 'Create & Access Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {isLogin && (
            <div className="text-center pt-2">
              <button
                id="forgot-password-secondary-link"
                type="button"
                onClick={() => {
                  setForgotPasswordOpen(true);
                  setError(null);
                  setSuccessMsg(null);
                  setResetSubmitted(false);
                  if (email) setForgotEmail(email);
                }}
                className="text-xs text-slate-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Trouble signing in?</span>
                <span className="text-indigo-400 hover:underline font-medium">Reset password</span>
              </button>
            </div>
          )}
        </form>

        {/* Quick Demo Access (Try Account) */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
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

        {/* Supabase Password Reset Modal Flow */}
        <AnimatePresence>
          {forgotPasswordOpen && (
            <div
              id="forgot-password-backdrop"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setForgotPasswordOpen(false);
                  setError(null);
                  setResetSubmitted(false);
                }
              }}
            >
              <motion.div
                id="forgot-password-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="forgot-password-title"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left"
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Close Button */}
                <button
                  id="close-forgot-password-modal-btn"
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setError(null);
                    setResetSubmitted(false);
                  }}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4 pr-8">
                  <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    Password Recovery
                  </span>
                </div>

                {/* Step 2: Set New Password Directly */}
                {resetSubmitted ? (
                  <div id="forgot-password-set-new-step" className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                        <KeyRound className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 id="forgot-password-title" className="text-xl font-bold text-white tracking-tight">
                        Set New Password
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Choose a new password for <span className="text-slate-200 font-semibold">{forgotEmail || email}</span>
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <span className="font-medium text-rose-200">{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleSetNewPassword} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                          <input
                            id="reset-new-password"
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            placeholder="At least 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title={showNewPassword ? 'Hide password' : 'Show password'}
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                          <input
                            id="reset-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-2.5 p-0.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        id="save-new-password-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Save Password & Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setResetSubmitted(false);
                            setError(null);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Use a different email</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Step 1: Input Email Form */
                  <div id="forgot-password-input-step">
                    <div className="text-center mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <KeyRound className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 id="forgot-password-title" className="text-xl font-bold text-white tracking-tight">
                        Reset Password
                      </h2>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                        Enter your account email to reset your password.
                      </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                      <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-rose-200">{error}</p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            id="reset-password-email-input"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        id="submit-forgot-password-btn"
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Continue</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Bottom Back Action */}
                    <div className="mt-4 pt-3 border-t border-slate-800/70 text-center">
                      <button
                        id="cancel-forgot-password-btn"
                        type="button"
                        onClick={() => {
                          setForgotPasswordOpen(false);
                          setError(null);
                          setResetSubmitted(false);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Return to Sign In</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
