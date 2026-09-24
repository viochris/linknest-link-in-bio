import React from 'react';

interface LinkNestLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export const LinkNestLogo: React.FC<LinkNestLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  textColor = 'text-white',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-indigo-600/30 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <svg
          viewBox="0 0 128 128"
          width="100%"
          height="100%"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="lnBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
            <linearGradient id="lnGradA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <linearGradient id="lnGradB" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="lnGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Badge Background */}
          <rect
            x="4"
            y="4"
            width="120"
            height="120"
            rx="32"
            fill="url(#lnBg)"
            stroke="#6366f1"
            strokeOpacity="0.4"
            strokeWidth="2.5"
          />

          {/* Outer Nest Orbital Arcs */}
          <path
            d="M 64 26 C 85 26 102 43 102 64 C 102 75 97 85 89 92"
            fill="none"
            stroke="url(#lnGradB)"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#lnGlow)"
          />
          <path
            d="M 64 102 C 43 102 26 85 26 64 C 26 53 31 43 39 36"
            fill="none"
            stroke="url(#lnGradA)"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#lnGlow)"
          />

          {/* Central Interlocked Link Rings */}
          <g transform="translate(64, 64) rotate(-35) translate(-64, -64)">
            <rect
              x="36"
              y="52"
              width="40"
              height="24"
              rx="12"
              fill="none"
              stroke="url(#lnGradA)"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            <rect
              x="52"
              y="52"
              width="40"
              height="24"
              rx="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
          </g>

          {/* Sparkling Nodes */}
          <circle cx="39" cy="36" r="4.5" fill="#38bdf8" filter="url(#lnGlow)" />
          <circle cx="89" cy="92" r="4.5" fill="#f43f5e" filter="url(#lnGlow)" />
          <circle cx="64" cy="64" r="3" fill="#ffffff" filter="url(#lnGlow)" />
        </svg>
      </div>

      {showText && (
        <span className={`font-extrabold text-base tracking-tight ${textColor}`}>
          LinkNest
        </span>
      )}
    </div>
  );
};
