import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Profile } from '../../types';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Smartphone,
  Share2,
  FileImage,
  Palette,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface QrCodeTabProps {
  profile: Profile;
  onViewPublicProfile?: (username: string) => void;
}

export const QrCodeTab: React.FC<QrCodeTabProps> = ({ profile, onViewPublicProfile }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [qrColor, setQrColor] = useState<'indigo' | 'slate' | 'black' | 'emerald'>('indigo');
  const [showAvatarBadge, setShowAvatarBadge] = useState(true);
  const [resolution, setResolution] = useState<number>(1024);
  const [downloadingFlyerImage, setDownloadingFlyerImage] = useState(false);
  const flyerRef = useRef<HTMLDivElement | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknest-link-in-bio.vercel.app';
  const displayHost = typeof window !== 'undefined' && window.location.host
    ? window.location.host
    : 'linknest-link-in-bio.vercel.app';
  const profileUrl = `${origin}/${profile.username}`;

  const getColorHex = (c: 'indigo' | 'slate' | 'black' | 'emerald') => {
    switch (c) {
      case 'indigo':
        return '#4f46e5';
      case 'slate':
        return '#334155';
      case 'emerald':
        return '#059669';
      case 'black':
      default:
        return '#000000';
    }
  };

  useEffect(() => {
    setIsGenerating(true);
    const darkColor = getColorHex(qrColor);

    QRCode.toDataURL(profileUrl, {
      width: resolution,
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
        console.error('Failed generating QR Data URL:', err);
        setIsGenerating(false);
      });

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
  }, [profileUrl, qrColor, resolution]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
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
      console.error('Failed copying image to clipboard:', e);
      handleCopyLink();
    }
  };

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${profile.username}-qr-code.png`;
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
    a.download = `${profile.username}-qr-code.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Canvas Fallback Renderer for Flyer Image Download
  const downloadFlyerCanvasFallback = async () => {
    try {
      const canvas = document.createElement('canvas');
      const scale = 2;
      const width = 480 * scale;
      const height = 660 * scale;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background with rounded corners
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 32 * scale);
      ctx.fill();

      // Top gradient bar
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#4f46e5');
      grad.addColorStop(0.5, '#9333ea');
      grad.addColorStop(1, '#4338ca');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 6 * scale);

      // Display name
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${24 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(profile.display_name, width / 2, 130 * scale);

      // Username
      ctx.fillStyle = '#4f46e5';
      ctx.font = `600 ${14 * scale}px monospace`;
      ctx.fillText(`@${profile.username}`, width / 2, 155 * scale);

      // Bio snippet
      if (profile.bio) {
        ctx.fillStyle = '#475569';
        ctx.font = `${12 * scale}px sans-serif`;
        const bioText = profile.bio.length > 70 ? profile.bio.slice(0, 67) + '...' : profile.bio;
        ctx.fillText(bioText, width / 2, 180 * scale);
      }

      // Draw QR Code
      if (dataUrl) {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.src = dataUrl;
        });
        const qrSize = 220 * scale;
        const qrX = (width - qrSize) / 2;
        const qrY = 210 * scale;

        // Container box behind QR
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(qrX - 16 * scale, qrY - 16 * scale, qrSize + 32 * scale, qrSize + 32 * scale, 20 * scale);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      }

      // Scan with any camera app
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${14 * scale}px sans-serif`;
      ctx.fillText('📱 Scan with any camera app', width / 2, 505 * scale);

      ctx.fillStyle = '#64748b';
      ctx.font = `${11 * scale}px sans-serif`;
      ctx.fillText('Instant access to all links, portfolio projects & contact socials.', width / 2, 528 * scale);

      // URL Pill
      const pillText = `${displayHost}/${profile.username}`;
      ctx.fillStyle = '#f1f5f9';
      const pillWidth = 240 * scale;
      const pillHeight = 32 * scale;
      const pillX = (width - pillWidth) / 2;
      const pillY = 550 * scale;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 16 * scale);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = `600 ${12 * scale}px monospace`;
      ctx.fillText(pillText, width / 2, pillY + 21 * scale);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${10 * scale}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('Powered by LinkNest', 32 * scale, 625 * scale);
      ctx.textAlign = 'right';
      ctx.fillText('Self-hosted offline QR', width - 32 * scale, 625 * scale);

      const dataUri = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `${profile.username}-flyer-card.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Canvas fallback download failed:', e);
    }
  };

  // Download the exact flyer card as a high-resolution PNG photo / image
  const handleDownloadFlyerImage = async () => {
    if (!flyerRef.current) return;
    setDownloadingFlyerImage(true);

    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 3, // 3x ultra-sharp resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `${profile.username}-flyer-card.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn('html2canvas capture warning, using high-res canvas generator:', err);
      await downloadFlyerCanvasFallback();
    } finally {
      setDownloadingFlyerImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <span>Offline QR Code &amp; Flyer Generator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Download your personalized QR flyer card as a high-resolution photo (PNG) ready for sharing or printing.
          </p>
        </div>
      </div>

      {/* Main Grid: QR Controls & Flyer Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: QR Code Visual & Quick Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full print-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-xl h-full flex-1 justify-between">
            <div className="w-full flex flex-col items-center">
              {/* Color Palette Selector */}
              <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-medium flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>QR Color</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {(['indigo', 'slate', 'black', 'emerald'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setQrColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform active:scale-95 cursor-pointer ${
                        color === 'indigo'
                          ? 'bg-indigo-600'
                          : color === 'slate'
                          ? 'bg-slate-700'
                          : color === 'emerald'
                          ? 'bg-emerald-600'
                          : 'bg-black'
                      } ${qrColor === color ? 'border-white scale-110 shadow-md' : 'border-slate-800 opacity-60'}`}
                      title={color.toUpperCase()}
                    />
                  ))}
                </div>
              </div>

              {/* QR Visual Canvas */}
              <div className="relative p-4 bg-white rounded-2xl shadow-xl transition-all">
                {dataUrl ? (
                  <div className="relative">
                    <img
                      src={dataUrl}
                      alt={`QR Code for ${profile.username}`}
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                    {showAvatarBadge && profile.avatar_url && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full border-2 border-white bg-white overflow-hidden shadow-lg">
                          <img
                            src={profile.avatar_url}
                            alt={profile.display_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    {isGenerating ? 'Generating QR...' : 'Failed to generate'}
                  </div>
                )}
              </div>

              {/* Avatar Badge Toggle */}
              <label className="flex items-center gap-2 mt-4 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAvatarBadge}
                  onChange={(e) => setShowAvatarBadge(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                />
                <span>Include Profile Avatar in QR Center</span>
              </label>

              {/* Destination URL Box with Quick Copy & Open */}
              <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-2 mt-4">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Target Public Profile URL:</span>
                  <span className="text-indigo-400 font-mono text-[10px]">Level H (30% ECC)</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-indigo-300 truncate flex-1">{profileUrl}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Copy Profile URL"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Open public profile in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* PNG Resolution Selector */}
              <div className="w-full flex items-center justify-between pt-2 text-xs text-slate-400">
                <span className="font-medium text-slate-300">PNG Resolution:</span>
                <div className="flex items-center gap-1">
                  {[
                    { label: '512px', val: 512 },
                    { label: '1024px', val: 1024 },
                    { label: '2048px (HD)', val: 2048 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setResolution(item.val)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                        resolution === item.val
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions (QR Only) */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>QR Only (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                  title="Download scalable vector SVG for print shops"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Vector (SVG)</span>
                </button>
              </div>

              {/* Copy Actions */}
              <div className="w-full grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
                >
                  {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedImage ? 'Copied QR!' : 'Copy QR'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied URL!' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            {/* Offline Print Recommendation Card */}
            <div className="w-full bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5 text-left mt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Offline Print Recommendation</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                For physical stickers, shop display stands, event badges, and flyers, use high contrast (Classic Black or Indigo) on a clean white background. High error-correction ensures readability even when slightly scratched or folded.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Printable Poster / Table-Tent Flyer Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full flex-1 justify-between space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 print-hidden">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Event Flyer / Standee Card</h3>
              </div>

              {/* Single Dedicated Download Button for Flyer Card */}
              <button
                type="button"
                id="download-flyer-image-btn"
                onClick={handleDownloadFlyerImage}
                disabled={downloadingFlyerImage}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer self-start sm:self-auto"
                title="Download high-resolution flyer card photo (PNG)"
              >
                {downloadingFlyerImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Image...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Download Flyer Card (PNG)</span>
                  </>
                )}
              </button>
            </div>

            {/* Realistic Printable Flyer Mockup Card (Identical to user's screenshot) */}
            <div
              ref={flyerRef}
              className="printable-flyer-card bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center relative overflow-hidden max-w-md mx-auto"
            >
              {/* Decorative top accent band */}
              <div className="w-full h-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 absolute top-0 left-0" />

              {/* Avatar & Display Name */}
              <div className="mt-3 mb-2 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 shadow-md overflow-hidden mb-3">
                  <img
                    src={profile.avatar_url || '/icon.svg'}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {profile.display_name}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 font-mono mt-0.5">
                  @{profile.username}
                </p>
                {profile.bio && (
                  <p className="text-xs text-slate-600 max-w-sm mt-1.5 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Central Flyer QR Code */}
              <div className="my-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner">
                {dataUrl ? (
                  <div className="relative">
                    <img
                      src={dataUrl}
                      alt="Printable Flyer QR"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                    {showAvatarBadge && profile.avatar_url && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow">
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                    Loading flyer...
                  </div>
                )}
              </div>

              {/* Call to action */}
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Scan with any camera app</span>
                </p>
                <p className="text-xs text-slate-500">
                  Instant access to all links, portfolio projects &amp; contact socials.
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-mono text-[11px] font-semibold">
                    linknest.app/{profile.username}
                  </span>
                </div>
              </div>

              {/* Footer watermark */}
              <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-400">
                <span>Powered by LinkNest</span>
                <span>Self-hosted offline QR</span>
              </div>
            </div>

            {/* Instructions box */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5 print-hidden">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Flyer Usage &amp; Sharing Tips:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400 pl-1">
                <li>
                  <strong>Download Flyer Card (PNG):</strong> Save the card as a high-resolution, crystal-clear PNG photo to post directly on Instagram Stories, LinkedIn, WhatsApp, or send to print shops for physical cards and table standees.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
