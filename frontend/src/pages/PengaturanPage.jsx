import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/common/BrandLogo';
import {
  Building2,
  FileText,
  Wallet,
  Settings,
  Save,
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  Users,
  Plus,
  ArrowLeft,
  Phone,
  MapPin,
  Mail,
  Shield,
  Sliders,
  Check,
  RotateCcw,
  ExternalLink,
  Printer,
  Calendar
} from 'lucide-react';

export function PengaturanPage({ onSettingsUpdated, currentLogoUrl, onLogoChange }) {
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('identitas'); // 'identitas' | 'dokumen' | 'kategori' | 'rekanan'
  const [loading, setLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Profil Apotek State
  const [profile, setProfile] = useState({
    nama_apotek: 'Apotek Asahan Farma',
    pimpinan: 'Ibu Anni (Komisaris)',
    apoteker_pj: 'apt. Nurul Hasanah, S.Farm',
    sipa: '19930412/SIPA_1208/2022/2041',
    sia: '503/SIA/042/DPMPTSP/2021',
    nib: '1210210063257',
    alamat: 'Jl. Imam Bonjol No. 331, Kel. Kisaran Timur, Kab. Asahan, Sumatera Utara 21214',
    telepon: '(0623) 41289',
    whatsapp: '0812-6543-9870',
    email: 'apotek.asahanfarma@gmail.com',
    jam_operasional: 'Senin - Minggu: 08.00 - 22.00 WIB',
    catatan_kaki_surat: 'Obat yang diretur wajib bersegel utuh dan diverifikasi nomor batch resminya.',
    format_no_retur: 'BAP-RETUR/{YYYY}/{MM}/{INDEX}',
    logo_url: currentLogoUrl || '/logo-asahan.svg',
  });

  // Master Distributor (PBF Rekanan)
  const [distributors, setDistributors] = useState([]);
  const [showAddPbfModal, setShowAddPbfModal] = useState(false);
  const [newPbf, setNewPbf] = useState({
    kode: '',
    nama: '',
    aturan_retur_bulan: 3,
    telepon: '',
    kontak: '',
  });

  // Master Kategori Obat & Ambang Batas
  const [kategoriList, setKategoriList] = useState([
    { id: 1, nama: 'Antibiotik (Keras)', stok_minimum: 15, masa_pantau_hari: 30, jenis: 'Keras' },
    { id: 2, nama: 'Analgesik & Antipiretik', stok_minimum: 20, masa_pantau_hari: 30, jenis: 'Bebas' },
    { id: 3, nama: 'Antasida & Obat Lambung', stok_minimum: 15, masa_pantau_hari: 45, jenis: 'Bebas Terbatas' },
    { id: 4, nama: 'Antihipertensi & Jantung', stok_minimum: 20, masa_pantau_hari: 30, jenis: 'Keras' },
    { id: 5, nama: 'Antidiabetes Oral', stok_minimum: 30, masa_pantau_hari: 30, jenis: 'Keras' },
    { id: 6, nama: 'Sirup & Tetes Anak', stok_minimum: 15, masa_pantau_hari: 45, jenis: 'Bebas Terbatas' },
    { id: 7, nama: 'Salep & Krim Topikal', stok_minimum: 10, masa_pantau_hari: 60, jenis: 'Bebas Terbatas' },
    { id: 8, nama: 'Suplemen & Vitamin', stok_minimum: 20, masa_pantau_hari: 60, jenis: 'Bebas' },
  ]);
  const [showAddKatModal, setShowAddKatModal] = useState(false);
  const [newKat, setNewKat] = useState({ nama: '', stok_minimum: 15, masa_pantau_hari: 30, jenis: 'Bebas' });

  // Parameter Sistem
  const [settings, setSettings] = useState({
    tanggal_acuan: '2026-10-31',
    stok_minimum_default: 10,
    batas_kedaluwarsa_warning_hari: 90,
    batas_retur_warning_hari: 30,
  });

  const [savingPbfId, setSavingPbfId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [dList, sData] = await Promise.all([
        api.getDistributors(),
        api.getSettings(),
      ]);
      setDistributors(dList);
      setSettings(sData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran logo maksimal 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newUrl = reader.result;
      setProfile((prev) => ({ ...prev, logo_url: newUrl }));
      if (onLogoChange) onLogoChange(newUrl);
      setSuccessMsg('Logo resmi Apotek Asahan Farma berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetLogo = (presetUrl, presetName) => {
    setProfile((prev) => ({ ...prev, logo_url: presetUrl }));
    if (onLogoChange) onLogoChange(presetUrl);
    setSuccessMsg(`Logo diubah ke preset: ${presetName}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleRemoveLogo = () => {
    const defaultUrl = '/logo-asahan.svg';
    setProfile((prev) => ({ ...prev, logo_url: defaultUrl }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onLogoChange) onLogoChange(defaultUrl);
    setSuccessMsg('Logo dikembalikan ke default resmi.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.updateSettings(settings);
      setSuccessMsg('Seluruh konfigurasi profil apotek, matriks PBF, dan dokumen berhasil disimpan!');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleUpdateDistributorRule = async (pbfId, newBulan) => {
    setSavingPbfId(pbfId);
    try {
      await api.updateAturanDistributor(pbfId, newBulan);
      setSuccessMsg('Aturan retur PBF berhasil diperbarui! Batas retur batch terkait telah dihitung ulang.');
      await loadAllData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui aturan PBF.');
    } finally {
      setSavingPbfId(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleAddPbf = (e) => {
    e.preventDefault();
    if (!newPbf.nama.trim()) {
      setErrorMsg('Nama PBF wajib diisi');
      return;
    }
    const item = {
      id: Date.now(),
      kode: newPbf.kode.trim() || `DST-${String(distributors.length + 1).padStart(3, '0')}`,
      nama: newPbf.nama.trim(),
      aturan_retur_bulan: Number(newPbf.aturan_retur_bulan) || 3,
      telepon: newPbf.telepon.trim() || '-',
      kontak: newPbf.kontak.trim() || 'Bagian Retur',
    };
    setDistributors([...distributors, item]);
    setShowAddPbfModal(false);
    setNewPbf({ kode: '', nama: '', aturan_retur_bulan: 3, telepon: '', kontak: '' });
    setSuccessMsg(`PBF "${item.nama}" berhasil ditambahkan ke database rekanan!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeletePbf = (id, nama) => {
    if (!window.confirm(`Hapus PBF "${nama}" dari daftar rekanan?`)) return;
    setDistributors(distributors.filter((d) => d.id !== id));
    setSuccessMsg(`PBF "${nama}" dihapus.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAddKategori = (e) => {
    e.preventDefault();
    if (!newKat.nama.trim()) {
      setErrorMsg('Nama kategori obat wajib diisi');
      return;
    }
    const item = {
      id: Date.now(),
      nama: newKat.nama.trim(),
      stok_minimum: Number(newKat.stok_minimum) || 15,
      masa_pantau_hari: Number(newKat.masa_pantau_hari) || 30,
      jenis: newKat.jenis,
    };
    setKategoriList([...kategoriList, item]);
    setShowAddKatModal(false);
    setNewKat({ nama: '', stok_minimum: 15, masa_pantau_hari: 30, jenis: 'Bebas' });
    setSuccessMsg(`Kategori "${item.nama}" berhasil ditambahkan!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteKategori = (id, nama) => {
    if (!window.confirm(`Hapus kategori "${nama}"?`)) return;
    setKategoriList(kategoriList.filter((k) => k.id !== id));
    setSuccessMsg(`Kategori "${nama}" dihapus.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-3">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Pengaturan Sarana & Profil Apotek</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola identitas resmi apotek, format dokumen PDF, klausul retur PBF, dan kategori stok.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="btn-outline h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-indigo-700 bg-indigo-50/60 border-indigo-200 hover:bg-indigo-100 font-bold gap-1.5 flex-1 sm:flex-initial"
          >
            <LifeBuoy className="w-4 h-4 text-indigo-600" />
            <span>Bantuan & SOP</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={loading}
            className="btn-primary h-11 sm:h-9 min-h-[44px] sm:min-h-0 px-4 font-black flex-1 sm:flex-initial justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'identitas', label: 'Identitas & Legalitas', icon: Building2 },
          { id: 'dokumen', label: 'Format Dokumen & PDF', icon: FileText },
          { id: 'kategori', label: `Kategori & Ambang Stok (${kategoriList.length})`, icon: Wallet },
          { id: 'rekanan', label: `Master PBF (${distributors.length} Rekanan)`, icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 font-extrabold'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      
      {activeTab === 'identitas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Identitas Resmi & Logo Apotek</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nama resmi, stempel, dan legalitas yang dicetak pada surat berita acara retur dan laporan.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 block">
                Logo Resmi Apotek
              </label>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="relative w-20 h-20 rounded-2xl border-2 border-blue-500/30 overflow-hidden bg-white shadow-xs flex items-center justify-center p-1.5 shrink-0">
                  <BrandLogo
                    logoUrl={profile.logo_url}
                    className="w-full h-full"
                    alt="Logo Apotek Asahan Farma"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">
                      {profile.logo_url === '/logo-asahan.svg'
                        ? 'Preset: Royal Sapphire Shield (Default)'
                        : profile.logo_url === '/logo-emerald.svg'
                        ? 'Preset: Emerald Botanical Cross'
                        : profile.logo_url === '/logo-modern-af.svg'
                        ? 'Preset: Modern Monogram AF'
                        : 'Logo Kustom (Tersimpan)'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold">
                      Aktif di Sistem
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Logo ini langsung ditampilkan pada sidebar navigasi, formulir login, dan KOP resmi Berita Acara Retur (BAP).
                  </p>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-outline h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 text-xs font-bold gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Gambar Sendiri</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="btn-outline h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-2.5 text-xs text-slate-600 hover:bg-slate-100"
                      title="Kembalikan ke Default"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pilihan Preset Logo Desain Farmasi */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-2">
                  Atau pilih Desain Preset Logo Farmasi:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetLogo('/logo-asahan.svg', 'Royal Sapphire Shield')}
                    className={`p-3 min-h-[48px] rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      profile.logo_url === '/logo-asahan.svg'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <BrandLogo logoUrl="/logo-asahan.svg" className="w-9 h-9" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Royal Sapphire</span>
                      <span className="text-[10px] text-slate-500">Shield & Daun Vitalitas</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetLogo('/logo-emerald.svg', 'Emerald Botanical Cross')}
                    className={`p-3 min-h-[48px] rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      profile.logo_url === '/logo-emerald.svg'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <BrandLogo logoUrl="/logo-emerald.svg" className="w-9 h-9" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Emerald Botanical</span>
                      <span className="text-[10px] text-slate-500">Cross Farmasi Alami</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetLogo('/logo-modern-af.svg', 'Modern Monogram AF')}
                    className={`p-3 min-h-[48px] rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      profile.logo_url === '/logo-modern-af.svg'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <BrandLogo logoUrl="/logo-modern-af.svg" className="w-9 h-9" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Monogram AF</span>
                      <span className="text-[10px] text-slate-500">Minimalis Preskripsi Rx</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields Identitas */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Sarana Apotek
                </label>
                <input
                  type="text"
                  value={profile.nama_apotek}
                  onChange={(e) => setProfile({ ...profile, nama_apotek: e.target.value })}
                  className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Komisaris / Pemilik
                  </label>
                  <input
                    type="text"
                    value={profile.pimpinan}
                    onChange={(e) => setProfile({ ...profile, pimpinan: e.target.value })}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apoteker PJ (APJ)
                  </label>
                  <input
                    type="text"
                    value={profile.apoteker_pj}
                    onChange={(e) => setProfile({ ...profile, apoteker_pj: e.target.value })}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Apotek
                </label>
                <input
                  type="text"
                  value={profile.alamat}
                  onChange={(e) => setProfile({ ...profile, alamat: e.target.value })}
                  className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={profile.whatsapp}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Operasional
                  </label>
                  <input
                    type="text"
                    value={profile.jam_operasional}
                    onChange={(e) => setProfile({ ...profile, jam_operasional: e.target.value })}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Kanan: Nomor Legalitas Izin & Kepatuhan BPOM */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Legalitas & Perizinan BPOM</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nomor perizinan berusaha yang terintegrasi pada sistem OSS dan Dinas Kesehatan.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Induk Berusaha (NIB)
                  </label>
                  <input
                    type="text"
                    value={profile.nib}
                    onChange={(e) => setProfile({ ...profile, nib: e.target.value })}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Surat Izin Apotek (SIA)
                  </label>
                  <input
                    type="text"
                    value={profile.sia}
                    onChange={(e) => setProfile({ ...profile, sia: e.target.value })}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Surat Izin Praktik Apoteker (SIPA)
                  </label>
                  <input
                    type="text"
                    value={profile.sipa}
                    onChange={(e) => setProfile({ ...profile, sipa: e.target.value })}
                    className="w-full text-xs h-11 sm:h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Status Kepatuhan Terverifikasi</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Sarana apotek beroperasi aktif dengan izin resmi di wilayah Kabupaten Asahan, Sumatera Utara.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Tanggal Acuan Sistem</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Tanggal Acuan
                </span>
              </div>
              <input
                type="date"
                value={settings.tanggal_acuan}
                onChange={(e) => setSettings({ ...settings, tanggal_acuan: e.target.value })}
                className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-blue-700"
              />
              <p className="text-[11px] text-slate-400">
                Tanggal referensi untuk simulasi seluruh kalkulasi sisa hari kedaluwarsa & retur obat.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Halaman Awal Default</span>
                </span>
              </div>
              <select
                value={localStorage.getItem('simaaf_default_page') || 'dashboard'}
                onChange={(e) => {
                  localStorage.setItem('simaaf_default_page', e.target.value);
                  setSuccessMsg('Halaman awal default berhasil diubah!');
                  setTimeout(() => setSuccessMsg(''), 4000);
                }}
                className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
              >
                <option value="dashboard">Dashboard</option>
                <option value="faktur">Input Faktur</option>
                <option value="inventori">Inventori</option>
                <option value="pengingat">Pengingat Retur</option>
                <option value="penyesuaian">Penyesuaian Stok</option>
                <option value="kalender">Kalender Tenggat</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Halaman yang muncul pertama kali setelah login.
              </p>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'dokumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Format Dokumen Berita Acara Retur</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur format penomoran surat retur resmi dan klausul penyerahan fisik ke distributor.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Format Penomoran Surat Otomatis
                </label>
                <input
                  type="text"
                  value={profile.format_no_retur}
                  onChange={(e) => setProfile({ ...profile, format_no_retur: e.target.value })}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Variabel didukung: {'{YYYY}'}, {'{MM}'}, {'{INDEX}'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kaki Resmi pada Lembar Retur
                </label>
                <textarea
                  rows={3}
                  value={profile.catatan_kaki_surat}
                  onChange={(e) => setProfile({ ...profile, catatan_kaki_surat: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Pratinjau Lembar Kop Surat Resmi */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Pratinjau KOP Resmi Cetak PDF</span>
              </span>
              <span className="text-[10px] text-blue-600 font-bold">Standar CDOB</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white text-center space-y-1 shadow-xs">
              <BrandLogo logoUrl={profile.logo_url} className="w-12 h-12 mx-auto mb-2 shadow-xs" />
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {profile.nama_apotek}
              </h4>
              <p className="text-[11px] text-slate-600">{profile.alamat}</p>
              <p className="text-[10px] font-mono text-slate-400">
                SIA: {profile.sia} • NIB: {profile.nib} • APJ: {profile.apoteker_pj}
              </p>
              <div className="w-full h-0.5 bg-slate-900 mt-2" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-800">Dokumen Berita Acara Retur Fisik:</p>
              <p>Memuat rincian nama obat, nomor batch, tanggal faktur beli, nama driver PBF pembawa, dan tanda tangan APJ.</p>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'kategori' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>Kategori Golongan Obat & Ambang Pengaman</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur stok minimum pengaman stok dan jendela peringatan per kategori farmasi.
              </p>
            </div>

            <button
              onClick={() => setShowAddKatModal(true)}
              className="btn-primary h-8 px-3 text-xs font-bold gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Kategori</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {kategoriList.map((kat) => (
              <div
                key={kat.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        kat.jenis === 'Keras'
                          ? 'bg-rose-100 text-rose-800'
                          : kat.jenis === 'Bebas Terbatas'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {kat.jenis}
                    </span>
                    <button
                      onClick={() => handleDeleteKategori(kat.id, kat.nama)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                    {kat.nama}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Min. Stok:</span>
                    <strong className="text-slate-900">{kat.stok_minimum} unit</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pantau Retur:</span>
                    <strong className="text-slate-900">{kat.masa_pantau_hari} hari</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      
      {activeTab === 'rekanan' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Master 14 Distributor PBF Mitra Apotek</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Klausul tenggat pengembalian obat kedaluwarsa dan kontak langsung bagian retur PBF.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPbfModal(true)}
              className="btn-primary h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3.5 text-xs font-bold gap-1.5 self-start sm:self-auto flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Daftarkan PBF Baru</span>
            </button>
          </div>

          {/* Mobile / Tablet Responsive PBF Cards (block md:hidden) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {distributors.map((d) => (
              <div key={d.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {d.kode}
                      </span>
                      {savingPbfId === d.id ? (
                        <span className="text-blue-600 font-bold text-[11px] animate-pulse">
                          Menyimpan...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <Check className="w-3 h-3" />
                          <span>Aktif</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {d.nama}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePbf(d.id, d.nama)}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Hapus PBF"
                    aria-label={`Hapus ${d.nama}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Kontak PIC
                    </span>
                    <span className="font-semibold text-slate-700">
                      {d.kontak || 'Bagian Retur'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Telepon / WhatsApp
                    </span>
                    <span className="font-mono text-slate-700">
                      {d.telepon || '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                    Batas Waktu Retur Distributor
                  </label>
                  <select
                    defaultValue={d.aturan_retur_bulan}
                    onChange={(e) =>
                      handleUpdateDistributorRule(d.id, parseInt(e.target.value, 10))
                    }
                    className="w-full text-xs h-11 min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="0">0 Bulan (Tidak Terima Retur)</option>
                    <option value="1">1 Bulan Sebelum Exp</option>
                    <option value="2">2 Bulan Sebelum Exp</option>
                    <option value="3">3 Bulan Sebelum Exp</option>
                    <option value="4">4 Bulan Sebelum Exp</option>
                    <option value="5">5 Bulan Sebelum Exp</option>
                    <option value="6">6 Bulan Sebelum Exp</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3 font-extrabold">Nama Distributor (PBF)</th>
                  <th className="py-2.5 px-3">Kontak PIC</th>
                  <th className="py-2.5 px-3">Telepon / WhatsApp</th>
                  <th className="py-2.5 px-3 text-center">Batas Waktu Retur</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {distributors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                      {d.kode}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900">
                      {d.nama}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {d.kontak || 'Bagian Retur'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {d.telepon || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <select
                        defaultValue={d.aturan_retur_bulan}
                        onChange={(e) =>
                          handleUpdateDistributorRule(d.id, parseInt(e.target.value, 10))
                        }
                        className="text-xs h-8 px-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                      >
                        <option value="0">0 Bulan (Tidak Terima Retur)</option>
                        <option value="1">1 Bulan Sebelum Exp</option>
                        <option value="2">2 Bulan Sebelum Exp</option>
                        <option value="3">3 Bulan Sebelum Exp</option>
                        <option value="4">4 Bulan Sebelum Exp</option>
                        <option value="5">5 Bulan Sebelum Exp</option>
                        <option value="6">6 Bulan Sebelum Exp</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {savingPbfId === d.id ? (
                        <span className="text-blue-600 font-bold text-[11px] animate-pulse">
                          Menyimpan...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <Check className="w-3 h-3" />
                          <span>Aktif</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePbf(d.id, d.nama)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        title="Hapus PBF"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
      {showAddPbfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-black text-slate-900">Daftarkan PBF Mitra Baru</h4>
              <button
                onClick={() => setShowAddPbfModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPbf} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama PBF Distributor</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PBF Kimia Farma TD Medan"
                  value={newPbf.nama}
                  onChange={(e) => setNewPbf({ ...newPbf, nama: e.target.value })}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode PBF</label>
                  <input
                    type="text"
                    placeholder="DST-015"
                    value={newPbf.kode}
                    onChange={(e) => setNewPbf({ ...newPbf, kode: e.target.value })}
                    className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aturan Retur</label>
                  <select
                    value={newPbf.aturan_retur_bulan}
                    onChange={(e) => setNewPbf({ ...newPbf, aturan_retur_bulan: Number(e.target.value) })}
                    className="w-full text-xs h-9 px-2 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="1">1 Bulan Sebelum Exp</option>
                    <option value="2">2 Bulan Sebelum Exp</option>
                    <option value="3">3 Bulan Sebelum Exp</option>
                    <option value="6">6 Bulan Sebelum Exp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kontak Person / PIC</label>
                <input
                  type="text"
                  placeholder="Nama PIC Bagian Retur"
                  value={newPbf.kontak}
                  onChange={(e) => setNewPbf({ ...newPbf, kontak: e.target.value })}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="061-xxxxxxx / 0812xxxx"
                  value={newPbf.telepon}
                  onChange={(e) => setNewPbf({ ...newPbf, telepon: e.target.value })}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPbfModal(false)}
                  className="btn-outline h-8 px-3 text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary h-8 px-4 text-xs font-bold">
                  Simpan PBF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showAddKatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-black text-slate-900">Tambah Golongan Kategori</h4>
              <button
                onClick={() => setShowAddKatModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKategori} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kortikosteroid"
                  value={newKat.nama}
                  onChange={(e) => setNewKat({ ...newKat, nama: e.target.value })}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stok Min (Unit)</label>
                  <input
                    type="number"
                    value={newKat.stok_minimum}
                    onChange={(e) => setNewKat({ ...newKat, stok_minimum: Number(e.target.value) })}
                    className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Golongan</label>
                  <select
                    value={newKat.jenis}
                    onChange={(e) => setNewKat({ ...newKat, jenis: e.target.value })}
                    className="w-full text-xs h-9 px-2 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="Keras">Obat Keras</option>
                    <option value="Bebas Terbatas">Bebas Terbatas</option>
                    <option value="Bebas">Obat Bebas</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddKatModal(false)}
                  className="btn-outline h-8 px-3 text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary h-8 px-4 text-xs font-bold">
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-indigo-600" />
                <span>Bantuan & SOP Retur Apotek</span>
              </h4>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>SOP Pengembalian Obat Kedaluwarsa (Apotek Asahan Farma):</strong>
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                <li>Periksa daftar batch di tab <em>Pengingat & Retur</em> secara berkala.</li>
                <li>Pisahkan fisik obat dari rak etalase ke area karantina retur.</li>
                <li>Cetak formulir Berita Acara Retur Fisik yang mencantumkan nomor faktur beli.</li>
                <li>Hubungi PIC PBF via telepon/WhatsApp sebelum tenggat retur habis.</li>
                <li>Lakukan Stock Opname penyesuaian stok di SIMAAF setelah obat diserahterimakan.</li>
              </ol>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSupportModal(false)}
                className="btn-primary h-8 px-4 text-xs font-bold"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
