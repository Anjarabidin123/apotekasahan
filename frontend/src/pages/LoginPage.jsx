import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/common/BrandLogo';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  BellRing,
  Boxes,
  ShieldCheck,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';

export function LoginPage({ onSuccess, logoUrl }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@apotek.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State interaktif untuk simulasi pratinjau langsung di halaman masuk
  const [previewTab, setPreviewTab] = useState('retur');
  const [simulatedReturIds, setSimulatedReturIds] = useState(['amx']);
  const [aiExtracted, setAiExtracted] = useState(true);
  const [demoShelfQty, setDemoShelfQty] = useState(22);

  const demoBatches = [
    { id: 'amx', nama: 'Amoxicillin 500mg', batch: 'AMX-2604-B', pbf: 'Bina Pharma', nilai: 924000, sisa: '5 hari' },
    { id: 'omz', nama: 'Omeprazole 20mg', batch: 'OMZ-2606-K', pbf: 'Merapi Utama', nilai: 594000, sisa: 'Siap BAP' }
  ];

  const totalTerselamatkan = demoBatches
    .filter((b) => simulatedReturIds.includes(b.id))
    .reduce((acc, cur) => acc + cur.nilai, 0);

  const toggleSimulatedRetur = (id) => {
    setSimulatedReturIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('admin@apotek.local');
      setPassword('admin123');
    } else {
      setEmail('karyawan@apotek.local');
      setPassword('karyawan123');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa email dan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-[#F4F6FF] via-[#EBEEFD] to-[#DDE6FC] text-slate-900 flex flex-col justify-between font-sans">
      {/* Latar UI Pemandangan Apotek Interaktif: pohon, bangunan apotek, antrean ceria, dan pejalan kaki */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 overflow-hidden"
      >
        {/* Adegan Desktop / Tablet Lebar */}
        <svg
          viewBox="0 0 1440 310"
          preserveAspectRatio="xMidYMax slice"
          className="hidden sm:block w-full h-[245px] lg:h-[265px]"
        >
          {/* Awan halus atmosfer */}
          <g className="animate-cloud-float">
            <g fill="#FFFFFF" opacity="0.82">
              <ellipse cx="210" cy="48" rx="44" ry="13" />
              <circle cx="195" cy="43" r="12" />
              <circle cx="218" cy="40" r="15" />
            </g>
            <g fill="#FFFFFF" opacity="0.78">
              <ellipse cx="760" cy="36" rx="52" ry="14" />
              <circle cx="742" cy="32" r="13" />
              <circle cx="768" cy="28" r="16" />
            </g>
            <g fill="#FFFFFF" opacity="0.72">
              <ellipse cx="1220" cy="52" rx="42" ry="12" />
              <circle cx="1208" cy="48" r="11" />
              <circle cx="1228" cy="46" r="13" />
            </g>
          </g>

          {/* Perbukitan lembut horizon & jalan trotoar depan apotek */}
          <path d="M0,210 Q260,165 540,198 T1080,188 T1440,204 L1440,310 L0,310 Z" fill="#C9D8FD" opacity="0.82" />
          <path d="M0,242 Q380,206 760,236 T1440,224 L1440,310 L0,310 Z" fill="#B9CCFB" opacity="0.7" />
          <rect x="0" y="248" width="1440" height="62" fill="#F8FAFC" />
          <rect x="0" y="248" width="1440" height="4" fill="#CBD5E1" />
          <line x1="20" y1="278" x2="1420" y2="278" stroke="#E2E8F0" strokeWidth="3" strokeDasharray="18 16" strokeLinecap="round" />

          {/* Pohon-pohon rindang kiri latar */}
          <g transform="translate(36, 152)">
            <rect x="28" y="54" width="10" height="44" rx="4" fill="#92400E" />
            <circle cx="33" cy="38" r="24" fill="#10B981" />
            <circle cx="18" cy="47" r="16" fill="#059669" />
            <circle cx="46" cy="45" r="15" fill="#34D399" />
            <circle cx="25" cy="31" r="3" fill="#FEF08A" />
            <circle cx="42" cy="40" r="2.5" fill="#FDE047" />
          </g>

          <g transform="translate(96, 182)">
            <g className="animate-apotek-bob">
              <rect x="16" y="34" width="7" height="34" rx="3" fill="#78350F" />
              <circle cx="20" cy="22" r="16" fill="#14B8A6" />
              <circle cx="11" cy="26" r="10" fill="#0D9488" />
              <circle cx="29" cy="27" r="9.5" fill="#5EEAD4" />
            </g>
          </g>

          {/* Bangunan Utama Apotek Asahan Farma pada sisi kiri-tengah jalan */}
          <g transform="translate(148, 134)">
            <ellipse cx="96" cy="116" rx="88" ry="6" fill="#94A3B8" opacity="0.25" />
            <rect x="14" y="28" width="166" height="86" rx="10" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2.5" />

            <rect x="38" y="2" width="118" height="26" rx="8" fill="#2563EB" />
            <circle cx="54" cy="15" r="7" fill="#FFFFFF" />
            <path d="M54 11V19M50 15H58" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
            <text x="66" y="19" fill="#FFFFFF" fontSize="10.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
              APOTEK
            </text>

            <path d="M8 34 C8 28 12 26 18 26 H178 C184 26 188 28 188 34 L194 48 H2 Z" fill="#3B82F6" />
            <rect x="24" y="26" width="20" height="22" fill="#FFFFFF" opacity="0.92" />
            <rect x="66" y="26" width="20" height="22" fill="#FFFFFF" opacity="0.92" />
            <rect x="108" y="26" width="20" height="22" fill="#FFFFFF" opacity="0.92" />
            <rect x="150" y="26" width="20" height="22" fill="#FFFFFF" opacity="0.92" />
            <circle cx="13" cy="48" r="10.5" fill="#3B82F6" />
            <circle cx="34" cy="48" r="10.5" fill="#FFFFFF" />
            <circle cx="55" cy="48" r="10.5" fill="#3B82F6" />
            <circle cx="76" cy="48" r="10.5" fill="#FFFFFF" />
            <circle cx="97" cy="48" r="10.5" fill="#3B82F6" />
            <circle cx="118" cy="48" r="10.5" fill="#FFFFFF" />
            <circle cx="139" cy="48" r="10.5" fill="#3B82F6" />
            <circle cx="160" cy="48" r="10.5" fill="#FFFFFF" />
            <circle cx="182" cy="48" r="10.5" fill="#3B82F6" />

            <rect x="24" y="64" width="36" height="50" rx="6" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="2" />
            <line x1="54" y1="86" x2="54" y2="95" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />

            <rect x="74" y="62" width="92" height="40" rx="8" fill="#EFF6FF" stroke="#60A5FA" strokeWidth="2" />
            <circle cx="120" cy="77" r="9" fill="#FDBA74" />
            <path d="M111 75 C111 68 129 68 129 75 Z" fill="#1E293B" />
            <circle cx="117" cy="77" r="1.2" fill="#1E293B" />
            <circle cx="123" cy="77" r="1.2" fill="#1E293B" />
            <path d="M117.5 80.5 Q120 83 122.5 80.5" stroke="#9A3412" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M108 102 C108 91 132 91 132 102 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <rect x="70" y="98" width="100" height="8" rx="3" fill="#2563EB" />
            <rect x="166" y="100" width="11" height="12" rx="3" fill="#F97316" />
            <circle cx="171.5" cy="96" r="5.5" fill="#10B981" />
          </g>

          {/* Antrean 3 Pengunjung Lucu di Depan Apotek */}
          <g transform="translate(342, 198)">
            <g className="animate-apotek-bob">
              <g transform="translate(-4, -22)">
                <rect x="0" y="0" width="56" height="16" rx="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.2" />
                <text x="28" y="11" textAnchor="middle" fill="#1D4ED8" fontSize="7.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
                  Vitamin ya!
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

          <g transform="translate(384, 202)">
            <circle cx="14" cy="12" r="8" fill="#FED7AA" />
            <path d="M7 9 C8 3 21 3 21 9 Z" fill="#4338CA" />
            <circle cx="11.5" cy="12" r="1" fill="#1E293B" />
            <circle cx="16.5" cy="12" r="1" fill="#1E293B" />
            <rect x="6" y="21" width="16" height="20" rx="7" fill="#FBBF24" />
            <rect x="1" y="25" width="7" height="9" rx="1.5" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="8" y="40" width="4" height="11" rx="2" fill="#1E293B" />
            <rect x="16" y="40" width="4" height="11" rx="2" fill="#1E293B" />
          </g>

          <g transform="translate(424, 200)">
            <circle cx="14" cy="12" r="8" fill="#FDBA74" />
            <path d="M5 11 C5 2 23 2 23 11 Z" fill="#7C2D12" />
            <circle cx="11.5" cy="12" r="1" fill="#1E293B" />
            <circle cx="16.5" cy="12" r="1" fill="#1E293B" />
            <rect x="6" y="21" width="16" height="22" rx="7" fill="#14B8A6" />
            <rect x="8" y="42" width="4" height="11" rx="2" fill="#334155" />
            <rect x="16" y="42" width="4" height="11" rx="2" fill="#334155" />
          </g>

          {/* Orang Asal Jalan Santai bawa kantong belanja + Kucing imut */}
          <g transform="translate(520, 202)">
            <g className="animate-apotek-stroll">
              <circle cx="16" cy="10" r="8" fill="#FDBA74" />
              <path d="M8 8 C8 2 24 2 24 8 Z" fill="#2563EB" />
              <rect x="16" y="6" width="12" height="3" rx="1.5" fill="#1D4ED8" />
              <circle cx="19" cy="10" r="1" fill="#1E293B" />
              <rect x="8" y="19" width="16" height="20" rx="7" fill="#6366F1" />
              <path d="M12 38 L8 50" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              <path d="M20 38 L25 49" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              <rect x="-2" y="24" width="11" height="13" rx="2.5" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.2" />
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

          {/* Pohon & semak penyeimbang di sisi kanan */}
          <g transform="translate(740, 178)">
            <rect x="18" y="38" width="8" height="34" rx="3" fill="#92400E" />
            <circle cx="22" cy="28" r="18" fill="#10B981" />
            <circle cx="11" cy="34" r="12" fill="#059669" />
            <circle cx="33" cy="34" r="11" fill="#34D399" />
          </g>

          <g transform="translate(1280, 150)">
            <rect x="26" y="54" width="11" height="44" rx="4" fill="#92400E" />
            <circle cx="31" cy="38" r="25" fill="#14B8A6" />
            <circle cx="16" cy="47" r="16" fill="#0D9488" />
            <circle cx="45" cy="46" r="16" fill="#5EEAD4" />
            <circle cx="34" cy="30" r="3" fill="#FEF08A" />
          </g>

          {/* Pejalan kaki santai di sudut kanan latar */}
          <g transform="translate(1180, 204)">
            <g className="animate-apotek-bob">
              <circle cx="14" cy="11" r="7.5" fill="#FED7AA" />
              <path d="M6 10 C6 3 22 3 22 10 Z" fill="#1E293B" />
              <rect x="6" y="19" width="16" height="21" rx="7" fill="#38BDF8" />
              <rect x="9" y="39" width="4" height="11" rx="2" fill="#334155" />
              <rect x="16" y="39" width="4" height="11" rx="2" fill="#334155" />
            </g>
          </g>
        </svg>

        {/* Adegan Khusus Layar Mobile agar semua elemen lucu tampil utuh tanpa terpotong */}
        <svg
          viewBox="0 0 430 185"
          preserveAspectRatio="xMidYMax slice"
          className="sm:hidden w-full h-[180px] block"
        >
          <path d="M0,115 Q120,86 230,108 T430,102 L430,185 L0,185 Z" fill="#C9D8FD" opacity="0.85" />
          <rect x="0" y="138" width="430" height="47" fill="#F8FAFC" />
          <rect x="0" y="138" width="430" height="3" fill="#CBD5E1" />
          <line x1="12" y1="162" x2="418" y2="162" stroke="#E2E8F0" strokeWidth="2.5" strokeDasharray="12 12" strokeLinecap="round" />

          {/* Pohon kiri mobile */}
          <g transform="translate(8, 60)">
            <rect x="18" y="42" width="8" height="36" rx="3" fill="#92400E" />
            <circle cx="22" cy="30" r="18" fill="#10B981" />
            <circle cx="11" cy="37" r="12" fill="#059669" />
            <circle cx="32" cy="36" r="11" fill="#34D399" />
          </g>

          {/* Toko Apotek Mobile */}
          <g transform="translate(52, 48)">
            <rect x="10" y="22" width="136" height="68" rx="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
            <rect x="30" y="2" width="96" height="20" rx="6" fill="#2563EB" />
            <text x="78" y="15.5" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
              + APOTEK
            </text>
            <path d="M4 26 H152 L156 38 H0 Z" fill="#3B82F6" />
            <rect x="20" y="26" width="18" height="12" fill="#FFFFFF" opacity="0.9" />
            <rect x="58" y="26" width="18" height="12" fill="#FFFFFF" opacity="0.9" />
            <rect x="96" y="26" width="18" height="12" fill="#FFFFFF" opacity="0.9" />
            <rect x="130" y="26" width="16" height="12" fill="#FFFFFF" opacity="0.9" />

            <rect x="20" y="50" width="30" height="40" rx="5" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="1.5" />
            <rect x="62" y="48" width="74" height="32" rx="6" fill="#EFF6FF" stroke="#60A5FA" strokeWidth="1.5" />
            <circle cx="99" cy="60" r="7" fill="#FDBA74" />
            <path d="M90 78 C90 70 108 70 108 78 Z" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="58" y="76" width="82" height="6" rx="2.5" fill="#2563EB" />
          </g>

          {/* Antrean pengunjung mobile */}
          <g transform="translate(210, 96)">
            <g className="animate-apotek-bob">
              <circle cx="11" cy="10" r="6.5" fill="#FDBA74" />
              <rect x="5" y="17" width="12" height="17" rx="5" fill="#FB7185" />
              <rect x="6" y="34" width="3.5" height="9" rx="1.5" fill="#334155" />
              <rect x="12" y="34" width="3.5" height="9" rx="1.5" fill="#334155" />
            </g>
          </g>
          <g transform="translate(236, 98)">
            <circle cx="11" cy="10" r="6.5" fill="#FED7AA" />
            <rect x="5" y="17" width="12" height="16" rx="5" fill="#FBBF24" />
            <rect x="6" y="33" width="3.5" height="9" rx="1.5" fill="#1E293B" />
            <rect x="12" y="33" width="3.5" height="9" rx="1.5" fill="#1E293B" />
          </g>

          {/* Pejalan kaki & kucing mobile */}
          <g transform="translate(302, 96)">
            <g className="animate-apotek-stroll">
              <circle cx="12" cy="9" r="6.5" fill="#FDBA74" />
              <rect x="6" y="16" width="12" height="17" rx="5" fill="#6366F1" />
              <path d="M9 32 L6 42" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M15 32 L19 42" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="-1" y="20" width="9" height="10" rx="2" fill="#FDE047" />
              <g transform="translate(24, 28)">
                <ellipse cx="8" cy="9" rx="6.5" ry="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
                <circle cx="14" cy="6" r="3.8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
              </g>
            </g>
          </g>

          {/* Pohon kanan mobile */}
          <g transform="translate(384, 62)">
            <rect x="16" y="40" width="8" height="36" rx="3" fill="#92400E" />
            <circle cx="20" cy="28" r="18" fill="#14B8A6" />
            <circle cx="10" cy="35" r="12" fill="#0D9488" />
            <circle cx="30" cy="34" r="12" fill="#5EEAD4" />
          </g>
        </svg>
      </div>

      {/* Bar Navigasi Atas */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3.5 sm:pt-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 shrink-0">
          <BrandLogo logoUrl={logoUrl} className="w-9 h-9 shadow-sm" />
          <div>
            <span className="text-base font-black text-slate-950 tracking-tight block leading-none">
              SIMAAF
            </span>
            <span className="text-[11px] font-bold text-blue-600 block mt-0.5 leading-none">
              Apotek Asahan Farma
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-white text-[11px] sm:text-xs font-bold text-slate-700 shadow-2xs whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden sm:inline">Standar CDOB •</span>
          <span>Kisaran Timur</span>
        </span>
      </header>

      {/* Konten Utama Split-Screen Mengapung di Atas Latar Apotek */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-28 sm:pb-36 lg:pb-32 flex items-start lg:items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Kolom Kiri Desktop: Judul & Simulasi Interaktif Mengambang di Atas Pemandangan */}
          <section className="hidden lg:flex lg:col-span-7 flex-col gap-4 pt-2">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-blue-200/70 text-blue-700 text-[11px] font-bold shadow-2xs w-fit">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Pantau Retur PBF & Stok FEFO Otomatis</span>
              </div>
              <h1 className="text-4xl font-black text-slate-950 tracking-tight leading-[1.12]">
                Kendali Cerdas Stok Obat & Retur Distributor.
              </h1>
              <p className="text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
                Coba langsung simulasi interaktif di bawah ini—mulai dari pengajuan retur PBF, pembacaan faktur AI, hingga stok opname cepat.
              </p>
            </div>

            {/* Pemilih Tab Simulasi Interaktif */}
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-xs border border-white shadow-xs">
                {[
                  { id: 'retur', label: '1. Simulasi Retur PBF', icon: BellRing },
                  { id: 'ai', label: '2. Baca Faktur AI', icon: Sparkles },
                  { id: 'opname', label: '3. Cek Rak FEFO', icon: Boxes }
                ].map((t) => {
                  const Icon = t.icon;
                  const active = previewTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreviewTab(t.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-white/70'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white/92 backdrop-blur-md rounded-2xl border border-white shadow-[0_18px_46px_rgba(30,41,59,0.09)] p-4">
                {previewTab === 'retur' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500">Simulasi Pengajuan Retur Batch</span>
                        <p className="text-base font-black text-slate-950 tabular-nums">
                          {formatRupiah(totalTerselamatkan)}{' '}
                          <span className="text-xs font-bold text-blue-600">terselamatkan</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSimulatedReturIds(['amx'])}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {demoBatches.map((item) => {
                        const checked = simulatedReturIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleSimulatedRetur(item.id)}
                            className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              checked
                                ? 'bg-blue-50/90 border-blue-300 shadow-2xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 truncate">{item.nama}</p>
                              <p className="text-[11px] text-slate-500 truncate">{item.pbf} • {item.sisa}</p>
                              <p className="text-xs font-black text-blue-700 mt-0.5 tabular-nums">
                                {formatRupiah(item.nilai)}
                              </p>
                            </div>
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                checked ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {checked ? '✓' : '+'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {previewTab === 'ai' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500">Pembacaan Dokumen Faktur AI</span>
                        <p className="text-sm font-extrabold text-slate-950">
                          {aiExtracted ? '3 Baris Obat Diekstrak Otomatis' : 'Teks Mentah Faktur Siap Dipindai'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiExtracted(!aiExtracted)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        {aiExtracted ? 'Lihat Sumber Asli' : 'Ekstrak dengan AI'}
                      </button>
                    </div>

                    {aiExtracted ? (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {[
                          { obat: 'Cefixime 100mg', batch: 'CFX-2601', ed: '2027-02-15' },
                          { obat: 'Amoxicillin 500mg', batch: 'AMX-2604', ed: '2026-12-05' },
                          { obat: 'Paracetamol Syr', batch: 'PCT-2605', ed: '2027-05-18' }
                        ].map((r, i) => (
                          <div key={i} className="p-2 rounded-xl bg-blue-50/75 border border-blue-200/80">
                            <p className="font-bold text-slate-900 truncate">{r.obat}</p>
                            <p className="font-mono text-[10px] text-blue-700 mt-0.5">{r.batch}</p>
                            <p className="text-[10px] text-slate-500">ED: {r.ed}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-900/5 border border-slate-200 font-mono text-[11px] text-slate-700">
                        FAKTUR #PBF-8841 | Cefixime 100mg (Batch CFX-2601, ED 15/02/27, 20 Box) • Amoxicillin 500mg...
                      </div>
                    )}
                  </div>
                )}

                {previewTab === 'opname' && (
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500">Simulasi Penyesuaian Rak (Amoxicillin)</span>
                      <p className="text-sm font-extrabold text-slate-950">
                        Stok Sistem: 22 Unit • Selisih:{' '}
                        <span className={demoShelfQty - 22 < 0 ? 'text-rose-600' : 'text-blue-600'}>
                          {demoShelfQty - 22 > 0 ? `+${demoShelfQty - 22}` : demoShelfQty - 22} Unit
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Uji perubahan hitung fisik rak secara langsung sebelum pencatatan audit.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDemoShelfQty((q) => Math.max(0, q - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center font-bold"
                        aria-label="Kurangi stok demo"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-black text-slate-950 tabular-nums">
                        {demoShelfQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDemoShelfQty((q) => q + 1)}
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold"
                        aria-label="Tambah stok demo"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Kolom Kanan: Kartu Masuk Interaktif Mengambang */}
          <section className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white/92 backdrop-blur-md rounded-3xl border border-white p-5 sm:p-6 shadow-[0_24px_60px_rgba(30,41,59,0.1)] space-y-4">
              <div className="space-y-0.5">
                <h2 className="text-lg font-black text-slate-950 tracking-tight">
                  Masuk ke Ruang Kerja
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Pilih peran operasional atau masukkan kredensial apotek Anda.
                </p>
              </div>

              {/* Pengalih Peran Interaktif */}
              <div className="p-1 rounded-2xl bg-slate-100 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectRole('admin')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Ibu Anni</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold">
                    Pemilik
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('karyawan')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedRole === 'karyawan'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Karyawan</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-extrabold">
                    Staf
                  </span>
                </button>
              </div>

              {/* Sorotan Hak Akses Peran Terpilih */}
              <div className="px-3 py-2 rounded-2xl bg-blue-50/75 border border-blue-200/70 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-blue-900">
                {selectedRole === 'admin' ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Audit Aset & Keuangan
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Pengaturan Master PBF
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Input Faktur & AI
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Stok Opname & Retur
                    </span>
                  </>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Pengguna
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@apotek.local"
                      className="w-full h-11 pl-10 pr-3.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-11 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 absolute right-1 top-1/2 -translate-y-1/2 rounded-lg transition"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Memverifikasi Akun...' : 'Masuk ke Ruang Kerja'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Catatan Kaki Ringkas */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-3 text-center sm:text-left">
        <span className="inline-block px-3 py-1 rounded-full bg-white/85 backdrop-blur-xs text-[11px] font-semibold text-slate-600 shadow-2xs">
          Jl. Imam Bonjol No. 331, Kisaran Timur • Apotek Asahan Farma
        </span>
      </footer>
    </div>
  );
}
