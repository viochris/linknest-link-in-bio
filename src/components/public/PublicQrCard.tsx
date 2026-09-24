import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Profile, ThemeConfig } from '../../types';
import { QrCode, Download, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';

interface PublicQrCardProps {
  profile: Profile;
  url: string;
  theme: ThemeConfig;
  className?: string;
}

export const PublicQrCard: React.FC<PublicQrCardProps> = ({
  profile,
  url,
  theme,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((qrData) => setDataUrl(qrData))
      .catch((err) => console.error('Failed to generate QR on public page:', err));
  }, [url]);

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    setDownloading(true);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${profile.username}-linknest-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 1200);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      id="public-profile-qr-card"
      className={`w-full rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 shadow-lg text-center ${
        theme.button_style === 'pill'
          ? 'rounded-3xl'
          : theme.button_style === 'sharp'
            ? 'rounded-none'
            : 'rounded-2xl'
      } ${className}`}
      style={{
        backgroundColor: theme.button_bg ? `${theme.button_bg}` : 'rgba(15, 23, 42, 0.75)',
        borderColor: theme.accent_color ? `${theme.accent_color}30` : 'rgba(255, 255, 255, 0.15)',
        color: theme.button_text || '#ffffff',
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b pb-3 mb-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${theme.accent_color || '#6366f1'}25`, color: theme.accent_color || '#818cf8' }}
          >
            <QrCode className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Offline QR Access
          </span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{
            backgroundColor: `${theme.accent_color || '#6366f1'}20`,
            color: theme.accent_color || '#818cf8',
          }}
        >
          <Smartphone className="w-3 h-3" />
          Scan on Phone
        </span>
      </div>

      {/* QR Code Canvas */}
      <div className="relative inline-block p-3 bg-white rounded-xl shadow-md border-2 border-white/40 mb-3 mx-auto">
        {dataUrl ? (
          <div className="relative">
            <img
              src={dataUrl}
              alt={`QR Code for @${profile.username}`}
              className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
            />
            {profile.avatar_url && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-md">
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
            Loading QR Code...
          </div>
        )}
      </div>

      <p className="text-xs font-medium opacity-90 max-w-xs mx-auto mb-1">
        Scan with your smartphone camera to open @{profile.username}&apos;s bio link.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <button
          type="button"
          onClick={handleDownloadPng}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          style={{
            backgroundColor: theme.accent_color || '#4f46e5',
            color: '#ffffff',
          }}
          title="Download PNG for printing or saving"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{downloading ? 'Downloading...' : 'Download PNG'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all bg-black/20 hover:bg-black/30 border border-white/10 cursor-pointer"
          title="Copy link to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
};
