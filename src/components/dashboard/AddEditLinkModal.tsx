import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { LinkItem } from '../../types';
import { LINK_ICONS } from '../../lib/constants';
import { RenderIcon } from '../../lib/icons';
import { detectPlatformFromUrl } from '../../lib/domainIcons';
import { generateLinkDescription } from '../../lib/gemini';
import { fetchLinkMetadata, LinkMetadataResult } from '../../lib/linkMetadata';
import { validateUrlReachability, UrlReachabilityResult } from '../../lib/urlValidator';
import { LinkPreviewCard } from './LinkPreviewCard';
import { LinkScheduleDatePicker } from './LinkScheduleDatePicker';
import { toDateTimeLocalString, fromDateTimeLocalToIso } from '../../lib/dateUtils';
import {
  X,
  Sparkles,
  Calendar,
  Globe,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface AddEditLinkModalProps {
  isOpen: boolean;
  linkToEdit?: LinkItem | null;
  profileId: string;
  nextPosition: number;
  onClose: () => void;
  onSave: (link: Partial<LinkItem>) => Promise<void>;
}

export const AddEditLinkModal: React.FC<AddEditLinkModalProps> = ({
  isOpen,
  linkToEdit,
  profileId,
  nextPosition,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('globe');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OpenGraph metadata state for Live Link Preview
  const [ogMetadata, setOgMetadata] = useState<LinkMetadataResult | null>(null);
  const [isFetchingOg, setIsFetchingOg] = useState(false);
  const ogFetchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // URL Reachability validation state
  const [isValidatingReachability, setIsValidatingReachability] = useState(false);
  const [reachabilityResult, setReachabilityResult] = useState<UrlReachabilityResult | null>(null);
  const [brokenLinkWarning, setBrokenLinkWarning] = useState<UrlReachabilityResult | null>(null);

  // Gemini AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAlternatives, setAiAlternatives] = useState<Array<{ tone: string; text: string }>>([]);
  const [detectedMetadata, setDetectedMetadata] = useState<{ domain?: string; pageTitle?: string; metaDescription?: string } | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const lastAutoDetectedIconRef = useRef<string | null>(null);

  // Live domain detection for the entered URL
  const liveDetectedPlatform = useMemo(() => detectPlatformFromUrl(url), [url]);

  const triggerOgFetch = async (targetUrl: string, autoFillIfEmpty: boolean = false) => {
    const clean = targetUrl.trim();
    if (!clean || !clean.includes('.') || clean.length < 5) {
      setOgMetadata(null);
      return;
    }

    setIsFetchingOg(true);
    try {
      const meta = await fetchLinkMetadata(clean);
      setOgMetadata(meta);

      if (autoFillIfEmpty) {
        if (!title.trim() && meta.title) {
          setTitle(meta.title);
        }
        if (!description.trim() && meta.description) {
          setDescription(meta.description.slice(0, 100));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch OpenGraph metadata:', err);
    } finally {
      setIsFetchingOg(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setReachabilityResult(null);
    setBrokenLinkWarning(null);

    const detected = detectPlatformFromUrl(newUrl);
    if (detected) {
      // Auto-set the icon if currently default 'globe', empty, or matching previous auto-detection
      if (!icon || icon === 'globe' || icon === lastAutoDetectedIconRef.current) {
        setIcon(detected.iconKey);
        lastAutoDetectedIconRef.current = detected.iconKey;
      }
    }

    // Debounced OpenGraph fetch
    if (ogFetchDebounceRef.current) {
      clearTimeout(ogFetchDebounceRef.current);
    }
    if (newUrl.includes('.') && newUrl.trim().length >= 6) {
      ogFetchDebounceRef.current = setTimeout(() => {
        triggerOgFetch(newUrl, !title.trim());
      }, 550);
    }
  };

  useEffect(() => {
    if (linkToEdit) {
      setTitle(linkToEdit.title);
      setUrl(linkToEdit.url);
      setDescription(linkToEdit.description || '');
      setIcon(linkToEdit.icon || 'globe');
      setIsActive(linkToEdit.is_active);
      setIsFeatured(linkToEdit.is_featured);
      setStartDate(toDateTimeLocalString(linkToEdit.start_date));
      setEndDate(toDateTimeLocalString(linkToEdit.end_date));
      setShowSchedule(Boolean(linkToEdit.start_date || linkToEdit.end_date));
      if (linkToEdit.url) {
        triggerOgFetch(linkToEdit.url, false);
      }
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setIcon('globe');
      setIsActive(true);
      setIsFeatured(false);
      setStartDate('');
      setEndDate('');
      setShowSchedule(false);
      setOgMetadata(null);
    }
    setReachabilityResult(null);
    setBrokenLinkWarning(null);
    setIsValidatingReachability(false);
    setAiAlternatives([]);
    setDetectedMetadata(null);
    setAiMessage(null);
    setError(null);
  }, [linkToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGenerateDescription = async (tone: 'professional' | 'punchy' | 'engaging' | 'minimalist' = 'professional') => {
    if (!title.trim() && !url.trim()) {
      setError('Please enter at least a destination URL or title first so Gemini can analyze the link.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    setAiMessage(null);

    try {
      let finalUrl = url.trim();
      if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
        finalUrl = `https://${finalUrl}`;
      }

      const res = await generateLinkDescription({
        url: finalUrl,
        title: title.trim(),
        tone,
      });

      if (res.description) {
        setDescription(res.description);
      }
      if (res.alternatives && res.alternatives.length > 0) {
        setAiAlternatives(res.alternatives);
      }
      if (res.metadata) {
        setDetectedMetadata(res.metadata);
      }
      if (res.suggestedIcon && (icon === 'globe' || !icon)) {
        setIcon(res.suggestedIcon);
      }
      if (res.message) {
        setAiMessage(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-generate description with Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, bypassBrokenWarning: boolean = false) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for the link.');
      return;
    }
    if (!url.trim()) {
      setError('Please provide a destination URL.');
      return;
    }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
      finalUrl = `https://${finalUrl}`;
    }

    // Step: Reachability Validation Check before saving
    if (!bypassBrokenWarning && !finalUrl.startsWith('mailto:')) {
      const isAlreadyReachable = reachabilityResult && reachabilityResult.isReachable;
      if (!isAlreadyReachable) {
        setIsValidatingReachability(true);
        setSaving(true);
        try {
          const result = await validateUrlReachability(finalUrl);
          setReachabilityResult(result);

          if (result.isBroken) {
            setBrokenLinkWarning(result);
            setSaving(false);
            setIsValidatingReachability(false);
            return; // Halt and show warning
          }
        } catch (validationErr) {
          console.warn('Reachability check error:', validationErr);
        } finally {
          setIsValidatingReachability(false);
        }
      }
    }

    // Validate dates if scheduling is used
    let isoStartDate: string | null = null;
    let isoEndDate: string | null = null;
    if (showSchedule || startDate || endDate) {
      if (startDate) isoStartDate = fromDateTimeLocalToIso(startDate);
      if (endDate) isoEndDate = fromDateTimeLocalToIso(endDate);
      if (isoStartDate && isoEndDate && new Date(isoStartDate).getTime() >= new Date(isoEndDate).getTime()) {
        setError('Activation time (start date) must be strictly earlier than expiry time (end date).');
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        id: linkToEdit?.id,
        profile_id: profileId,
        title: title.trim(),
        url: finalUrl,
        icon,
        description: description.trim() || null,
        is_active: isActive,
        is_featured: isFeatured,
        start_date: isoStartDate,
        end_date: isoEndDate,
        position: linkToEdit ? linkToEdit.position : nextPosition,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto max-w-full overflow-x-hidden">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl my-auto relative max-h-[92vh] overflow-y-auto overflow-x-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>{linkToEdit ? 'Edit Link' : 'Add New Link'}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="link-title-input"
              type="text"
              required
              placeholder="e.g. My GitHub Projects / Latest Video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Destination URL <span className="text-rose-400">*</span>
            </label>
            <input
              id="link-url-input"
              type="text"
              required
              placeholder="https://example.com/my-page"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
            {/* Real-time Domain Detection Indicator */}
            {liveDetectedPlatform && (
              <div
                className="mt-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs animate-fadeIn"
                style={{
                  backgroundColor: liveDetectedPlatform.badgeBg,
                  borderColor: liveDetectedPlatform.badgeBorder,
                  color: liveDetectedPlatform.brandColor,
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RenderIcon name={liveDetectedPlatform.iconKey} className="w-4 h-4 shrink-0" />
                  <span className="font-semibold truncate">
                    Domain detected: {liveDetectedPlatform.label}
                  </span>
                </div>
                <span className="text-[10px] font-medium bg-black/40 px-2 py-0.5 rounded-full whitespace-nowrap text-slate-200">
                  Icon auto-selected
                </span>
              </div>
            )}

            {/* Live Reachability Status indicator badge */}
            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                {isValidatingReachability ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying link reachability...</span>
                  </span>
                ) : reachabilityResult ? (
                  reachabilityResult.isReachable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{reachabilityResult.message}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-500/30">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      <span>{reachabilityResult.message}</span>
                    </span>
                  )
                ) : null}
              </div>

              {url.trim().length >= 6 && url.includes('.') && !isValidatingReachability && (
                <button
                  type="button"
                  id="check-reachability-btn"
                  onClick={async () => {
                    let finalUrl = url.trim();
                    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                      finalUrl = `https://${finalUrl}`;
                    }
                    setIsValidatingReachability(true);
                    try {
                      const res = await validateUrlReachability(finalUrl);
                      setReachabilityResult(res);
                      if (res.isBroken) {
                        setBrokenLinkWarning(res);
                      } else {
                        setBrokenLinkWarning(null);
                      }
                    } finally {
                      setIsValidatingReachability(false);
                    }
                  }}
                  className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Verify Link</span>
                </button>
              )}
            </div>
          </div>

          {/* Description & Gemini AI Auto-Generator */}
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Description / Subtitle
                </label>
                <span className="text-[10px] font-normal text-slate-400">
                  ({description.length}/100)
                </span>
              </div>

              {/* Gemini AI Trigger Button */}
              <button
                id="gemini-generate-desc-btn"
                type="button"
                onClick={() => handleGenerateDescription('professional')}
                disabled={isGenerating || (!url.trim() && !title.trim())}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer min-h-[34px]"
                title="Use Gemini API to scrape link metadata and generate high-impact copy"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse shrink-0" />
                    <span>Auto-Generate with Gemini</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <textarea
                id="link-description-input"
                rows={2}
                maxLength={100}
                placeholder="e.g. Explore open-source projects in Data Science, GenAI, and ML engineering."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Scraped Page Metadata Badge */}
            {detectedMetadata?.pageTitle && (
              <div className="flex items-start gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 p-2 rounded-xl">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-semibold text-emerald-300">Target metadata: </span>
                  <span className="opacity-90">{detectedMetadata.pageTitle}</span>
                  {detectedMetadata.domain && (
                    <span className="text-emerald-500/80 ml-1">({detectedMetadata.domain})</span>
                  )}
                </div>
              </div>
            )}

            {/* AI Alternatives Tone Selector */}
            {aiAlternatives.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Gemini Style Variations:</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Tap to select</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {aiAlternatives.map((alt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDescription(alt.text)}
                      className={`text-left text-xs p-2 rounded-xl border transition-all flex items-start gap-2 cursor-pointer ${
                        description === alt.text
                          ? 'bg-indigo-600/25 border-indigo-500 text-white font-medium shadow-sm'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase shrink-0 whitespace-nowrap">
                        {alt.tone}
                      </span>
                      <span className="line-clamp-2 leading-snug flex-1">{alt.text}</span>
                      {description === alt.text && (
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiMessage && (
              <p className="text-[11px] text-slate-400 italic">
                {aiMessage}
              </p>
            )}
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl max-h-32 overflow-y-auto">
              {LINK_ICONS.map((iconKey) => {
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={iconKey}
                  >
                    <RenderIcon name={iconKey} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured & Active Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Featured Link Toggle (AC4) */}
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              isFeatured
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <input
                id="link-featured-checkbox"
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="hidden"
              />
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                isFeatured ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
              }`}>
                {isFeatured && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-white flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Featured Link
                </span>
                <span className="text-[11px] opacity-75">Larger button & accent highlight</span>
              </div>
            </label>

            {/* Active / Live Status Toggle (AC3) */}
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              isActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}>
              <input
                id="link-active-checkbox"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="hidden"
              />
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                isActive ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700'
              }`}>
                {isActive && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="text-xs">
                <span className="font-semibold block text-white flex items-center gap-1.5">
                  {isActive ? 'Status: Live' : 'Status: Hidden'}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </span>
                <span className="text-[11px] opacity-75">
                  {isActive ? 'Visible to public visitors' : 'Draft / hidden from public page'}
                </span>
              </div>
            </label>
          </div>

          {/* Scheduling (Activation & Expiry Times) */}
          <div className="pt-2">
            <button
              type="button"
              id="toggle-schedule-options-btn"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-between w-full py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>
                  {showSchedule
                    ? 'Hide Schedule & Expiry Times'
                    : startDate || endDate
                    ? 'Scheduled Link (Active Window Configured)'
                    : '+ Set Link Activation & Expiry Times (Schedule)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                {showSchedule ? '▲ Collapse' : '▼ Expand'}
              </span>
            </button>

            {showSchedule && (
              <div className="mt-2.5">
                <LinkScheduleDatePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onClearSchedule={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                />
              </div>
            )}
          </div>

          {/* Live Link Preview (OpenGraph Title, Description, Image) */}
          <div className="pt-2">
            <LinkPreviewCard
              url={url}
              title={title}
              description={description}
              icon={icon}
              isFeatured={isFeatured}
              metadata={ogMetadata}
              isLoading={isFetchingOg}
              onApplyOgMetadata={(ogTitle, ogDesc) => {
                if (ogTitle) setTitle(ogTitle);
                if (ogDesc) setDescription(ogDesc.slice(0, 100));
              }}
              onRefreshMetadata={() => triggerOgFetch(url, false)}
            />
          </div>

          {/* Broken Link Warning Banner */}
          {brokenLinkWarning && (
            <div
              id="broken-link-warning-banner"
              className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-200 space-y-3 animate-in fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">
                      Warning: Destination Link Appears Broken
                    </h4>
                    {brokenLinkWarning.status && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40">
                        HTTP {brokenLinkWarning.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                    {brokenLinkWarning.message}
                  </p>
                  <p className="text-[11px] text-rose-300/70">
                    Visitors who click this link on your public profile will likely encounter a 404, dead page, or connection error.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-rose-500/20">
                <button
                  type="button"
                  id="broken-link-edit-btn"
                  onClick={() => {
                    setBrokenLinkWarning(null);
                    const input = document.getElementById('link-url-input');
                    if (input) input.focus();
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Edit URL to Fix
                </button>
                <button
                  type="button"
                  id="broken-link-override-btn"
                  onClick={(e) => {
                    setBrokenLinkWarning(null);
                    handleSubmit(e, true);
                  }}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shadow-rose-600/25 cursor-pointer"
                >
                  Save Anyway (Ignore Warning)
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              id="save-link-btn"
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {saving ? 'Saving...' : linkToEdit ? 'Update Link' : 'Add Link'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
