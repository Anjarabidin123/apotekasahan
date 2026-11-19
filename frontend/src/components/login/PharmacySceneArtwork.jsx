import React from 'react';

export function PharmacySceneArtwork() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative w-full mt-auto z-0 lg:fixed lg:inset-x-0 lg:bottom-0 overflow-hidden"
    >
      {/* Pemandangan Apotek Botani (Desktop & Tablet) */}
      <svg
        viewBox="0 0 1440 310"
        preserveAspectRatio="xMidYMax slice"
        className="hidden sm:block w-full h-[220px] lg:h-[260px]"
      >
        <defs>
          <linearGradient id="emeraldSignGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="awningGreenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="skyGlassGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>
          <linearGradient id="horizonHillBack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#CBEAD9" />
            <stop offset="55%" stopColor="#D3EEF2" />
            <stop offset="100%" stopColor="#BFE7D3" />
          </linearGradient>
        </defs>

        <g className="animate-cloud-float">
          <g fill="#FFFFFF" opacity="0.88">
            <ellipse cx="210" cy="48" rx="46" ry="13" />
            <circle cx="194" cy="43" r="12" />
            <circle cx="218" cy="39" r="15" />
          </g>
          <g fill="#FFFFFF" opacity="0.82">
            <ellipse cx="760" cy="36" rx="54" ry="14" />
            <circle cx="742" cy="32" r="13" />
            <circle cx="768" cy="28" r="16" />
          </g>
          <g fill="#FFFFFF" opacity="0.78">
            <ellipse cx="1220" cy="52" rx="42" ry="12" />
            <circle cx="1208" cy="48" r="11" />
            <circle cx="1228" cy="46" r="13" />
          </g>
        </g>

        {/* Perbukitan sage-sky berlapis */}
        <path d="M0,210 Q260,164 540,196 T1080,186 T1440,202 L1440,310 L0,310 Z" fill="url(#horizonHillBack)" opacity="0.9" />
        <path d="M0,242 Q380,206 760,236 T1440,224 L1440,310 L0,310 Z" fill="#A4DBC1" opacity="0.78" />

        {/* Trotoar apotek yang terang & bersih */}
        <rect x="0" y="248" width="1440" height="62" fill="#F9FCFA" />
        <rect x="0" y="248" width="1440" height="4" fill="#B7DEC9" />
        <line x1="20" y1="275" x2="1420" y2="275" stroke="#D5EDE0" strokeWidth="3" strokeDasharray="18 16" strokeLinecap="round" />

        {/* Pohon botani kiri */}
        <g transform="translate(34, 150)">
          <rect x="28" y="54" width="10" height="46" rx="4" fill="#78350F" />
          <circle cx="33" cy="38" r="24" fill="#059669" />
          <circle cx="18" cy="47" r="16" fill="#047857" />
          <circle cx="46" cy="45" r="15" fill="#34D399" />
          <circle cx="24" cy="31" r="3" fill="#FEF08A" />
          <circle cx="42" cy="39" r="2.5" fill="#FDE047" />
        </g>

        <g transform="translate(96, 182)">
          <g className="animate-apotek-bob">
            <rect x="16" y="34" width="7" height="34" rx="3" fill="#92400E" />
            <circle cx="20" cy="22" r="16" fill="#10B981" />
            <circle cx="11" cy="26" r="10" fill="#059669" />
            <circle cx="29" cy="27" r="9.5" fill="#6EE7B7" />
          </g>
        </g>

        {/* Bangunan Utama Apotek Asahan */}
        <g transform="translate(148, 134)">
          <ellipse cx="96" cy="116" rx="90" ry="6" fill="#065F46" opacity="0.14" />
          <rect x="14" y="28" width="166" height="86" rx="10" fill="#FFFDF9" stroke="#6EE7B7" strokeWidth="2.5" />

          {/* Papan Nama Hijau Emerald */}
          <rect x="34" y="2" width="126" height="26" rx="8" fill="url(#emeraldSignGrad)" />
          <circle cx="51" cy="15" r="7.5" fill="#FFFFFF" />
          <path d="M51 11V19M47 15H55" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
          <text x="64" y="19" fill="#FFFFFF" fontSize="10.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
            APOTEK
          </text>

          {/* Kanopi bergaris hijau emerald & putih mint */}
          <path d="M8 34 C8 28 12 26 18 26 H178 C184 26 188 28 188 34 L194 48 H2 Z" fill="url(#awningGreenGrad)" />
          <rect x="24" y="26" width="20" height="22" fill="#ECFDF5" opacity="0.95" />
          <rect x="66" y="26" width="20" height="22" fill="#ECFDF5" opacity="0.95" />
          <rect x="108" y="26" width="20" height="22" fill="#ECFDF5" opacity="0.95" />
          <rect x="150" y="26" width="20" height="22" fill="#ECFDF5" opacity="0.95" />
          <circle cx="13" cy="48" r="10.5" fill="#059669" />
          <circle cx="34" cy="48" r="10.5" fill="#FFFFFF" />
          <circle cx="55" cy="48" r="10.5" fill="#059669" />
          <circle cx="76" cy="48" r="10.5" fill="#FFFFFF" />
          <circle cx="97" cy="48" r="10.5" fill="#059669" />
          <circle cx="118" cy="48" r="10.5" fill="#FFFFFF" />
          <circle cx="139" cy="48" r="10.5" fill="#059669" />
          <circle cx="160" cy="48" r="10.5" fill="#FFFFFF" />
          <circle cx="182" cy="48" r="10.5" fill="#059669" />

          {/* Pintu kaca apotek bernuansa biru langit cerah */}
          <rect x="24" y="64" width="36" height="50" rx="6" fill="url(#skyGlassGrad)" stroke="#38BDF8" strokeWidth="2" />
          <line x1="30" y1="74" x2="39" y2="68" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <line x1="54" y1="86" x2="54" y2="95" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />

          {/* Loket & Apoteker ramah + botol rak */}
          <rect x="74" y="62" width="92" height="40" rx="8" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="1.8" />
          <rect x="82" y="70" width="8" height="12" rx="2" fill="#0EA5E9" opacity="0.65" />
          <rect x="92" y="73" width="6" height="9" rx="1.5" fill="#F59E0B" opacity="0.75" />
          <circle cx="122" cy="77" r="9" fill="#FDBA74" />
          <path d="M113 75 C113 68 131 68 131 75 Z" fill="#1E293B" />
          <circle cx="119" cy="77" r="1.2" fill="#1E293B" />
          <circle cx="125" cy="77" r="1.2" fill="#1E293B" />
          <path d="M119.5 80.5 Q122 83 124.5 80.5" stroke="#9A3412" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M110 102 C110 91 134 91 134 102 Z" fill="#FFFFFF" stroke="#A7F3D0" strokeWidth="1.5" />
          <line x1="122" y1="93" x2="122" y2="101" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <rect x="70" y="98" width="100" height="8" rx="3" fill="#059669" />

          {/* Pot tanaman obat terakota */}
          <rect x="166" y="101" width="12" height="12" rx="3" fill="#D97706" />
          <circle cx="172" cy="96" r="5.5" fill="#10B981" />
          <circle cx="168" cy="93" r="3.5" fill="#34D399" />
        </g>

        {/* Pelanggan apotek */}
        <g transform="translate(344, 198)">
          <g className="animate-apotek-bob">
            <g transform="translate(-4, -22)">
              <rect x="0" y="0" width="60" height="16" rx="8" fill="#FFFFFF" stroke="#6EE7B7" strokeWidth="1.2" />
              <text x="30" y="11" textAnchor="middle" fill="#047857" fontSize="7.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
                Sehat terus!
              </text>
            </g>
            <circle cx="14" cy="12" r="8" fill="#FDBA74" />
            <path d="M6 10 C6 3 22 3 22 10 Z" fill="#0F172A" />
            <circle cx="11.5" cy="12" r="1" fill="#1E293B" />
            <circle cx="16.5" cy="12" r="1" fill="#1E293B" />
            <rect x="6" y="21" width="16" height="22" rx="7" fill="#FB7185" />
            <rect x="8" y="42" width="4" height="12" rx="2" fill="#334155" />
            <rect x="16" y="42" width="4" height="12" rx="2" fill="#334155" />
          </g>
        </g>

        <g transform="translate(386, 202)">
          <circle cx="14" cy="12" r="8" fill="#FED7AA" />
          <path d="M7 9 C8 3 21 3 21 9 Z" fill="#065F46" />
          <circle cx="11.5" cy="12" r="1" fill="#1E293B" />
          <circle cx="16.5" cy="12" r="1" fill="#1E293B" />
          <rect x="6" y="21" width="16" height="20" rx="7" fill="#FBBF24" />
          <rect x="0" y="25" width="8" height="10" rx="1.5" fill="#FFFFFF" stroke="#6EE7B7" />
          <rect x="8" y="40" width="4" height="11" rx="2" fill="#1E293B" />
          <rect x="16" y="40" width="4" height="11" rx="2" fill="#1E293B" />
        </g>

        <g transform="translate(426, 200)">
          <circle cx="14" cy="12" r="8" fill="#FDBA74" />
          <path d="M5 11 C5 2 23 2 23 11 Z" fill="#7C2D12" />
          <circle cx="11.5" cy="12" r="1" fill="#1E293B" />
          <circle cx="16.5" cy="12" r="1" fill="#1E293B" />
          <rect x="6" y="21" width="16" height="22" rx="7" fill="#14B8A6" />
          <rect x="8" y="42" width="4" height="11" rx="2" fill="#334155" />
          <rect x="16" y="42" width="4" height="11" rx="2" fill="#334155" />
        </g>

        {/* Kurir obat PBF + kucing */}
        <g transform="translate(520, 202)">
          <g className="animate-apotek-stroll">
            <circle cx="16" cy="10" r="8" fill="#FDBA74" />
            <path d="M8 8 C8 2 24 2 24 8 Z" fill="#059669" />
            <rect x="16" y="6" width="12" height="3" rx="1.5" fill="#047857" />
            <circle cx="19" cy="10" r="1" fill="#1E293B" />
            <rect x="8" y="19" width="16" height="20" rx="7" fill="#0D9488" />
            <path d="M12 38 L8 50" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <path d="M20 38 L25 49" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <rect x="-2" y="24" width="11" height="13" rx="2.5" fill="#FDE047" stroke="#D97706" strokeWidth="1.2" />
            <path d="M1 24 C1 20 6 20 6 24" stroke="#92400E" strokeWidth="1.2" fill="none" />

            <g transform="translate(34, 34)">
              <ellipse cx="10" cy="11" rx="8" ry="5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
              <circle cx="17" cy="7" r="4.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
              <polygon points="14,4 16,0 18,4" fill="#FDA4AF" />
              <circle cx="18.5" cy="6.5" r="0.9" fill="#0F172A" />
              <path d="M2 10 Q-2 4 3 3" stroke="#94A3B8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <line x1="6" y1="15" x2="6" y2="18" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="13" y1="15" x2="13" y2="18" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* Pepohonan kanan menyeimbangkan latar desktop */}
        <g transform="translate(740, 178)">
          <rect x="18" y="38" width="8" height="34" rx="3" fill="#78350F" />
          <circle cx="22" cy="28" r="18" fill="#059669" />
          <circle cx="11" cy="34" r="12" fill="#047857" />
          <circle cx="33" cy="34" r="11" fill="#34D399" />
        </g>

        <g transform="translate(1280, 150)">
          <rect x="26" y="54" width="11" height="44" rx="4" fill="#78350F" />
          <circle cx="31" cy="38" r="25" fill="#10B981" />
          <circle cx="16" cy="47" r="16" fill="#047857" />
          <circle cx="45" cy="46" r="16" fill="#6EE7B7" />
          <circle cx="34" cy="30" r="3" fill="#FEF08A" />
        </g>

        <g transform="translate(1180, 204)">
          <g className="animate-apotek-bob">
            <circle cx="14" cy="11" r="7.5" fill="#FED7AA" />
            <path d="M6 10 C6 3 22 3 22 10 Z" fill="#064E3B" />
            <rect x="6" y="19" width="16" height="21" rx="7" fill="#34D399" />
            <rect x="9" y="39" width="4" height="11" rx="2" fill="#334155" />
            <rect x="16" y="39" width="4" height="11" rx="2" fill="#334155" />
          </g>
        </g>
      </svg>

      {/* Pemandangan Apotek Botani (Mobile) */}
      <svg
        viewBox="0 0 430 148"
        preserveAspectRatio="xMidYMax slice"
        className="sm:hidden w-full h-[138px] block"
      >
        <circle cx="354" cy="24" r="14" fill="#FDE68A" opacity="0.65" />
        <g fill="#FFFFFF" opacity="0.82">
          <ellipse cx="145" cy="22" rx="30" ry="8" />
          <circle cx="135" cy="18" r="8" />
          <circle cx="152" cy="17" r="9.5" />
        </g>
        <path d="M0,92 Q120,66 230,86 T430,80 L430,148 L0,148 Z" fill="#BCE6D1" opacity="0.86" />
        <rect x="0" y="122" width="430" height="26" fill="#F9FCFA" />
        <rect x="0" y="122" width="430" height="3" fill="#B7DEC9" />

        <g transform="translate(8, 46)">
          <rect x="18" y="42" width="8" height="36" rx="3" fill="#78350F" />
          <circle cx="22" cy="30" r="18" fill="#059669" />
          <circle cx="11" cy="37" r="12" fill="#047857" />
          <circle cx="32" cy="36" r="11" fill="#34D399" />
        </g>

        <g transform="translate(52, 34)">
          <rect x="10" y="22" width="136" height="68" rx="8" fill="#FFFDF9" stroke="#6EE7B7" strokeWidth="2" />
          <rect x="30" y="2" width="96" height="20" rx="6" fill="#059669" />
          <text x="78" y="15.5" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
            + APOTEK
          </text>
          <path d="M4 26 H152 L156 38 H0 Z" fill="#10B981" />
          <rect x="20" y="26" width="18" height="12" fill="#ECFDF5" opacity="0.95" />
          <rect x="58" y="26" width="18" height="12" fill="#ECFDF5" opacity="0.95" />
          <rect x="96" y="26" width="18" height="12" fill="#ECFDF5" opacity="0.95" />
          <rect x="130" y="26" width="16" height="12" fill="#ECFDF5" opacity="0.95" />

          <rect x="20" y="50" width="30" height="40" rx="5" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="62" y="48" width="74" height="32" rx="6" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="99" cy="60" r="7" fill="#FDBA74" />
          <path d="M90 78 C90 70 108 70 108 78 Z" fill="#FFFFFF" stroke="#A7F3D0" />
          <rect x="58" y="76" width="82" height="6" rx="2.5" fill="#059669" />
        </g>

        <g transform="translate(210, 80)">
          <g className="animate-apotek-bob">
            <circle cx="11" cy="10" r="6.5" fill="#FDBA74" />
            <rect x="5" y="17" width="12" height="17" rx="5" fill="#FB7185" />
            <rect x="6" y="34" width="3.5" height="9" rx="1.5" fill="#334155" />
            <rect x="12" y="34" width="3.5" height="9" rx="1.5" fill="#334155" />
          </g>
        </g>
        <g transform="translate(236, 82)">
          <circle cx="11" cy="10" r="6.5" fill="#FED7AA" />
          <rect x="5" y="17" width="12" height="16" rx="5" fill="#FBBF24" />
          <rect x="6" y="33" width="3.5" height="9" rx="1.5" fill="#1E293B" />
          <rect x="12" y="33" width="3.5" height="9" rx="1.5" fill="#1E293B" />
        </g>

        <g transform="translate(302, 80)">
          <g className="animate-apotek-stroll">
            <circle cx="12" cy="9" r="6.5" fill="#FDBA74" />
            <rect x="6" y="16" width="12" height="17" rx="5" fill="#0D9488" />
            <path d="M9 32 L6 42" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M15 32 L19 42" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="-1" y="20" width="9" height="10" rx="2" fill="#FDE047" />
            <g transform="translate(24, 28)">
              <ellipse cx="8" cy="9" rx="6.5" ry="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
              <circle cx="14" cy="6" r="3.8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            </g>
          </g>
        </g>

        <g transform="translate(384, 48)">
          <rect x="16" y="40" width="8" height="36" rx="3" fill="#78350F" />
          <circle cx="20" cy="28" r="18" fill="#10B981" />
          <circle cx="10" cy="35" r="12" fill="#047857" />
          <circle cx="30" cy="34" r="12" fill="#6EE7B7" />
        </g>
      </svg>
    </div>
  );
}
