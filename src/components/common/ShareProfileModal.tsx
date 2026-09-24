import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  MessageCircle,
  Twitter,
  Linkedin,
  Send,
  Facebook,
  Mail,
  Sparkles,
  Smartphone,
  Globe
} from 'lucide-react';
import { Profile } from '../../types';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onOpenQrModal?: () => void;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenQrModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !profile) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest-link-in-bio.vercel.app';
  const displayHost = typeof window !== 'undefined' && window.location.host ? window.location.host : 'linknest-link-in-bio.vercel.app';
  const profileUrl = `${origin}/${profile.username}`;
  const shareTitle = `${profile.display_name} (@${profile.username}) - LinkNest`;
  const shareText = `Check out ${profile.display_name}'s verified links, projects, and portfolio on LinkNest 🚀`;
  const emailSubject = `${profile.display_name} - LinkNest Bio & Portfolio`;
  const emailBody = `Hey,\n\nCheck out my verified links, projects, and portfolio here:\n${profileUrl}\n\nBest regards,\n${profile.display_name}`;

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = profileUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleCopyShareText = async () => {
    const fullText = `${shareText}\n${profileUrl}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = fullText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2400);
    } catch (err) {
      console.warn('Copy text failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (hasNativeShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled or share aborted
      }
    } else {
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Chat directly with contacts or groups',
      icon: MessageCircle,
      color: 'hover:bg-emerald-500/15 hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      iconBg: 'bg-emerald-500/20 text-emerald-300',
      actionUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${profileUrl}`)}`,
    },
    {
      id: 'x-twitter',
      name: 'X (Twitter)',
      description: 'Post tweet to your followers',
      icon: Twitter,
      color: 'hover:bg-slate-800 hover:border-slate-600 text-white bg-slate-900 border-slate-800',
      iconBg: 'bg-slate-800 text-slate-200',
      actionUrl: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Share update to professional network',
      icon: Linkedin,
      color: 'hover:bg-blue-600/15 hover:border-blue-500/40 text-blue-400 bg-blue-600/10 border-blue-500/20',
      iconBg: 'bg-blue-600/20 text-blue-300',
      actionUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Send to channels or friends',
      icon: Send,
      color: 'hover:bg-sky-500/15 hover:border-sky-500/40 text-sky-400 bg-sky-500/10 border-sky-500/20',
      iconBg: 'bg-sky-500/20 text-sky-300',
      actionUrl: `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Share to your feed or story',
      icon: Facebook,
      color: 'hover:bg-indigo-600/15 hover:border-indigo-500/40 text-indigo-400 bg-indigo-600/10 border-indigo-500/20',
      iconBg: 'bg-indigo-600/20 text-indigo-300',
      actionUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Send pre-filled link via mail',
      icon: Mail,
      color: 'hover:bg-amber-500/15 hover:border-amber-500/40 text-amber-400 bg-amber-500/10 border-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-300',
      actionUrl: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          id="share-profile-modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-profile-modal-title"
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-black/80 space-y-5 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 id="share-profile-modal-title" className="text-base font-bold text-white leading-tight flex items-center gap-2">
                  <span>Share Profile</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Choose how you would like to share your public bio page</p>
              </div>
            </div>
            <button
              id="close-share-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Card Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center gap-3.5 shadow-inner">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0 border-2 border-indigo-500/40 shadow-sm relative">
              <img
                src={profile.avatar_url || '/icon.svg'}
                alt={profile.display_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon.svg';
                }}
              />
            </div>
            <div className="text-left overflow-hidden flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-white truncate text-sm">{profile.display_name}</p>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <p className="text-xs text-indigo-400 font-mono truncate">@{profile.username}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                {displayHost}/{profile.username}
              </p>
            </div>
            <button
              id="copy-text-caption-btn"
              onClick={handleCopyShareText}
              className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Copy link with caption"
            >
              {copiedText ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Caption Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy Caption</span>
                </>
              )}
            </button>
          </div>

          {/* Social Channels 2-Column Grid */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider px-0.5">
              Share to Social &amp; Messaging
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shareOptions.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <a
                    key={opt.id}
                    id={`share-channel-${opt.id}`}
                    href={opt.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${opt.color}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${opt.iconBg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{opt.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Copy Link Section (Dedicated bar with one-click copy) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider px-0.5">
              Direct Profile Link
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-indigo-500/60 transition-colors">
              <div className="pl-2 text-slate-500">
                <Globe className="w-4 h-4 text-indigo-400" />
              </div>
              <input
                id="share-modal-url-input"
                type="text"
                readOnly
                value={profileUrl}
                aria-label="Direct Profile Link"
                className="bg-transparent text-xs font-mono text-slate-200 w-full outline-none px-1 select-all"
              />
              <button
                id="copy-link-modal-action-btn"
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-indigo-600/25 cursor-pointer active:scale-95 min-h-[36px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Actions: Native Share & Offline QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            {hasNativeShare ? (
              <button
                id="share-modal-native-btn"
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer min-h-[40px] active:scale-98"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Device Share Sheet</span>
              </button>
            ) : (
              <button
                id="share-modal-copy-caption-btn"
                type="button"
                onClick={handleCopyShareText}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer min-h-[40px] active:scale-98"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>{copiedText ? 'Caption Copied!' : 'Copy with Caption'}</span>
              </button>
            )}

            <button
              id="share-modal-open-qr-btn"
              type="button"
              onClick={() => {
                onClose();
                if (onOpenQrModal) {
                  onOpenQrModal();
                } else {
                  window.dispatchEvent(new CustomEvent('linknest:navigate_tab', { detail: 'qrcode' }));
                }
              }}
              className="w-full py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-indigo-500/40 cursor-pointer min-h-[40px] active:scale-98 shadow-sm"
              title="Open full offline QR code generator & printable flyer card"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Open Offline QR &amp; Flyer</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
