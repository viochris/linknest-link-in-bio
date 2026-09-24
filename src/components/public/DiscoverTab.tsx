import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DiscoverItem, DiscoverResponse, ThemeConfig } from '../../types';
import { Compass, ExternalLink, Sparkles, Globe, AlertCircle, RefreshCw } from 'lucide-react';

interface DiscoverTabProps {
  username: string;
  theme: ThemeConfig;
  isLightBg: boolean;
  accentColor?: string;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  username,
  theme,
  isLightBg,
  accentColor = '#818cf8',
}) => {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscover = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const url = `/api/discover?username=${encodeURIComponent(username)}${isRefresh ? `&refresh=true&t=${Date.now()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Could not fetch discover feed');
      }
      const data: DiscoverResponse = await res.json();
      if (data.items && data.items.length > 0) {
        setItems(data.items);
        setTopics(data.topics || []);
        setEmpty(false);
      } else {
        setItems([]);
        setTopics(data.topics || []);
        setEmpty(true);
      }
    } catch (err: any) {
      console.warn('Discover fetch error:', err.message || err);
      // Gracefully show the empty state instead of a broken UI
      setEmpty(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscover(false);
  }, [username]);

  // Card shape based on button_style
  const getRadiusClass = () => {
    switch (theme.button_style) {
      case 'pill':
        return 'rounded-2xl sm:rounded-3xl';
      case 'sharp':
        return 'rounded-none';
      default:
        return 'rounded-2xl';
    }
  };

  const textContrastClass = isLightBg ? 'text-slate-900' : 'text-white';
  const subtextContrastClass = isLightBg ? 'text-slate-600' : 'text-slate-300';
  const cardBgClass = isLightBg
    ? 'bg-white/80 hover:bg-white border-slate-200/80 text-slate-900 shadow-sm hover:shadow-md'
    : 'bg-slate-900/60 hover:bg-slate-900/90 border-white/10 text-white shadow-md hover:border-white/20';

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 px-1 select-none">
      {/* Attribution & Notice Header */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border text-left backdrop-blur-md transition-all ${
          isLightBg
            ? 'bg-indigo-50/70 border-indigo-100 text-slate-800'
            : 'bg-indigo-950/30 border-indigo-500/20 text-indigo-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg flex items-center justify-center text-white"
              style={{ background: accentColor }}
            >
              <Compass className="w-4 h-4" />
            </span>
            <h2 className={`text-xs sm:text-sm font-bold tracking-tight ${isLightBg ? 'text-indigo-950' : 'text-white'}`}>
              Trending & Discover
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="discover-refresh-btn"
              onClick={() => fetchDiscover(true)}
              disabled={loading || refreshing}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                isLightBg
                  ? 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                  : 'bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border-indigo-500/40'
              }`}
              title="Refresh and search for fresh trending topics"
            >
              <RefreshCw className={`w-3 h-3 text-indigo-400 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Searching...' : 'Refresh'}</span>
            </button>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isLightBg
                  ? 'bg-white text-indigo-700 border-indigo-200'
                  : 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Google Search</span>
            </span>
          </div>
        </div>

        <p className={`text-[11px] sm:text-xs leading-relaxed ${isLightBg ? 'text-slate-600' : 'text-slate-300'}`}>
          {topics.length > 0 ? (
            <>
              Curated articles and resources related to{' '}
              <strong className={isLightBg ? 'text-slate-900' : 'text-white'}>
                {topics.slice(0, 3).join(', ')}
              </strong>
              .
            </>
          ) : (
            'Curated web resources based on this profile’s bio interests.'
          )}
        </p>

        <p className="text-[10px] opacity-70 mt-1 italic">
          Trending, powered by Google Search • Auto-generated content, not personally endorsed.
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 pt-1">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`p-4 ${getRadiusClass()} border animate-pulse flex flex-col gap-2.5 ${
                isLightBg ? 'bg-slate-200/60 border-slate-300/40' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-4 w-24 rounded ${isLightBg ? 'bg-slate-300' : 'bg-white/10'}`}
                />
                <div
                  className={`h-3 w-16 rounded ${isLightBg ? 'bg-slate-300' : 'bg-white/10'}`}
                />
              </div>
              <div
                className={`h-5 w-3/4 rounded ${isLightBg ? 'bg-slate-300' : 'bg-white/10'}`}
              />
              <div
                className={`h-3.5 w-full rounded ${isLightBg ? 'bg-slate-300' : 'bg-white/10'}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && empty && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 rounded-2xl border text-center backdrop-blur-md ${
            isLightBg
              ? 'bg-white/60 border-slate-200 text-slate-600'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center bg-indigo-500/10 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className={`text-sm font-semibold mb-1 ${textContrastClass}`}>
            Nothing to discover right now
          </h3>
          <p className="text-xs opacity-75 max-w-sm mx-auto mb-4">
            No trending resources available for this profile at the moment.
          </p>
          <button
            type="button"
            id="discover-empty-retry-btn"
            onClick={() => fetchDiscover(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Searching Topics...' : 'Search Trending Topics'}</span>
          </button>
        </motion.div>
      )}

      {/* Items List */}
      {!loading && !empty && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.a
              key={item.id || index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.25 }}
              className={`block p-4 sm:p-5 ${getRadiusClass()} border backdrop-blur-md transition-all duration-200 group text-left relative overflow-hidden ${cardBgClass}`}
              style={{
                borderColor: theme.button_style === 'outline' ? accentColor : undefined,
              }}
            >
              {/* Header: Source and External Link indicator */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase transition-colors"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    color: accentColor,
                  }}
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[180px]">{item.source}</span>
                </span>

                <div className="flex items-center gap-1 text-[11px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>

              {/* Title (Rendered strictly as text, no raw HTML) */}
              <h3 className={`text-sm sm:text-base font-bold leading-snug mb-1.5 group-hover:text-indigo-400 transition-colors ${textContrastClass}`}>
                {item.title}
              </h3>

              {/* Snippet (Rendered strictly as text, no raw HTML) */}
              {item.snippet && (
                <p className={`text-xs leading-relaxed line-clamp-2 opacity-85 ${subtextContrastClass}`}>
                  {item.snippet}
                </p>
              )}
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
};
