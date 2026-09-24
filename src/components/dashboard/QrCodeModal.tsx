import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Profile } from '../../types';
import {
  QrCode,
  Download,
  Copy,
  Check,
  X,
  Share2,
  Printer,
  ExternalLink,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  customUrl?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, profile, customUrl }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [qrColor, setQrColor] = useState<'slate' | 'indigo' | 'black'>('indigo');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest.app';
  const defaultUrl = `${origin}/${profile.username}`;
  const profileUrl = customUrl || defaultUrl;

  const getColorHex = (c: 'slate' | 'indigo' | 'black') => {
    switch (c) {
      case 'indigo':
        return '#4f46e5';
      case 'slate':
        return '#0f172a';
      case 'black':
      default:
        return '#000000';
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setIsGenerating(true);

    const darkColor = getColorHex(qrColor);

    // Generate high-resolution PNG Data URL
    QRCode.toDataURL(profileUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
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

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error('Clipboard copy error:', e);
    }
  };

  const handleDownloadPng = () => {
    if (!dataUrl) return;

    // Create a composite canvas with branding for offline print
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 1200;
    canvas.width = size;
    canvas.height = size + 260; // Extra room for name & branding

    // White background card
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle gradient banner header
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 160);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#6366f1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 160);

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LinkNest Offline Connect', canvas.width / 2, 100);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw QR Code
      const qrSize = 960;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 200;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Bottom User Details
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
      ctx.fillText(profile.display_name || profile.username, canvas.width / 2, qrY + qrSize + 70);

      ctx.fillStyle = '#6366f1';
      ctx.font = '500 34px monospace';
      ctx.fillText(`linknest.app/${profile.username}`, canvas.width / 2, qrY + qrSize + 130);

      ctx.fillStyle = '#64748b';
      ctx.font = '400 28px system-ui, -apple-system, sans-serif';
      ctx.fillText('Scan with camera to view links, portfolio & projects', canvas.width / 2, qrY + qrSize + 190);

      // Download
      const link = document.createElement('a');
      link.download = `${profile.username}-linknest-qr-flyer.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = dataUrl;
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${profile.username}-linknest-qr.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyImage = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        handleDownloadPng();
      }
    } catch (err) {
      console.warn('Direct image clipboard copy not supported in this browser, triggering download:', err);
      handleDownloadPng();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LinkNest QR Flyer - ${profile.display_name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              text-align: center;
              margin: 0;
              padding: 40px;
              color: #0f172a;
            }
            .card {
              border: 3px solid #e2e8f0;
              border-radius: 28px;
              padding: 48px;
              max-width: 480px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.06);
            }
            .header {
              font-size: 28px;
              font-weight: 800;
              margin-bottom: 6px;
            }
            .sub {
              font-size: 16px;
              color: #64748b;
              margin-bottom: 28px;
            }
            .qr-frame {
              background: white;
              padding: 16px;
              border-radius: 20px;
              border: 1px solid #cbd5e1;
              display: inline-block;
              margin-bottom: 24px;
            }
            .qr-frame img {
              width: 320px;
              height: 320px;
              display: block;
            }
            .link-box {
              font-family: monospace;
              font-size: 18px;
              font-weight: 700;
              color: #4f46e5;
              margin-bottom: 8px;
            }
            .instruction {
              font-size: 14px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">${profile.display_name || profile.username}</div>
            <div class="sub">Scan to connect & explore my verified projects</div>
            <div class="qr-frame">
              <img src="${dataUrl}" alt="QR Code" />
            </div>
            <div class="link-box">${profileUrl}</div>
            <div class="instruction">Scan with any smartphone camera</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto max-w-full overflow-x-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl overflow-hidden flex flex-col gap-4 sm:gap-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Offline QR Code Generator</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Share your LinkNest profile instantly on business cards, stickers, and events.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Canvas Card */}
        <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800 relative group">
          {isGenerating ? (
            <div className="w-56 h-56 flex items-center justify-center text-slate-500 text-xs">
              Generating high-res QR code...
            </div>
          ) : (
            <div className="relative p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center">
              <img
                src={dataUrl}
                alt={`QR code for ${profile.username}`}
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
              />

              {/* Center Profile Badge Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full p-1 bg-white shadow-md flex items-center justify-center">
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full rounded-full object-cover border border-slate-200"
                  onError={(e) => {
                    // Fallback to text initials if image fails
                    (e.currentTarget as any).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Color Style Picker */}
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className="text-slate-400 font-medium">QR Style:</span>
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setQrColor('indigo')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  qrColor === 'indigo'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span>Indigo</span>
              </button>
              <button
                type="button"
                onClick={() => setQrColor('black')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  qrColor === 'black'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/20" />
                <span>High Contrast</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Link Bar with Copy */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Public Profile Link (Target of QR Code)</span>
            <span className="text-[10px] text-indigo-400 font-mono">Scan or Click</span>
          </label>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={profileUrl}
              className="bg-transparent text-xs text-slate-200 w-full outline-none px-2 font-mono"
            />
            <button
              id="qr-copy-url-btn"
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer min-h-[36px]"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
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

        {/* Action Buttons for Offline Sharing */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            id="qr-download-png-btn"
            onClick={handleDownloadPng}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer min-h-[44px]"
            title="Download high-resolution flyer image for print"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Download PNG</span>
          </button>

          <button
            id="qr-download-svg-btn"
            onClick={handleDownloadSvg}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer min-h-[44px]"
            title="Download vector SVG for crisp printing at any size"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Vector SVG</span>
          </button>

          <button
            id="qr-copy-image-btn"
            onClick={handleCopyImage}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer min-h-[44px]"
            title="Copy QR code image to clipboard"
          >
            {copiedImage ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copied Image!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Image</span>
              </>
            )}
          </button>

          <button
            id="qr-print-btn"
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer min-h-[44px]"
            title="Print offline table display or flyer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Flyer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
