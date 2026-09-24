import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  X,
  Printer,
  ExternalLink,
  Sparkles,
  Smartphone,
  Share2,
  FileImage,
  Palette
} from 'lucide-react';

export interface QrCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({
  isOpen,
  onClose,
  username,
  displayName,
  avatarUrl = '/icon.svg',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [qrColor, setQrColor] = useState<'indigo' | 'slate' | 'black' | 'emerald'>('indigo');
  const [showAvatarBadge, setShowAvatarBadge] = useState(true);
  const printableFlyerRef = useRef<HTMLDivElement | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';
  const cleanUsername = (username || 'user').trim();
  const profileUrl = `${origin}/${cleanUsername}`;
  const effectiveDisplayName = displayName || cleanUsername;

  const getColorHex = (c: 'indigo' | 'slate' | 'black' | 'emerald') => {
    switch (c) {
      case 'indigo':
        return '#4f46e5';
      case 'slate':
        return '#0f172a';
      case 'emerald':
        return '#059669';
      case 'black':
      default:
        return '#000000';
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setIsGenerating(true);
    const darkColor = getColorHex(qrColor);

    // Generate high-resolution PNG Data URL for offline download & printing (1024x1024)
    QRCode.toDataURL(profileUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction (30% tolerance) ideal for offline prints/stickers
    })
      .then((url) => {
        setDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Failed generating QR code Data URL:', err);
        setIsGenerating(false);
      });

    // Generate SVG string for vector export
    QRCode.toString(profileUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((svg) => {
        setSvgString(svg);
      })
      .catch((err) => {
        console.error('Failed generating QR SVG:', err);
      });
  }, [isOpen, profileUrl, qrColor]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = profileUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error('Clipboard copy error:', e);
    }
  };

  const handleCopyImage = async () => {
    try {
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (e) {
      console.error('Failed copying QR image to clipboard:', e);
      handleCopyLink();
    }
  };

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${cleanUsername}-offline-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanUsername}-offline-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintFlyer = () => {
    window.print();
  };

  return (
    <div
      id="qr-code-generator-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto max-w-full overflow-x-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="qr-code-generator-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>QR Code Generator</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Offline Sharing
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Share your LinkNest profile on flyers, cards, and events.
              </p>
            </div>
          </div>

          <button
            id="qr-modal-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close QR Code Generator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto overflow-x-hidden flex-1">
          {/* Public Profile URL Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Your Public Profile URL
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-indigo-300 truncate">
                <span className="truncate">{profileUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="qr-copy-url-btn"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
                title="Copy public profile link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                id="qr-open-public-btn"
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Visit public profile in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* QR Code Preview & Offline Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Interactive QR Canvas Card */}
            <div className="md:col-span-6 flex flex-col items-center justify-center w-full">
              <div
                ref={printableFlyerRef}
                className="relative p-4 sm:p-5 bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center justify-center w-full max-w-[260px] sm:max-w-[290px] mx-auto"
              >
                {/* Header inside QR Frame */}
                <div className="flex items-center gap-2 mb-3 text-slate-900">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 border border-slate-300 shrink-0">
                    <img
                      src={avatarUrl}
                      alt={effectiveDisplayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold truncate max-w-[170px]">
                    @{cleanUsername}
                  </span>
                </div>

                {/* QR Code Canvas */}
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 bg-white flex items-center justify-center">
                  {isGenerating ? (
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : dataUrl ? (
                    <img
                      src={dataUrl}
                      alt={`QR code for ${profileUrl}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-slate-400">Failed to generate</p>
                  )}

                  {/* Centered Avatar Badge in QR code */}
                  {showAvatarBadge && dataUrl && !isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full p-0.5 bg-white shadow-md border border-slate-200">
                        <img
                          src={avatarUrl}
                          alt="Badge"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer instructions */}
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
                    SCAN WITH CAMERA TO CONNECT
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                    linknest.app/{cleanUsername}
                  </p>
                </div>
              </div>

              {/* Color Customization */}
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-slate-400 font-medium">QR Color:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQrColor('indigo')}
                    className={`w-6 h-6 rounded-full bg-indigo-600 border-2 transition-all ${
                      qrColor === 'indigo' ? 'border-white scale-110' : 'border-transparent opacity-70'
                    }`}
                    title="Indigo Brand"
                  />
                  <button
                    onClick={() => setQrColor('black')}
                    className={`w-6 h-6 rounded-full bg-black border-2 transition-all ${
                      qrColor === 'black' ? 'border-white scale-110' : 'border-transparent opacity-70'
                    }`}
                    title="Classic Black (Best for print)"
                  />
                  <button
                    onClick={() => setQrColor('slate')}
                    className={`w-6 h-6 rounded-full bg-slate-900 border-2 transition-all ${
                      qrColor === 'slate' ? 'border-white scale-110' : 'border-transparent opacity-70'
                    }`}
                    title="Midnight Slate"
                  />
                  <button
                    onClick={() => setQrColor('emerald')}
                    className={`w-6 h-6 rounded-full bg-emerald-600 border-2 transition-all ${
                      qrColor === 'emerald' ? 'border-white scale-110' : 'border-transparent opacity-70'
                    }`}
                    title="Forest Emerald"
                  />
                </div>
              </div>
            </div>

            {/* Right: Offline Sharing Options & Quick Downloads */}
            <div className="md:col-span-6 space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Offline Sharing Export</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export your QR code in industry-standard formats ready for print media, shop display stands, event badges, and stickers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Download PNG */}
                <button
                  id="qr-download-png-btn"
                  onClick={handleDownloadPng}
                  disabled={!dataUrl}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold border border-slate-700 transition-all hover:border-slate-600 active:scale-98 cursor-pointer min-h-[44px]"
                  title="Download 1024x1024 PNG for flyers, stickers and merchandise"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Download PNG</span>
                </button>

                {/* Download SVG */}
                <button
                  id="qr-download-svg-btn"
                  onClick={handleDownloadSvg}
                  disabled={!svgString}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold border border-slate-700 transition-all hover:border-slate-600 active:scale-98 cursor-pointer min-h-[44px]"
                  title="Download Vector SVG for high-resolution print design"
                >
                  <FileImage className="w-4 h-4 text-emerald-400" />
                  <span>Download SVG</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Print Flyer */}
                <button
                  id="qr-print-flyer-btn"
                  onClick={handlePrintFlyer}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold border border-slate-700 transition-all hover:border-slate-600 active:scale-98 cursor-pointer min-h-[44px]"
                  title="Print offline display sheet or table tent"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Display Stand</span>
                </button>

                {/* Copy QR Image to Clipboard */}
                <button
                  id="qr-copy-image-btn"
                  onClick={handleCopyImage}
                  disabled={!dataUrl}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold border border-slate-700 transition-all hover:border-slate-600 active:scale-98 cursor-pointer min-h-[44px]"
                  title="Copy QR image to clipboard for Canva or Figma"
                >
                  {copiedImage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied Image!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-400" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>
              </div>

              {/* Offline Tips Card */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200/90 text-[11px] leading-relaxed">
                <p className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Offline Print Recommendation</span>
                </p>
                <p>
                  For physical stickers and flyers, use high contrast (Classic Black or Indigo) on a clean white background. High error-correction ensures readability even when slightly scratched or folded.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="truncate max-w-[200px] sm:max-w-none">High-Resolution Level H (30%)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
