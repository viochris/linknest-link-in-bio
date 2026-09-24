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
  RotateCcw
} from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess?: () => void;
  onLoginSuccess?: (user: { id: string; email?: string }) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignupMode = searchParams.get('mode') === 'signup';
  const isForgotMode = searchParams.get('mode') === 'forgot' || searchParams.get('mode') === 'forgot-password' || searchParams.get('forgot') === 'true';
  const [isLogin, setIsLogin] = useState(!isSignupMode && !isForgotMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(isForgotMode);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

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
          setError(authErr.message || 'Login failed. Please check your credentials.');
          setLoading(false);
          return;
        }

        if (!authData?.session) {
          setError('Please check your email to confirm your account before logging in.');
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
          setError(signUpErr.message || 'Signup failed.');
          setLoading(false);
          return;
        }

        // Check whether a valid session was returned
        // If email confirmation is required by Supabase Auth, signUpData.session will be null
        if (!signUpData?.session) {
          setSuccessMsg('Account created! Please check your email to confirm your account before logging in.');
          setIsLogin(true);
          setLoading(false);
          return;
        }

        setSuccessMsg('Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          handleSuccess(signUpData.session.user);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
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
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : undefined;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });

      if (resetErr) {
        setError(resetErr.message || 'Failed to send password reset email.');
      } else {
        setResetSubmitted(true);
        setSuccessMsg(`Password recovery instructions sent to ${targetEmail}. Please check your inbox (and spam folder).`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while sending the reset email.');
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
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="login-password"
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

                {/* Header Back Navigation & Badge */}
                <div className="flex items-center justify-between mb-4 pr-8">
                  <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    Supabase Auth Recovery
                  </span>
                </div>

                {/* Step 2: Confirmation Step */}
                {resetSubmitted ? (
                  <div id="forgot-password-confirmation-step" className="space-y-4">
                    <div className="text-center pt-2 pb-1">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h2 id="forgot-password-title" className="text-xl font-bold text-white tracking-tight">
                        Recovery Link Sent!
                      </h2>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        We've dispatched password reset instructions from Supabase to:
                      </p>
                      <div className="mt-2 py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-xl inline-block text-xs font-mono text-emerald-300 font-semibold max-w-full truncate">
                        {forgotEmail || email}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-slate-300">Next Steps:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Open your email inbox and find the message from Supabase.</li>
                        <li>Click the secure verification link inside to choose your new password.</li>
                        <li>Check your spam or junk folder if you don't see it within 2 minutes.</li>
                      </ul>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        id="forgot-password-done-btn"
                        type="button"
                        onClick={() => {
                          setForgotPasswordOpen(false);
                          setError(null);
                          setResetSubmitted(false);
                        }}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 text-center"
                      >
                        Return to Sign In
                      </button>
                      <button
                        id="forgot-password-resend-btn"
                        type="button"
                        onClick={() => {
                          setResetSubmitted(false);
                        }}
                        className="w-full sm:w-auto py-2.5 px-3 border border-slate-800 hover:border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Send Again</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Step 1: Input Email Form */
                  <div id="forgot-password-input-step">
                    <div className="text-center mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <KeyRound className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 id="forgot-password-title" className="text-xl font-bold text-white tracking-tight">
                        Reset Your Password
                      </h2>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                        Enter the email associated with your LinkNest account to receive a secure password recovery link.
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
                          Account Email Address
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
                            <span>Send Password Reset Link</span>
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
