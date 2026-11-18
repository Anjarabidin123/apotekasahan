import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/common/BrandLogo';
import { PharmacySceneArtwork } from '../components/login/PharmacySceneArtwork';
import { formatRupiah } from '../utils/formatters';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
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

  // State interaktif untuk simulasi pratinjau langsung di layar desktop
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

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-[#F4F6FF] via-[#EBEEFD] to-[#DDE6FC] text-slate-900 flex flex-col justify-between font-sans">
      {/* Bar Navigasi Atas */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3.5 sm:pt-5 flex items-center justify-between gap-2 shrink-0">
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

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] sm:text-xs font-bold text-slate-700 shadow-2xs whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden sm:inline">Standar CDOB •</span>
          <span>Kisaran Timur</span>
        </span>
      </header>

      {/* Konten utama: kartu masuk dan simulasi interaktif */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-10 sm:py-6 lg:pt-6 lg:pb-32 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Kolom Kiri Desktop: Judul & Simulasi Interaktif */}
          <section className="hidden lg:flex lg:col-span-7 flex-col gap-4 pt-2">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200/70 text-blue-700 text-[11px] font-bold shadow-2xs w-fit">
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

            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/95 border border-slate-200/70 shadow-xs">
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
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_18px_46px_rgba(30,41,59,0.08)] p-4">
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

          {/* Kolom Kanan: Kartu Masuk Bersih & Profesional */}
          <section className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200/85 p-5 sm:p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-950 tracking-tight">
                  Masuk ke SIMAAF
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Pilih akun atau masukkan kredensial apotek Anda.
                </p>
              </div>

              {/* Pengalih Peran Ringkas */}
              <div className="p-1 rounded-2xl bg-slate-100 grid grid-cols-2 gap-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleSelectRole('admin')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[42px] flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[42px] flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  className="w-full h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Memverifikasi Akun...' : 'Masuk ke Ruang Kerja'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <PharmacySceneArtwork />

      <footer className="relative z-10 w-full bg-[#F8FAFC] lg:bg-transparent py-2 px-4 sm:px-6 text-center lg:text-left border-t border-slate-200/50 lg:border-t-0 shrink-0">
        <div className="max-w-6xl mx-auto text-[11px] font-medium text-slate-500">
          Jl. Imam Bonjol No. 331, Kisaran Timur • Apotek Asahan Farma
        </div>
      </footer>
    </div>
  );
}
