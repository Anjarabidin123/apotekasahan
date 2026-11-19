import React from 'react';

export function DashboardHeroIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 190"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-0 w-full h-full opacity-75 sm:opacity-95"
    >
      <defs>
        <linearGradient id="dashHillBack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#CBEAD9" />
          <stop offset="100%" stopColor="#B5E3CC" />
        </linearGradient>
        <linearGradient id="dashHillFront" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9EDAC0" />
          <stop offset="100%" stopColor="#86CFAC" />
        </linearGradient>
      </defs>

      {/* Awan lembut */}
      <ellipse cx="485" cy="38" rx="90" ry="15" fill="#FFFFFF" fillOpacity="0.65" />
      <ellipse cx="320" cy="28" rx="54" ry="11" fill="#FFFFFF" fillOpacity="0.5" />

      {/* Lingkaran motif apotek */}
      <circle cx="475" cy="108" r="56" fill="#FFFFFF" fillOpacity="0.28" />
      <circle cx="475" cy="108" r="38" stroke="#6EE7B7" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />

      {/* Perbukitan sage-emerald */}
      <path d="M0 162 Q170 132 340 154 T640 142 L640 190 L0 190 Z" fill="url(#dashHillBack)" fillOpacity="0.78" />
      <path d="M240 190 Q415 136 640 156 L640 190 Z" fill="url(#dashHillFront)" fillOpacity="0.72" />

      {/* Paviliun Apotek & Gudang Obat */}
      <g transform="translate(415, 118)">
        <ellipse cx="33" cy="60" rx="34" ry="4" fill="#064E3B" fillOpacity="0.12" />
        <rect x="6" y="22" width="54" height="36" rx="5" fill="#FFFFFF" stroke="#A7F3D0" strokeWidth="1.6" />
        <path d="M0 24 L33 4 L66 24 Z" fill="#059669" />
        <path d="M8 22 L33 7 L58 22" stroke="#6EE7B7" strokeWidth="1.5" fill="none" />
        <circle cx="33" cy="16" r="5.5" fill="#FFFFFF" />
        <path d="M33 13V19M30 16H36" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="26" y="37" width="14" height="21" rx="2.5" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.2" />
        <rect x="12" y="30" width="9" height="9" rx="2" fill="#A7F3D0" />
        <rect x="45" y="30" width="9" height="9" rx="2" fill="#A7F3D0" />
      </g>

      {/* Kapsul obat & botol kecil dekoratif */}
      <g transform="translate(362, 134) rotate(-18)">
        <rect x="0" y="0" width="22" height="10" rx="5" fill="#FFFFFF" stroke="#6EE7B7" strokeWidth="1.2" />
        <path d="M11 0 H17 A5 5 0 0 1 17 10 H11 Z" fill="#10B981" />
      </g>

      {/* Ranting & daun herbal apotek di sisi kanan */}
      <g transform="translate(520, 96)" opacity="0.92">
        <path d="M24 90 C22 56 26 26 42 8" stroke="#047857" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M25 66 C4 59 -3 44 10 38 C21 33 27 50 25 66 Z" fill="#059669" />
        <path d="M27 46 C47 41 56 26 43 20 C31 15 26 33 27 46 Z" fill="#10B981" />
        <path d="M31 28 C16 21 15 8 25 6 C34 4 36 18 31 28 Z" fill="#34D399" />
        <circle cx="48" cy="14" r="3" fill="#FDE047" />
      </g>
    </svg>
  );
}

export function DashboardMobileAccent() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 110"
      className="pointer-events-none select-none absolute -right-2 -bottom-2 w-36 h-24 opacity-45"
      fill="none"
    >
      <circle cx="118" cy="68" r="44" fill="#A7F3D0" fillOpacity="0.45" />
      <path d="M92 104 C94 74 106 46 130 26" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M98 82 C76 76 70 60 83 54 C94 49 101 66 98 82 Z" fill="#10B981" fillOpacity="0.7" />
      <path d="M106 60 C126 56 135 40 122 34 C110 29 104 46 106 60 Z" fill="#34D399" fillOpacity="0.8" />
      <rect x="118" y="64" width="22" height="22" rx="6" fill="#FFFFFF" fillOpacity="0.8" />
      <path d="M129 69V81M123 75H135" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
