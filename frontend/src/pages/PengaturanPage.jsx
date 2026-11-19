import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, DEFAULT_PROFILE, DEFAULT_KATEGORI, DEFAULT_SOP_STEPS } from '../services/api';
import { BrandLogo } from '../components/common/BrandLogo';
import { SettingToggle } from '../components/pengaturan/SettingToggle';
import { SopEditorPanel } from '../components/pengaturan/SopEditorPanel';
import { AddPbfModal, AddKategoriModal } from '../components/pengaturan/PengaturanModals';
import { getAiConfig, saveAiConfig, exportToExcelCsv } from '../utils/fileTools';
import {
  Building2,
  Shield,
  FileText,
  Calendar,
  Wallet,
  SlidersHorizontal,
  Sparkles,
  Database,
  LifeBuoy,
  ChevronRight,
  ArrowLeft,
  Search,
  Save,
  Loader2,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  UploadCloud,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

export function PengaturanPage({ onSettingsUpdated, currentLogoUrl, onLogoChange }) {
  // Null pada mobile berarti menampilkan daftar menu utama bertumpuk; desktop otomatis memilih item aktif
  const [selectedSection, setSelectedSection] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [pbfSearch, setPbfSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [savingPbfId, setSavingPbfId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // State profil apotek & logo
  const [profile, setProfile] = useState({
    ...DEFAULT_PROFILE,
    logo_url: currentLogoUrl && !currentLogoUrl.startsWith('/logo-') ? currentLogoUrl : '',
  });
  const [distributors, setDistributors] = useState([]);
  const [kategoriList, setKategoriList] = useState(DEFAULT_KATEGORI);
  const [sopSteps, setSopSteps] = useState(DEFAULT_SOP_STEPS);
  const [isEditingSop, setIsEditingSop] = useState(false);
  const [newSopStepText, setNewSopStepText] = useState('');
  const [settings, setSettings] = useState({
    tanggal_acuan: '2026-10-31',
    stok_minimum_default: 10,
    batas_kedaluwarsa_warning_hari: 90,
    batas_retur_warning_hari: 30,
  });

  // State preferensi tampilan & AI lokal
  const [aiConfig, setAiConfig] = useState(() => getAiConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [defaultPage, setDefaultPage] = useState(
    () => localStorage.getItem('simaaf_default_page') || 'dashboard'
  );
  const [privacyMode, setPrivacyMode] = useState(
    () => localStorage.getItem('simaaf_privacy_mode') === 'true'
  );
  const [mobileQueueFirst, setMobileQueueFirst] = useState(
    () => localStorage.getItem('simaaf_mobile_queue_first') !== 'false'
  );

  // Modal tambah PBF & kategori
  const [showAddPbfModal, setShowAddPbfModal] = useState(false);
  const [newPbf, setNewPbf] = useState({
    kode: '',
    nama: '',
    aturan_retur_bulan: 3,
    telepon: '',
    kontak: '',
  });
  const [showAddKatModal, setShowAddKatModal] = useState(false);
  const [newKat, setNewKat] = useState({
    nama: '',
    stok_minimum: 15,
    masa_pantau_hari: 30,
    jenis: 'Bebas',
  });

  const fileInputRef = useRef(null);
  const backupInputRef = useRef(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const flashSuccess = (msg) => {
    setErrorMsg('');
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const flashError = (msg) => {
    setSuccessMsg('');
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4500);
  };

  const loadAllData = async () => {
    try {
      const [dList, sData, pData, kList, sSteps] = await Promise.all([
        api.getDistributors(),
        api.getSettings(),
        api.getProfile(),
        api.getKategoriList(),
        api.getSopSteps(),
      ]);
      setDistributors(dList);
      setSettings(sData);
      setProfile((prev) => ({
        ...prev,
        ...pData,
        logo_url: currentLogoUrl && !currentLogoUrl.startsWith('/logo-') ? currentLogoUrl : '',
      }));
      setKategoriList(kList);
      setSopSteps(Array.isArray(sSteps) && sSteps.length > 0 ? sSteps : DEFAULT_SOP_STEPS);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      flashError('Ukuran logo maksimal 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newUrl = reader.result;
      setProfile((prev) => ({ ...prev, logo_url: newUrl }));
      if (onLogoChange) onLogoChange(newUrl);
      flashSuccess('Logo Apotek berhasil diperbarui!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onLogoChange) onLogoChange('');
    flashSuccess('Logo dikembalikan ke lambang standar SIMAAF.');
  };

  const handleSaveProfileAndDocs = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { logo_url, ...rest } = profile;
      await api.updateProfile(rest);
      flashSuccess('Profil & konfigurasi dokumen apotek tersimpan di perangkat.');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      flashError(err.message || 'Gagal menyimpan profil apotek.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOperationalSettings = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings({
        ...settings,
        stok_minimum_default: Number(settings.stok_minimum_default) || 10,
        batas_kedaluwarsa_warning_hari: Number(settings.batas_kedaluwarsa_warning_hari) || 90,
        batas_retur_warning_hari: Number(settings.batas_retur_warning_hari) || 30,
      });
      flashSuccess('Tanggal acuan & ambang peringatan berhasil disimpan!');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      flashError(err.message || 'Gagal menyimpan parameter operasional.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDistributorRule = async (pbfId, newBulan) => {
    setSavingPbfId(pbfId);
    try {
      await api.updateAturanDistributor(pbfId, newBulan);
      await loadAllData();
      flashSuccess('Aturan retur PBF diperbarui & seluruh batch terkait dihitung ulang.');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      flashError(err.message || 'Gagal memperbarui aturan PBF.');
    } finally {
      setSavingPbfId(null);
    }
  };

  const handleAddPbf = async (e) => {
    e.preventDefault();
    if (!newPbf.nama.trim()) {
      flashError('Nama PBF wajib diisi.');
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
    const res = await api.addDistributor(item);
    setDistributors(res.data);
    setShowAddPbfModal(false);
    setNewPbf({ kode: '', nama: '', aturan_retur_bulan: 3, telepon: '', kontak: '' });
    flashSuccess(`PBF "${item.nama}" ditambahkan & tersimpan.`);
  };

  const handleDeletePbf = async (id, nama) => {
    if (!window.confirm(`Hapus PBF "${nama}" dari daftar rekanan?`)) return;
    const res = await api.deleteDistributor(id);
    setDistributors(res.data);
    flashSuccess(`PBF "${nama}" dihapus.`);
  };

  const handleAddKategori = async (e) => {
    e.preventDefault();
    if (!newKat.nama.trim()) {
      flashError('Nama kategori wajib diisi.');
      return;
    }
    const item = {
      id: Date.now(),
      nama: newKat.nama.trim(),
      stok_minimum: Number(newKat.stok_minimum) || 15,
      masa_pantau_hari: Number(newKat.masa_pantau_hari) || 30,
      jenis: newKat.jenis,
    };
    const next = [...kategoriList, item];
    setKategoriList(next);
    await api.saveKategoriList(next);
    setShowAddKatModal(false);
    setNewKat({ nama: '', stok_minimum: 15, masa_pantau_hari: 30, jenis: 'Bebas' });
    flashSuccess(`Kategori "${item.nama}" ditambahkan & tersimpan.`);
  };

  const handleDeleteKategori = async (id, nama) => {
    if (!window.confirm(`Hapus kategori "${nama}"?`)) return;
    const next = kategoriList.filter((k) => k.id !== id);
    setKategoriList(next);
    await api.saveKategoriList(next);
    flashSuccess(`Kategori "${nama}" dihapus.`);
  };

  const handleExportJsonBackup = async () => {
    const snapshot = await api.exportFullBackup();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadangan_simaaf_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashSuccess('Berkas cadangan penuh (.json) berhasil diunduh.');
  };

  const handleImportJsonBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        const res = await api.importFullBackup(parsed);
        await loadAllData();
        setDefaultPage(localStorage.getItem('simaaf_default_page') || 'dashboard');
        setPrivacyMode(localStorage.getItem('simaaf_privacy_mode') === 'true');
        if (onSettingsUpdated) onSettingsUpdated();
        flashSuccess(`Data dipulihkan (${res.jumlah_batch} batch aktif).`);
      } catch (err) {
        flashError(err.message || 'Gagal membaca berkas cadangan JSON.');
      } finally {
        if (backupInputRef.current) backupInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Kembalikan seluruh batch, PBF, profil, dan aturan ke data awal demo?')) {
      return;
    }
    await api.resetDemoData();
    await loadAllData();
    if (onSettingsUpdated) onSettingsUpdated();
    flashSuccess('Seluruh data berhasil dikembalikan ke setelan awal demo.');
  };

  const handleExportAllBatchesCsv = async () => {
    const res = await api.getBatches();
    const rowsData = res.data || [];
    const headers = [
      'Nama Obat',
      'Nomor Batch',
      'Distributor PBF',
      'Batas Retur',
      'Tanggal ED',
      'Sisa Stok',
      'Nilai Total (Rp)',
      'Status Retur',
    ];
    const rows = rowsData.map((b) => [
      b.nama_obat,
      b.nomor_batch,
      b.nama_distributor || '-',
      b.batas_retur || '-',
      b.tanggal_kedaluwarsa || '-',
      b.jumlah_saat_ini ?? 0,
      b.nilai_total || 0,
      b.status_retur || '-',
    ]);
    exportToExcelCsv(`semua_batch_simaaf_${settings.tanggal_acuan}.csv`, headers, rows);
    flashSuccess(`Diekspor ${rowsData.length} batch persediaan ke CSV.`);
  };

  const defaultPageLabels = {
    dashboard: 'Beranda',
    faktur: 'Input Faktur',
    inventori: 'Stok & Batch',
    pengingat: 'Retur & ED',
    penyesuaian: 'Stok Opname',
    kalender: 'Kalender PBF',
  };

  // Pengelompokan item pengaturan sidebar & mobile list
  const menuGroups = useMemo(
    () => [
      {
        title: 'Sarana Apotek & Dokumen',
        items: [
          {
            id: 'identitas',
            label: 'Profil & Logo Apotek',
            subtitle: `${profile.nama_apotek} • ${profile.logo_url ? 'Logo kustom aktif' : 'Logo standar'}`,
            icon: Building2,
            iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
            keywords: 'nama apotek alamat telepon whatsapp pemilik apj logo foto upload',
          },
          {
            id: 'legalitas',
            label: 'Identitas & Izin Apotek',
            subtitle: `SIA ${profile.sia}`,
            icon: Shield,
            iconClass: 'bg-teal-50 text-teal-600 border-teal-200/70',
            keywords: 'sia sipa izin praktek apoteker',
          },
          {
            id: 'dokumen',
            label: 'Kop & Format Surat BAP',
            subtitle: profile.format_no_retur,
            icon: FileText,
            iconClass: 'bg-teal-50 text-teal-600 border-teal-200/70',
            keywords: 'kop surat pdf bap berita acara retur penomoran tanda tangan',
          },
        ],
      },
      {
        title: 'Operasional & Aturan Retur',
        items: [
          {
            id: 'operasional',
            label: 'Tanggal Acuan & Peringatan',
            subtitle: `Acuan ${settings.tanggal_acuan} • Retur H-${settings.batas_retur_warning_hari} • ED H-${settings.batas_kedaluwarsa_warning_hari}`,
            icon: Calendar,
            iconClass: 'bg-amber-50 text-amber-600 border-amber-200/70',
            keywords: 'tanggal acuan warning peringatan retur ed kedaluwarsa stok minimum hari',
          },
          {
            id: 'rekanan',
            label: 'Distributor PBF & Tenggat',
            subtitle: 'Batas bulan pengembalian & kontak PIC',
            badge: `${distributors.length}`,
            icon: Building2,
            iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
            keywords: 'pbf distributor supplier retur bulan pic telepon',
          },
          {
            id: 'kategori',
            label: 'Kategori Obat & Stok Aman',
            subtitle: 'Ambang minimum per golongan farmasi',
            badge: `${kategoriList.length}`,
            icon: Wallet,
            iconClass: 'bg-teal-50 text-teal-600 border-teal-200/70',
            keywords: 'kategori golongan obat keras bebas antibiotik stok minimum',
          },
        ],
      },
      {
        title: 'Tampilan & Kecerdasan AI',
        items: [
          {
            id: 'preferensi',
            label: 'Tampilan Mobile & Privasi',
            subtitle: `${privacyMode ? 'Nominal tersembunyi' : 'Nominal tampil'} • Awal: ${defaultPageLabels[defaultPage] || 'Beranda'}`,
            icon: SlidersHorizontal,
            iconClass: 'bg-slate-100 text-slate-700 border-slate-200',
            keywords: 'privasi sembunyikan rupiah mobile antrean beranda awal default tampilan',
          },
          {
            id: 'ai',
            label: 'AI Pembaca Faktur & Impor',
            subtitle: aiConfig.apiKey
              ? `${aiConfig.provider.toUpperCase()} (${aiConfig.model})`
              : 'Mode impor CSV/Excel lokal aktif',
            icon: Sparkles,
            iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
            keywords: 'ai gemini openai api key token scan foto faktur excel csv word',
          },
        ],
      },
      {
        title: 'Data Perangkat & Bantuan',
        items: [
          {
            id: 'cadangan',
            label: 'Cadangkan, Pulihkan & Reset',
            subtitle: 'Ekspor JSON/CSV & kembalikan data demo',
            icon: Database,
            iconClass: 'bg-slate-100 text-slate-700 border-slate-200',
            keywords: 'backup cadangan restore pulihkan json csv export reset data demo localstorage',
          },
          {
            id: 'bantuan',
            label: 'Panduan SOP Retur PBF',
            subtitle: 'Langkah karantina rak & serah terima PBF',
            icon: LifeBuoy,
            iconClass: 'bg-rose-50 text-rose-600 border-rose-200/70',
            keywords: 'bantuan sop panduan retur karantina cara pakai',
          },
        ],
      },
    ],
    [profile, settings, distributors.length, kategoriList.length, privacyMode, defaultPage, aiConfig]
  );

  const filteredGroups = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return menuGroups;
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.keywords.includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [menuGroups, menuSearch]);

  const filteredDistributors = useMemo(() => {
    const q = pbfSearch.trim().toLowerCase();
    if (!q) return distributors;
    return distributors.filter(
      (d) =>
        d.nama.toLowerCase().includes(q) ||
        d.kode.toLowerCase().includes(q) ||
        (d.kontak || '').toLowerCase().includes(q)
    );
  }, [distributors, pbfSearch]);

  const allItems = useMemo(() => menuGroups.flatMap((g) => g.items), [menuGroups]);
  const activeDetailId = selectedSection || 'identitas';
  const activeDetailMeta = allItems.find((i) => i.id === activeDetailId) || allItems[0];

  const renderDetailContent = (sectionId) => {
    switch (sectionId) {
      case 'identitas':
        return (
          <form onSubmit={handleSaveProfileAndDocs} className="space-y-4">
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-emerald-500/25 overflow-hidden bg-white shadow-xs flex items-center justify-center p-1 shrink-0">
                <BrandLogo
                  logoUrl={profile.logo_url}
                  className="w-full h-full"
                  alt={profile.nama_apotek}
                />
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-900">
                    {profile.logo_url ? 'Logo Kustom' : 'Logo Standar'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Aktif
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500">
                  PNG, JPG, WebP, atau SVG (maks. 2 MB).
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary h-9 px-3 text-xs font-bold gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Logo</span>
                  </button>
                  {profile.logo_url && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="btn-outline h-9 px-2.5 text-xs text-slate-600"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sarana Apotek</label>
                <input
                  type="text"
                  value={profile.nama_apotek}
                  onChange={(e) => setProfile({ ...profile, nama_apotek: e.target.value })}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Komisaris / Pemilik</label>
                  <input
                    type="text"
                    value={profile.pimpinan}
                    onChange={(e) => setProfile({ ...profile, pimpinan: e.target.value })}
                    className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apoteker Penanggung Jawab</label>
                  <input
                    type="text"
                    value={profile.apoteker_pj}
                    onChange={(e) => setProfile({ ...profile, apoteker_pj: e.target.value })}
                    className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={profile.alamat}
                  onChange={(e) => setProfile({ ...profile, alamat: e.target.value })}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={profile.whatsapp}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Operasional</label>
                  <input
                    type="text"
                    value={profile.jam_operasional}
                    onChange={(e) => setProfile({ ...profile, jam_operasional: e.target.value })}
                    className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary h-11 px-5 text-xs font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Profil Apotek</span>
              </button>
            </div>
          </form>
        );

      case 'legalitas':
        return (
          <form onSubmit={handleSaveProfileAndDocs} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Surat Izin Apotek (SIA)</label>
                <input
                  type="text"
                  value={profile.sia}
                  onChange={(e) => setProfile({ ...profile, sia: e.target.value })}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Surat Izin Praktik Apoteker (SIPA)</label>
                <input
                  type="text"
                  value={profile.sipa}
                  onChange={(e) => setProfile({ ...profile, sipa: e.target.value })}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Dicetak Otomatis pada Dokumen BAP Retur</span>
              </div>
              <p className="text-[11px] text-teal-800/80">
                Nomor SIA dan SIPA akan muncul pada kop surat resmi pengembalian barang ke PBF.
              </p>
            </div>

            <div className="pt-1 flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary h-11 px-5 text-xs font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Izin Apotek</span>
              </button>
            </div>
          </form>
        );

      case 'dokumen':
        return (
          <form onSubmit={handleSaveProfileAndDocs} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Format Penomoran Surat Retur
                </label>
                <input
                  type="text"
                  value={profile.format_no_retur}
                  onChange={(e) => setProfile({ ...profile, format_no_retur: e.target.value })}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Variabel didukung: {'{YYYY}'}, {'{MM}'}, {'{INDEX}'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kaki Resmi Lembar BAP
                </label>
                <textarea
                  rows={3}
                  value={profile.catatan_kaki_surat}
                  onChange={(e) => setProfile({ ...profile, catatan_kaki_surat: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="border-t border-slate-100">
                <SettingToggle
                  checked={Boolean(profile.tanda_tangan_apj)}
                  onChange={(val) => setProfile({ ...profile, tanda_tangan_apj: val })}
                  label="Sertakan Kolom Tanda Tangan APJ & Driver PBF"
                  description="Tampilkan blok tanda tangan basah/stempel di bagian bawah Berita Acara."
                />
              </div>
            </div>

            {/* Pratinjau KOP Resmi */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  Pratinjau Kop Dokumen Cetak
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Format BAP
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-center space-y-1">
                <BrandLogo logoUrl={profile.logo_url} className="w-10 h-10 mx-auto mb-1" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  {profile.nama_apotek}
                </h4>
                <p className="text-[11px] text-slate-600">{profile.alamat}</p>
                <p className="text-[10px] font-mono text-slate-400">
                  SIA: {profile.sia} • APJ: {profile.apoteker_pj}
                </p>
                <div className="w-full h-0.5 bg-slate-900 mt-1.5" />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary h-11 px-5 text-xs font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Format Dokumen</span>
              </button>
            </div>
          </form>
        );

      case 'operasional':
        return (
          <form onSubmit={handleSaveOperationalSettings} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-950">Tanggal Acuan Evaluasi</span>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      tanggal_acuan: new Date().toISOString().split('T')[0],
                    })
                  }
                  className="text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition"
                >
                  Pakai Tanggal Hari Ini
                </button>
              </div>
              <input
                type="date"
                value={settings.tanggal_acuan}
                onChange={(e) => setSettings({ ...settings, tanggal_acuan: e.target.value })}
                className="w-full text-xs h-11 px-3 rounded-xl border border-amber-200 bg-white font-black text-emerald-700"
              />
              <p className="text-[11px] text-amber-900/80">
                Menentukan acuan perhitungan sisa hari retur, mendekati kedaluwarsa, dan notifikasi dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peringatan Retur (Hari)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={settings.batas_retur_warning_hari}
                  onChange={(e) =>
                    setSettings({ ...settings, batas_retur_warning_hari: Number(e.target.value) })
                  }
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-bold tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-1">Masuk daftar Mendesak Retur</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peringatan ED (Hari)
                </label>
                <input
                  type="number"
                  min={7}
                  max={365}
                  value={settings.batas_kedaluwarsa_warning_hari}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      batas_kedaluwarsa_warning_hari: Number(e.target.value),
                    })
                  }
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-bold tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-1">Masuk tab Dekat Kedaluwarsa</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stok Minimum Default
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={settings.stok_minimum_default}
                  onChange={(e) =>
                    setSettings({ ...settings, stok_minimum_default: Number(e.target.value) })
                  }
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-bold tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-1">Peringatan stok menipis</p>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary h-11 px-5 text-xs font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan & Hitung Ulang</span>
              </button>
            </div>
          </form>
        );

      case 'rekanan':
        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pbfSearch}
                  onChange={(e) => setPbfSearch(e.target.value)}
                  placeholder="Cari nama atau kode PBF..."
                  className="w-full text-xs h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['Kode PBF', 'Nama Distributor', 'Aturan Retur (Bulan)', 'Kontak PIC', 'Telepon'];
                    const rows = distributors.map((d) => [d.kode, d.nama, d.aturan_retur_bulan, d.kontak || '-', d.telepon || '-']);
                    exportToExcelCsv('daftar_pbf_apotek_asahan.csv', headers, rows);
                  }}
                  className="btn-outline h-10 px-3 text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPbfModal(true)}
                  className="btn-primary h-10 px-3.5 text-xs font-bold gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah PBF</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 overflow-hidden bg-white">
              {filteredDistributors.map((d) => (
                <div key={d.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {d.kode}
                        </span>
                        {savingPbfId === d.id ? (
                          <span className="text-[11px] font-bold text-emerald-600 animate-pulse">
                            Menyimpan...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                            <Check className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">{d.nama}</p>
                      <p className="text-[11px] text-slate-500">
                        PIC: {d.kontak || 'Bagian Retur'} • <span className="font-mono">{d.telepon || '-'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePbf(d.id, d.nama)}
                      className="w-10 h-10 min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0"
                      aria-label={`Hapus ${d.nama}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <select
                    value={d.aturan_retur_bulan}
                    onChange={(e) => handleUpdateDistributorRule(d.id, parseInt(e.target.value, 10))}
                    className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
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
              ))}
            </div>
          </div>
        );

      case 'kategori':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Atur stok aman minimum dan hari pantau per golongan obat.
              </p>
              <button
                type="button"
                onClick={() => setShowAddKatModal(true)}
                className="btn-primary h-10 px-3.5 text-xs font-bold gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 overflow-hidden bg-white">
              {kategoriList.map((kat) => (
                <div key={kat.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          kat.jenis === 'Keras'
                            ? 'bg-rose-100 text-rose-800'
                            : kat.jenis === 'Bebas Terbatas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {kat.jenis}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{kat.nama}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Min. stok <strong className="text-slate-800">{kat.stok_minimum} unit</strong> • Pantau retur{' '}
                      <strong className="text-slate-800">{kat.masa_pantau_hari} hari</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteKategori(kat.id, kat.nama)}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0"
                    aria-label={`Hapus kategori ${kat.nama}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'preferensi':
        return (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 px-4 bg-white">
              <SettingToggle
                checked={privacyMode}
                onChange={(val) => {
                  setPrivacyMode(val);
                  localStorage.setItem('simaaf_privacy_mode', String(val));
                  flashSuccess(val ? 'Mode Privasi aktif secara default.' : 'Nominal Rupiah tampil otomatis.');
                }}
                label="Mode Privasi (Sembunyikan Nominal Otomatis)"
                description="Tutupi angka Rupiah saat membuka Beranda di dekat pelanggan."
              />
              <SettingToggle
                checked={mobileQueueFirst}
                onChange={(val) => {
                  setMobileQueueFirst(val);
                  localStorage.setItem('simaaf_mobile_queue_first', String(val));
                  flashSuccess('Urutan kartu Beranda mobile diperbarui.');
                }}
                label="Utamakan Antrean Tindakan di Beranda Mobile"
                description="Tampilkan tugas retur prioritas lebih atas dari daftar pengawasan batch di HP."
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">Halaman Awal Saat Masuk Aplikasi</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(defaultPageLabels).map(([id, label]) => {
                  const active = defaultPage === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setDefaultPage(id);
                        localStorage.setItem('simaaf_default_page', id);
                        flashSuccess(`Halaman awal diubah ke ${label}.`);
                      }}
                      className={`h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{label}</span>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penyedia Layanan AI</label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) =>
                    setAiConfig({
                      ...aiConfig,
                      provider: e.target.value,
                      model: e.target.value === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash',
                    })
                  }
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="gemini">Google Gemini (Vision + Dokumen)</option>
                  <option value="openai">OpenAI GPT (Vision + Dokumen)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model Ekstraksi</label>
                <select
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 bg-white font-mono font-semibold"
                >
                  {aiConfig.provider === 'gemini' ? (
                    <>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Cepat & Akurat)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Faktur Kompleks)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini (Hemat)</option>
                      <option value="gpt-4o">gpt-4o (Akurasi Tinggi)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">API Key / Token AI</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    placeholder="Opsional — kosongkan untuk impor CSV/Excel lokal..."
                    className="w-full text-xs h-11 pl-9 pr-11 rounded-xl border border-slate-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700"
                    aria-label="Tampilkan atau sembunyikan token"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-emerald-900">Format Berkas yang Langsung Didukung:</p>
              <p className="text-[11px] text-slate-600">
                CSV, TSV, Excel (.xlsx/.xls), Word (.docx), dan foto faktur fisik (.jpg/.png/.webp).
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const saved = saveAiConfig(aiConfig);
                  setAiConfig(saved);
                  flashSuccess(
                    saved.apiKey
                      ? `Token AI (${saved.provider.toUpperCase()}) tersimpan di perangkat.`
                      : 'Token AI dikosongkan.'
                  );
                }}
                className="btn-primary h-11 px-5 text-xs font-bold"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi AI</span>
              </button>
            </div>
          </div>
        );

      case 'cadangan':
        return (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
              <p className="font-bold">Portabilitas Data Tanpa Backend</p>
              <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                Seluruh transaksi tersimpan lokal di browser Anda. Unduh berkas cadangan (.json) untuk
                memindahkan seluruh batch, aturan PBF, &amp; riwayat opname antar HP atau komputer apotek.
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <button
                type="button"
                onClick={handleExportJsonBackup}
                className="w-full p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Unduh Cadangan Penuh (.JSON)</p>
                    <p className="text-[11px] text-slate-500">Semua batch, PBF, profil, dan log opname</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="w-full p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Pulihkan dari Berkas Cadangan (.JSON)</p>
                    <p className="text-[11px] text-slate-500">Muat ulang data dari perangkat lain</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <input
                ref={backupInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJsonBackup}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleExportAllBatchesCsv}
                className="w-full p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">Ekspor Laporan Stok Excel (.CSV)</p>
                    <p className="text-[11px] text-slate-500">Siap dibuka di Microsoft Excel / Google Sheets</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full p-3.5 flex items-center justify-between gap-3 hover:bg-rose-50/70 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-rose-700">Reset ke Data Demo Awal</p>
                    <p className="text-[11px] text-slate-500">Kembalikan contoh 8 batch & 14 PBF standar</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
              </button>
            </div>
          </div>
        );

      case 'bantuan':
      default: {
        const handleSaveSop = async () => {
          const cleaned = sopSteps.filter((s) => s.teks && s.teks.trim());
          setSopSteps(cleaned);
          await api.saveSopSteps(cleaned);
          setIsEditingSop(false);
          flashSuccess('Panduan SOP Apotek berhasil diperbarui & tersimpan.');
        };

        const handleResetSop = async () => {
          setSopSteps(DEFAULT_SOP_STEPS);
          await api.saveSopSteps(DEFAULT_SOP_STEPS);
          flashSuccess('Panduan SOP dikembalikan ke standar awal.');
        };

        return (
          <SopEditorPanel
            namaApotek={profile.nama_apotek}
            sopSteps={sopSteps}
            setSopSteps={setSopSteps}
            isEditingSop={isEditingSop}
            setIsEditingSop={setIsEditingSop}
            newSopStepText={newSopStepText}
            setNewSopStepText={setNewSopStepText}
            onSaveSop={handleSaveSop}
            onResetSop={handleResetSop}
          />
        );
      }
    }
  };

  return (
    <div className="space-y-3">
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Daftar Kategori Pengaturan & Sub-halaman Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div
          className={`${
            selectedSection ? 'hidden lg:block' : 'block'
          } lg:col-span-5 xl:col-span-4 space-y-3`}
        >
          <button
            type="button"
            onClick={() => setSelectedSection('identitas')}
            className="w-full bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center justify-between gap-3 hover:border-emerald-300 transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo logoUrl={profile.logo_url} className="w-12 h-12 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950 truncate">{profile.nama_apotek}</p>
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  {profile.apoteker_pj}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    SIA {profile.sia}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                    Data Simulasi
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Cari pengaturan (logo, PBF, privasi, cadangan)..."
              className="w-full text-xs h-11 pl-10 pr-4 rounded-2xl border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium shadow-2xs"
            />
          </div>

          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center text-xs text-slate-400">
              Pengaturan "{menuSearch}" tidak ditemukan.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredGroups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <p className="px-2 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                    {group.title}
                  </p>
                  <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-2xs overflow-hidden">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActiveDesktop = activeDetailId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`setting-item-${item.id}`}
                          onClick={() => setSelectedSection(item.id)}
                          className={`w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left transition cursor-pointer min-h-[56px] ${
                            isActiveDesktop
                              ? 'lg:bg-emerald-50/75 hover:bg-emerald-50'
                              : 'hover:bg-slate-50 active:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.iconClass}`}
                            >
                              <Icon className="w-4 h-4" strokeWidth={2.2} />
                            </span>
                            <div className="min-w-0">
                              <p
                                className={`text-[13px] font-bold truncate ${
                                  isActiveDesktop ? 'lg:text-emerald-700 text-slate-900' : 'text-slate-900'
                                }`}
                              >
                                {item.label}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Detail Kanan (Desktop selalu tampil & menempel rapi saat scroll; Mobile tampil saat item diketuk) */}
        <div
          className={`${
            selectedSection ? 'block' : 'hidden lg:block'
          } lg:col-span-7 xl:col-span-8 lg:sticky lg:top-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden`}
        >
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
            <button
              type="button"
              onClick={() => setSelectedSection(null)}
              className="lg:hidden w-10 h-10 min-w-[40px] rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition shrink-0"
              aria-label="Kembali ke daftar pengaturan"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-950 truncate">
                  {activeDetailMeta?.label}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold shrink-0">
                  Data Simulasi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{activeDetailMeta?.subtitle}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5">{renderDetailContent(activeDetailId)}</div>
        </div>
      </div>

      <AddPbfModal
        isOpen={showAddPbfModal}
        newPbf={newPbf}
        setNewPbf={setNewPbf}
        onSubmit={handleAddPbf}
        onClose={() => setShowAddPbfModal(false)}
      />

      <AddKategoriModal
        isOpen={showAddKatModal}
        newKat={newKat}
        setNewKat={setNewKat}
        onSubmit={handleAddKategori}
        onClose={() => setShowAddKatModal(false)}
      />
    </div>
  );
}
