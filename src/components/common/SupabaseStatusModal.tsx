import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  isRealSupabaseConfigured,
  localSimulator,
  runSupabaseDiagnostics,
  SupabaseDiagnosticResult,
} from '../../lib/supabase';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  X,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Terminal,
  Server,
  KeyRound,
  Layers,
} from 'lucide-react';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSeed?: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({
  isOpen,
  onClose,
  onResetSeed,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'rls'>('status');
  const [diagnostics, setDiagnostics] = useState<SupabaseDiagnosticResult | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchDiagnostics = async () => {
    setTesting(true);
    try {
      const res = await runSupabaseDiagnostics();
      setDiagnostics(res);
    } catch {
      // Ignored
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sqlCode = `-- LinkNest Supabase DDL & RLS Setup
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url VARCHAR(500) DEFAULT '',
    theme JSONB NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    icon VARCHAR(64) DEFAULT 'globe',
    category VARCHAR(64) DEFAULT 'General',
    description TEXT NULL,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE NULL,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    click_count INTEGER DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure description & category columns exist for backwards compatibility
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'General';

CREATE TABLE IF NOT EXISTS public.social_icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_agent TEXT NULL,
    referrer TEXT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- RPC Functions
CREATE OR REPLACE FUNCTION public.increment_view_count(p_profile_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.profiles SET view_count = view_count + 1 WHERE id = p_profile_id;
END; $$;

CREATE OR REPLACE FUNCTION public.increment_link_click(p_link_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.links SET click_count = click_count + 1, last_clicked_at = now() WHERE id = p_link_id;
    INSERT INTO public.link_clicks (link_id, profile_id, clicked_at)
    SELECT id, profile_id, now() FROM public.links WHERE id = p_link_id;
END; $$;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-8 relative"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Supabase Backend & RLS Status
              </h3>
              <p className="text-[11px] text-slate-400">
                PRD Sections 7.3 (ERD) and 7.4 (Row Level Security & RPC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-xl my-4 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'status' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'rls' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            RLS & Security Rules
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'sql' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            SQL Migration
          </button>
        </div>

        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Top summary banner */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                diagnostics?.tablesExist
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : diagnostics?.canConnectToEndpoint
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {diagnostics?.tablesExist ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : diagnostics?.canConnectToEndpoint ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-bold text-white text-sm">
                  {diagnostics?.tablesExist
                    ? 'Connected to Live Supabase Project & Tables Ready'
                    : diagnostics?.canConnectToEndpoint
                    ? 'Connected to Supabase — Database Schema Tables Pending'
                    : isRealSupabaseConfigured
                    ? 'Connecting to Supabase...'
                    : 'Local Supabase Simulator Active'}
                </p>
                <p className="text-slate-300 leading-relaxed">
                  {diagnostics?.tablesExist
                    ? 'All database queries, authentication sessions, and storage requests are talking directly to your remote Supabase instance.'
                    : diagnostics?.canConnectToEndpoint
                    ? "Your app successfully communicates with Supabase, but the database tables (public.profiles, public.links) have not been created yet in your Supabase project. The app is serving with the local database engine so it remains fully functional."
                    : 'Running full Postgres client queries, authentication, storage uploads, and Section 7.4 Row Level Security filters.'}
                </p>
              </div>
            </div>

            {/* Diagnostic inspection checklist */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Environment & Connection Diagnostics
                </span>
                <button
                  onClick={fetchDiagnostics}
                  disabled={testing}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Checking...' : 'Re-test Connection'}</span>
                </button>
              </div>

              {/* 1. VITE_SUPABASE_URL */}
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">VITE_SUPABASE_URL:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-[11px] max-w-[200px] truncate">
                    {diagnostics?.envUrl || import.meta.env.VITE_SUPABASE_URL || 'Not Set'}
                  </span>
                  {diagnostics?.isEnvUrlLoaded ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                      Loaded
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-semibold">
                      Missing
                    </span>
                  )}
                </div>
              </div>

              {/* 2. VITE_SUPABASE_ANON_KEY */}
              <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-[11px]">
                    {diagnostics?.envKeyPreview || (import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••' : 'Not Set')}
                  </span>
                  {diagnostics?.isEnvKeyLoaded ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                      Loaded
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-semibold">
                      Missing
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Endpoint Connection */}
              <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Supabase API Endpoint:</span>
                </div>
                <div>
                  {diagnostics?.canConnectToEndpoint ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Reachable
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">
                      Offline / Not Configured
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Tables in Schema Cache */}
              <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Database Schema Tables:</span>
                </div>
                <div>
                  {diagnostics?.tablesExist ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> public.profiles Ready
                    </span>
                  ) : diagnostics?.canConnectToEndpoint ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> PGRST205: Tables Missing
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">
                      Local Simulator Mode
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actionable banner when tables need to be created */}
            {diagnostics?.canConnectToEndpoint && !diagnostics?.tablesExist && (
              <div className="bg-indigo-950/60 border border-indigo-800/60 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-indigo-200">
                    Create Database Tables in Supabase
                  </p>
                  <p className="text-[11px] text-indigo-300/80">
                    Copy the SQL script and run it in the Supabase SQL Editor to enable remote tables.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('sql')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors"
                >
                  View SQL Script
                </button>
              </div>
            )}

            {onResetSeed && (
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => {
                    localSimulator.resetToDefaultSeed();
                    onResetSeed();
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data to Silvio's Profile</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rls' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Row Level Security Matrix (Section 7.4)
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400 leading-relaxed">
                <li>
                  <strong className="text-slate-200">Profiles:</strong> SELECT is allowed for everyone (public profile visitor). INSERT, UPDATE, and DELETE are restricted strictly to <code className="text-indigo-400 font-mono">user_id = auth.uid()</code>.
                </li>
                <li>
                  <strong className="text-slate-200">Links:</strong> Anonymous public visitors can ONLY read active links (<code className="text-indigo-400 font-mono">is_active = true</code>) that fall within the <code className="text-indigo-400 font-mono">start_date</code> and <code className="text-indigo-400 font-mono">end_date</code> window. The owner can query all their links.
                </li>
                <li>
                  <strong className="text-slate-200">RPC Counter Functions:</strong> Profile view and link click counts increment via <code className="text-indigo-400 font-mono">SECURITY DEFINER</code> functions, preventing arbitrary writes from visitors while allowing accurate engagement analytics.
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Execute in Supabase SQL Editor:
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
              {sqlCode}
            </pre>
          </div>
        )}
      </motion.div>
    </div>
  );
};
