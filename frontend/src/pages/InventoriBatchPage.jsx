import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../services/api';
import { StatusReturBadge, StatusRisikoBadge } from '../components/common/StatusBadge';
import { exportToExcelCsv, parseUploadedDocument } from '../utils/fileTools';
import {
  Boxes,
  Search,
  Edit3,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Folder,
  FolderOpen,
  FolderPlus,
  ArrowLeft,
  ChevronRight,
  Plus,
  BellRing,
  X,
} from 'lucide-react';

const DEFAULT_RACK_FOLDERS = [
  { id: 'rak-utama', name: 'Etalase Depan & Bebas', tone: 'blue' },
  { id: 'rak-keras', name: 'Rak Obat Keras & Antibiotik', tone: 'rose' },
  { id: 'rak-topikal', name: 'Sirup Anak, Salep & Tetes', tone: 'teal' },
  { id: 'rak-karantina', name: 'Karantina & Wajib Retur PBF', tone: 'amber' },
];

const FOLDER_TONE_STYLES = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200/80',
  rose: 'bg-rose-50 text-rose-600 border-rose-200/80',
  amber: 'bg-amber-50 text-amber-600 border-amber-200/80',
  teal: 'bg-teal-50 text-teal-600 border-teal-200/80',
  violet: 'bg-violet-50 text-violet-600 border-violet-200/80',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Menentukan kategori obat untuk folder pengelompokan otomatis meski item berasal dari impor baru.
 */
function inferMedicineCategory(batch, obatMap) {
  const fromMaster = obatMap.get(Number(batch.obat_id))?.kategori;
  if (fromMaster) return fromMaster;
  const nama = (batch.nama_obat || '').toLowerCase();
  if (/amox|cefix|cipro|azith|cefad|kloram|antibiot/.test(nama)) return 'Antibiotik';
  if (/paracet|ibuprof|mefenam|antalgin|ketopro|aspir/.test(nama)) return 'Analgesik & Antipiretik';
  if (/omepra|antasid|ranitid|lansopra/.test(nama)) return 'Saluran Lambung';
  if (/salep|krim|tetes|gel|topikal/.test(nama)) return 'Topikal & Kulit';
  if (/sirup|obh|batuk|cetiriz|salbut/.test(nama)) return 'Batuk, Flu & Napas';
  if (/vit|curcuma|suplemen|zinc/.test(nama)) return 'Suplemen & Vitamin';
  return 'Lainnya';
}

/**
 * Menentukan ID, label, dan warna folder untuk satu batch berdasarkan mode pengelompokan aktif.
 */
function resolveBatchFolder(batch, groupMode, obatMap, rackFolders, batchFolderMap) {
  if (groupMode === 'pbf') {
    const name = batch.nama_distributor || 'PBF Lainnya';
    return {
      id: `pbf:${batch.distributor_id || name}`,
      name,
      tone: 'blue',
    };
  }

  if (groupMode === 'status') {
    if (batch.status_retur === 'lewat_batas') {
      return { id: 'st:lewat_batas', name: 'Lewat Batas Retur', tone: 'rose' };
    }
    if (batch.status_risiko === 'tinggi') {
      return { id: 'st:risiko_tinggi', name: 'Risiko Tinggi / Wajib Retur', tone: 'amber' };
    }
    if (batch.status_risiko === 'sedang') {
      return { id: 'st:sedang', name: 'Perlu Dipantau (Waspada)', tone: 'violet' };
    }
    return { id: 'st:aman', name: 'Stok Aman Terkendali', tone: 'teal' };
  }

  if (groupMode === 'abjad') {
    const ch = (batch.nama_obat || 'Z').trim().charAt(0).toUpperCase();
    if (ch >= 'A' && ch <= 'E') return { id: 'az:a-e', name: 'Obat Awalan A – E', tone: 'blue' };
    if (ch >= 'F' && ch <= 'K') return { id: 'az:f-k', name: 'Obat Awalan F – K', tone: 'teal' };
    if (ch >= 'L' && ch <= 'P') return { id: 'az:l-p', name: 'Obat Awalan L – P', tone: 'violet' };
    return { id: 'az:q-z', name: 'Obat Awalan Q – Z', tone: 'amber' };
  }

  if (groupMode === 'rak') {
    const mappedId = batchFolderMap[String(batch.id)];
    if (mappedId) {
      const found = rackFolders.find((f) => f.id === mappedId);
      if (found) return found;
    }
    if (batch.status_retur === 'lewat_batas') {
      return rackFolders.find((f) => f.id === 'rak-karantina') || rackFolders[0];
    }
    const cat = inferMedicineCategory(batch, obatMap).toLowerCase();
    if (cat.includes('antibiotik') || cat.includes('hipertensi') || cat.includes('diabetes')) {
      return rackFolders.find((f) => f.id === 'rak-keras') || rackFolders[0];
    }
    if (cat.includes('topikal') || cat.includes('batuk') || cat.includes('sirup')) {
      return rackFolders.find((f) => f.id === 'rak-topikal') || rackFolders[0];
    }
    return rackFolders[0];
  }

  const catName = inferMedicineCategory(batch, obatMap);
  const lower = catName.toLowerCase();
  let tone = 'blue';
  if (lower.includes('antibiotik')) tone = 'rose';
  else if (lower.includes('topikal') || lower.includes('anak')) tone = 'teal';
  else if (lower.includes('lambung') || lower.includes('batuk')) tone = 'amber';
  else if (lower.includes('suplemen') || lower.includes('vitamin')) tone = 'violet';

  return {
    id: `cat:${catName}`,
    name: catName,
    tone,
  };
}

/**
 * Mengelompokkan daftar batch menjadi tingkat Produk Obat dengan pengurutan FEFO internal.
 */
function groupBatchesIntoProducts(batchList) {
  const map = new Map();
  batchList.forEach((b) => {
    const key = b.obat_id ? `obat:${b.obat_id}` : `nama:${(b.nama_obat || '').toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        nama_obat: b.nama_obat,
        categoryLabel: b._folderName || '-',
        folderId: b._folderId,
        folderName: b._folderName,
        totalStok: 0,
        totalNilai: 0,
        batches: [],
        earliestEd: b.tanggal_kedaluwarsa || '9999-12-31',
        hasOverdueRetur: false,
        hasHighRisk: false,
      });
    }
    const prod = map.get(key);
    prod.batches.push(b);
    prod.totalStok += b.jumlah_saat_ini ?? 0;
    prod.totalNilai += b.nilai_total || 0;
    if (b.tanggal_kedaluwarsa && b.tanggal_kedaluwarsa < prod.earliestEd) {
      prod.earliestEd = b.tanggal_kedaluwarsa;
    }
    if (b.status_retur === 'lewat_batas') prod.hasOverdueRetur = true;
    if (b.status_risiko === 'tinggi') prod.hasHighRisk = true;
  });

  // Urutkan batch internal FEFO (ED tercepat di urutan pertama)
  const products = Array.from(map.values());
  products.forEach((p) => {
    p.batches.sort((a, b) =>
      String(a.tanggal_kedaluwarsa || '').localeCompare(String(b.tanggal_kedaluwarsa || ''))
    );
  });

  return products.sort((a, b) => {
    if (b.hasOverdueRetur !== a.hasOverdueRetur) return b.hasOverdueRetur ? 1 : -1;
    if (b.hasHighRisk !== a.hasHighRisk) return b.hasHighRisk ? 1 : -1;
    return String(a.earliestEd).localeCompare(String(b.earliestEd));
  });
}

export function InventoriBatchPage({
  onSelectBatchForAdjustment,
  onNavigateToFaktur,
  onNavigateToPengingat,
  initialSearch = '',
  onClearInitialSearch,
}) {
  const [allBatches, setAllBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [obatList, setObatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState(null);
  const fileImportRef = useRef(null);

  // State pencarian, filter modal, & navigasi 3 tingkat (Folder -> Obat -> Detail Batch)
  const [search, setSearch] = useState(initialSearch || '');
  const [distributorFilter, setDistributorFilter] = useState('');
  const [risikoFilter, setRisikoFilter] = useState('semua');
  const [returFilter, setReturFilter] = useState('semua');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [groupMode, setGroupMode] = useState(
    () => localStorage.getItem('simaaf_stok_groupby') || 'kategori'
  );
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [selectedProductKey, setSelectedProductKey] = useState(null);
  const [searchResultLayout, setSearchResultLayout] = useState('flat');

  const [rackFolders, setRackFolders] = useState(() =>
    readJsonStorage('simaaf_rack_folders', DEFAULT_RACK_FOLDERS)
  );
  const [batchFolderMap, setBatchFolderMap] = useState(() =>
    readJsonStorage('simaaf_batch_folder_map', {})
  );
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTone, setNewFolderTone] = useState('blue');

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchRes, distRes, oList] = await Promise.all([
        api.getBatches(),
        api.getDistributors(),
        api.getObatList(),
      ]);
      setAllBatches(batchRes.data || []);
      setDistributors(distRes || []);
      setObatList(oList || []);
    } catch (err) {
      console.error('Gagal mengambil data inventori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      setActiveFolderId(null);
      setSelectedProductKey(null);
    }
  }, [initialSearch]);

  const handleGroupModeChange = (mode) => {
    setGroupMode(mode);
    setActiveFolderId(null);
    setSelectedProductKey(null);
    try {
      localStorage.setItem('simaaf_stok_groupby', mode);
    } catch {
      // abaikan
    }
  };

  const handleResetFilter = () => {
    setSearch('');
    setDistributorFilter('');
    setRisikoFilter('semua');
    setReturFilter('semua');
    if (onClearInitialSearch) onClearInitialSearch();
  };

  const activeFilterCount =
    (distributorFilter ? 1 : 0) +
    (risikoFilter !== 'semua' ? 1 : 0) +
    (returFilter !== 'semua' ? 1 : 0);

  const isDeepFiltering = search.trim() !== '' || activeFilterCount > 0;

  const obatMap = useMemo(() => {
    const map = new Map();
    obatList.forEach((o) => map.set(Number(o.id), o));
    return map;
  }, [obatList]);

  // Menyaring seluruh batch di semua folder secara instan
  const filteredBatches = useMemo(() => {
    let list = allBatches;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          (b.nama_obat || '').toLowerCase().includes(q) ||
          (b.nomor_batch || '').toLowerCase().includes(q) ||
          (b.nama_distributor || '').toLowerCase().includes(q)
      );
    }
    if (distributorFilter) {
      list = list.filter((b) => String(b.distributor_id) === String(distributorFilter));
    }
    if (risikoFilter !== 'semua') {
      list = list.filter((b) => b.status_risiko === risikoFilter);
    }
    if (returFilter !== 'semua') {
      list = list.filter((b) => b.status_retur === returFilter);
    }
    return list;
  }, [allBatches, search, distributorFilter, risikoFilter, returFilter]);

  const batchesWithFolderMeta = useMemo(
    () =>
      filteredBatches.map((b) => {
        const meta = resolveBatchFolder(b, groupMode, obatMap, rackFolders, batchFolderMap);
        return { ...b, _folderId: meta.id, _folderName: meta.name };
      }),
    [filteredBatches, groupMode, obatMap, rackFolders, batchFolderMap]
  );

  // Membentuk folder ringkas dengan hitungan produk unik + total batch
  const folderSummaries = useMemo(() => {
    const folderMap = new Map();

    if (groupMode === 'rak' && !isDeepFiltering) {
      rackFolders.forEach((rf) => {
        folderMap.set(rf.id, {
          id: rf.id,
          name: rf.name,
          tone: rf.tone || 'blue',
          items: [],
          productKeys: new Set(),
          totalNilai: 0,
          totalUnit: 0,
          highRiskCount: 0,
          expiredReturCount: 0,
        });
      });
    }

    batchesWithFolderMeta.forEach((b) => {
      const fid = b._folderId;
      const meta = resolveBatchFolder(b, groupMode, obatMap, rackFolders, batchFolderMap);
      if (!folderMap.has(fid)) {
        folderMap.set(fid, {
          id: fid,
          name: meta.name,
          tone: meta.tone || 'blue',
          items: [],
          productKeys: new Set(),
          totalNilai: 0,
          totalUnit: 0,
          highRiskCount: 0,
          expiredReturCount: 0,
        });
      }
      const entry = folderMap.get(fid);
      entry.items.push(b);
      entry.productKeys.add(b.obat_id ? `obat:${b.obat_id}` : `nama:${(b.nama_obat || '').toLowerCase()}`);
      entry.totalNilai += b.nilai_total || 0;
      entry.totalUnit += b.jumlah_saat_ini || 0;
      if (b.status_risiko === 'tinggi') entry.highRiskCount += 1;
      if (b.status_retur === 'lewat_batas') entry.expiredReturCount += 1;
    });

    return Array.from(folderMap.values())
      .map((f) => ({ ...f, productCount: f.productKeys.size }))
      .sort((a, b) => {
        if (b.expiredReturCount !== a.expiredReturCount) return b.expiredReturCount - a.expiredReturCount;
        if (b.highRiskCount !== a.highRiskCount) return b.highRiskCount - a.highRiskCount;
        return b.items.length - a.items.length;
      });
  }, [batchesWithFolderMeta, groupMode, obatMap, rackFolders, batchFolderMap, isDeepFiltering]);

  const activeFolder = useMemo(
    () => folderSummaries.find((f) => f.id === activeFolderId) || null,
    [folderSummaries, activeFolderId]
  );

  // Semua produk dari seluruh batch atau folder aktif (untuk drill-down Level 2 & 3)
  const allProducts = useMemo(
    () => groupBatchesIntoProducts(batchesWithFolderMeta),
    [batchesWithFolderMeta]
  );

  const folderProducts = useMemo(
    () => (activeFolder ? groupBatchesIntoProducts(activeFolder.items) : []),
    [activeFolder]
  );

  const selectedProduct = useMemo(() => {
    if (!selectedProductKey) return null;
    const pool = activeFolder && !isDeepFiltering ? folderProducts : allProducts;
    return pool.find((p) => p.key === selectedProductKey) || null;
  }, [selectedProductKey, activeFolder, isDeepFiltering, folderProducts, allProducts]);

  const totalPortfolioNilai = useMemo(
    () => allBatches.reduce((sum, b) => sum + (b.nilai_total || 0), 0),
    [allBatches]
  );

  const handleMoveBatchToRack = (batchId, folderId) => {
    const next = { ...batchFolderMap, [String(batchId)]: folderId };
    setBatchFolderMap(next);
    try {
      localStorage.setItem('simaaf_batch_folder_map', JSON.stringify(next));
    } catch {
      // abaikan
    }
  };

  const handleCreateCustomFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const item = {
      id: `rak-${Date.now()}`,
      name: newFolderName.trim(),
      tone: newFolderTone,
    };
    const next = [...rackFolders, item];
    setRackFolders(next);
    try {
      localStorage.setItem('simaaf_rack_folders', JSON.stringify(next));
    } catch {
      // abaikan
    }
    setGroupMode('rak');
    setActiveFolderId(null);
    setSelectedProductKey(null);
    setNewFolderName('');
    setShowCreateFolderModal(false);
    setImportNotice({ type: 'success', text: `Folder rak "${item.name}" berhasil dibuat.` });
  };

  const handleExportExcel = () => {
    const source = activeFolder && !isDeepFiltering ? activeFolder.items : filteredBatches;
    if (source.length === 0) return;
    const headers = [
      'Folder',
      'Nama Obat',
      'Nomor Batch',
      'Distributor PBF',
      'Tgl Kedaluwarsa',
      'Batas Retur',
      'Stok Saat Ini',
      'Nilai Total (Rp)',
      'Status Retur',
    ];
    const rows = source.map((b) => [
      b._folderName || resolveBatchFolder(b, groupMode, obatMap, rackFolders, batchFolderMap).name,
      b.nama_obat,
      b.nomor_batch,
      b.nama_distributor || '-',
      b.tanggal_kedaluwarsa || '-',
      b.batas_retur || '-',
      b.jumlah_saat_ini ?? 0,
      b.nilai_total ?? 0,
      b.status_retur || '-',
    ]);
    exportToExcelCsv(
      `persediaan_batch_simaaf_${new Date().toISOString().split('T')[0]}.csv`,
      headers,
      rows
    );
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportNotice(null);
    try {
      const parsed = await parseUploadedDocument(file, obatList, distributors);
      const parsedItems = parsed.data?.items || [];
      if (parsedItems.length === 0) {
        setImportNotice({ type: 'error', text: 'Tidak ada baris batch yang dibaca.' });
        return;
      }
      const payload = parsedItems.map((it) => ({
        ...it,
        distributor_id: parsed.data?.distributor_id || distributors[0]?.id || 1,
        tanggal_masuk: new Date().toISOString().split('T')[0],
        keterangan: `Impor massal (${file.name})`,
      }));
      await api.simpanBatchList(payload);
      setImportNotice({
        type: 'success',
        text: `Berhasil mengimpor ${payload.length} batch dari "${file.name}".`,
      });
      await loadData();
    } catch (err) {
      setImportNotice({ type: 'error', text: err.message || 'Gagal mengimpor data berkas.' });
    } finally {
      setImporting(false);
      if (fileImportRef.current) fileImportRef.current.value = '';
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const groupModes = [
    { id: 'kategori', label: 'Kategori Obat' },
    { id: 'pbf', label: 'Distributor PBF' },
    { id: 'status', label: 'Kondisi Retur' },
    { id: 'abjad', label: 'Abjad A–Z' },
    { id: 'rak', label: 'Folder Rak' },
    { id: 'flat', label: 'Semua Produk' },
  ];

  // Merender daftar produk ringkas (Level 2 atau hasil filter lintas folder)
  const renderProductCollection = (products, { showFolderBadge = false } = {}) => {
    if (products.length === 0) {
      return (
        <div className="py-12 text-center text-xs text-slate-400">
          Tidak ada obat yang cocok dengan kriteria saat ini.
        </div>
      );
    }

    return (
      <>
        {/* Daftar Kartu Ringkas Mobile (1 Kartu = 1 Nama Obat + Ringkasan Batch FEFO) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {products.map((prod) => {
            const leadBatch = prod.batches[0];
            return (
              <button
                key={prod.key}
                type="button"
                data-testid={`product-row-${prod.key}`}
                onClick={() => setSelectedProductKey(prod.key)}
                className="w-full p-3.5 text-left hover:bg-slate-50 active:bg-slate-100/60 transition space-y-2 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {showFolderBadge && prod.folderName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold mb-1">
                        <Folder className="w-2.5 h-2.5 text-blue-600" />
                        <span className="truncate max-w-[180px]">{prod.folderName}</span>
                      </span>
                    )}
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug truncate">
                      {prod.nama_obat}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      <span className="font-semibold text-blue-700">
                        {prod.batches.length} batch
                      </span>{' '}
                      • ED terdekat {prod.earliestEd}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-950 tabular-nums block">
                        {formatRupiah(prod.totalNilai)}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 tabular-nums">
                        {prod.totalStok} unit
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {leadBatch && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusReturBadge
                      status={leadBatch.status_retur}
                      sisaHari={leadBatch.sisa_hari_retur}
                      batasRetur={leadBatch.batas_retur}
                    />
                    <StatusRisikoBadge status={leadBatch.status_risiko} skor={leadBatch.skor_risiko} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tabel Produk Desktop (Ramping 6 Kolom, Tanpa Horizontal Overflow) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <th className="py-3 px-4">Nama Obat</th>
                <th className="py-3 px-3">Distributor / Batch FEFO</th>
                <th className="py-3 px-3">Tenggat Terdekat</th>
                <th className="py-3 px-3 text-right">Total Stok &amp; Nilai</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Detail &amp; Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => {
                const leadBatch = prod.batches[0];
                return (
                  <tr
                    key={prod.key}
                    onClick={() => setSelectedProductKey(prod.key)}
                    className="hover:bg-blue-50/35 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 min-w-[180px]">
                      <p className="font-extrabold text-slate-900 leading-tight">{prod.nama_obat}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-bold text-blue-700">
                          {prod.batches.length} batch terdaftar
                        </span>
                        {showFolderBadge && prod.folderName && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            <Folder className="w-2.5 h-2.5 text-blue-600" />
                            {prod.folderName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-[190px]">
                      {leadBatch && (
                        <>
                          <p className="text-slate-700 font-medium truncate" title={leadBatch.nama_distributor}>
                            {leadBatch.nama_distributor}
                          </p>
                          <span className="font-mono text-[11px] text-slate-500">
                            FEFO: {leadBatch.nomor_batch}
                          </span>
                        </>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        {leadBatch?.batas_retur ? `Retur: ${leadBatch.batas_retur}` : 'Tanpa Retur'}
                      </span>
                      <span className="text-[11px] text-slate-500">ED: {prod.earliestEd}</span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap tabular-nums">
                      <span className="font-extrabold text-slate-950 block">
                        {formatRupiah(prod.totalNilai)}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700">
                        {prod.totalStok} unit
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {leadBatch && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusReturBadge
                            status={leadBatch.status_retur}
                            sisaHari={leadBatch.sisa_hari_retur}
                            batasRetur={leadBatch.batas_retur}
                          />
                          <StatusRisikoBadge
                            status={leadBatch.status_risiko}
                            skor={leadBatch.skor_risiko}
                          />
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-bold transition">
                        <span>Buka Batch</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Level 3 Sub-halaman Detail Produk & Urutan Batch FEFO
  if (selectedProduct) {
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelectedProductKey(null)}
              className="h-10 sm:h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            {onNavigateToFaktur && (
              <button
                type="button"
                onClick={onNavigateToFaktur}
                className="btn-primary h-10 sm:h-9 px-3.5 text-xs font-bold gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Batch</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                  <Folder className="w-3 h-3" />
                  {selectedProduct.folderName}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Urutan Prioritas FEFO (ED Terdekat Paling Atas)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                {selectedProduct.nama_obat}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block">Total Stok</span>
                <span className="text-sm font-black text-blue-700 tabular-nums">
                  {selectedProduct.totalStok} unit
                </span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block">Total Nilai</span>
                <span className="text-sm font-black text-slate-950 tabular-nums">
                  {formatRupiah(selectedProduct.totalNilai)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Seluruh Batch FEFO Obat Terpilih */}
        <div className="space-y-2.5">
          {selectedProduct.batches.map((b, idx) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/85 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        idx === 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx === 0 ? '#1 Keluar Dulu (FEFO)' : `Batch #${idx + 1}`}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {b.nomor_batch}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-1.5">
                    {b.nama_distributor}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-950 tabular-nums">
                    {formatRupiah(b.nilai_total)}
                  </p>
                  <p className="text-xs font-bold text-blue-700 tabular-nums">
                    Stok: {b.jumlah_saat_ini} (awal {b.jumlah_awal})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <StatusReturBadge status={b.status_retur} batasRetur={b.batas_retur} />
                <StatusRisikoBadge status={b.status_risiko} skor={b.skor_risiko} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tgl Masuk</span>
                  <strong className="text-slate-700 tabular-nums">{b.tanggal_masuk || '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tgl Kedaluwarsa</span>
                  <strong className="text-slate-900 tabular-nums">{b.tanggal_kedaluwarsa}</strong>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Batas Retur PBF</span>
                  <strong className="text-rose-700 tabular-nums">
                    {b.batas_retur || 'Tanpa Retur'}
                  </strong>
                </div>
              </div>

              {groupMode === 'rak' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Lokasi Folder Rak Apotek
                  </label>
                  <select
                    value={batchFolderMap[String(b.id)] || b._folderId}
                    onChange={(e) => handleMoveBatchToRack(b.id, e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                  >
                    {rackFolders.map((rf) => (
                      <option key={rf.id} value={rf.id}>
                        Rak: {rf.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectBatchForAdjustment && onSelectBatchForAdjustment(b)}
                  className="btn-primary h-11 min-h-[44px] flex-1 text-xs font-bold gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Cek Fisik &amp; Opname</span>
                </button>
                {onNavigateToPengingat && b.status_retur !== 'tidak_bisa_diretur' && (
                  <button
                    type="button"
                    onClick={() => onNavigateToPengingat(b.nomor_batch)}
                    className="btn-outline h-11 min-h-[44px] px-3.5 text-xs font-bold gap-1.5"
                  >
                    <BellRing className="w-4 h-4 text-rose-600" />
                    <span>Retur</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar Ramping & Hemat Tempat (Tidak Boros Ruang) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                Stok &amp; Folder Obat
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate tabular-nums">
                {allProducts.length} produk • {allBatches.length} batch • {formatRupiah(totalPortfolioNilai)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <input
              ref={fileImportRef}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls,.docx,.doc,.txt,.json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => setShowCreateFolderModal(true)}
              className="h-9 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 transition"
              title="Buat Folder Rak Kustom"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Folder</span>
            </button>
            <button
              type="button"
              onClick={() => fileImportRef.current?.click()}
              disabled={importing}
              className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 transition disabled:opacity-60"
              title="Impor Excel atau CSV"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{importing ? 'Impor...' : 'Impor'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredBatches.length === 0}
              className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 transition disabled:opacity-50"
              title="Ekspor ke Excel CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

        {importNotice && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
              importNotice.type === 'success'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {importNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{importNotice.text}</span>
          </div>
        )}

        {/* Bar Pencarian + Pilih Kelompok Folder + Tombol Filter Popover (1 Baris Padat!) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari obat / batch di semua folder..."
              className="w-full text-xs h-10 sm:h-9 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={groupMode}
            onChange={(e) => handleGroupModeChange(e.target.value)}
            aria-label="Kelompokkan folder berdasarkan"
            className="h-10 sm:h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-[11px] sm:text-xs font-bold text-slate-700 shrink-0 max-w-[125px] sm:max-w-none"
          >
            {groupModes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            data-testid="stok-filter-btn"
            onClick={() => setShowFilterModal(true)}
            className={`h-10 sm:h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition shrink-0 ${
              activeFilterCount > 0
                ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            aria-label="Buka filter lanjutan"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-white text-blue-700 text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Strip Chip Aktif Mini (Hanya muncul bila ada filter aktif) */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {distributorFilter && (
              <button
                type="button"
                onClick={() => setDistributorFilter('')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold"
              >
                <span>
                  PBF:{' '}
                  {distributors.find((d) => String(d.id) === String(distributorFilter))?.kode ||
                    'Dipilih'}
                </span>
                <X className="w-3 h-3" />
              </button>
            )}
            {risikoFilter !== 'semua' && (
              <button
                type="button"
                onClick={() => setRisikoFilter('semua')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold"
              >
                <span>Risiko: {risikoFilter}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {returFilter !== 'semua' && (
              <button
                type="button"
                onClick={() => setReturFilter('semua')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold"
              >
                <span>Retur: {returFilter.replace('_', ' ')}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilter}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-900 px-1.5 py-1"
            >
              Reset semua
            </button>
          </div>
        )}
      </div>

      {/* Konten Utama: Level 1 Folder -> Level 2 Produk -> atau Hasil Filter Menembus Folder */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 py-12 text-center text-xs text-slate-400">
          Memuat folder &amp; persediaan obat...
        </div>
      ) : groupMode === 'flat' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {renderProductCollection(allProducts, { showFolderBadge: false })}
        </div>
      ) : isDeepFiltering ? (
        /* Filter & Search Menyusup ke Semua Folder */
        <div className="space-y-3">
          <div className="px-3.5 py-2.5 rounded-2xl bg-blue-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-950 font-semibold">
              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Menembus <strong>{folderSummaries.length} folder</strong> — ditemukan{' '}
                <strong>{allProducts.length} produk</strong> ({filteredBatches.length} batch)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchResultLayout('flat')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  searchResultLayout === 'flat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-blue-200'
                }`}
              >
                Daftar Langsung
              </button>
              <button
                type="button"
                onClick={() => setSearchResultLayout('grouped')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  searchResultLayout === 'grouped'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-blue-200'
                }`}
              >
                Per Folder
              </button>
            </div>
          </div>

          {allProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 py-12 text-center text-xs text-slate-400">
              Tidak ada obat yang cocok di seluruh folder.
            </div>
          ) : searchResultLayout === 'grouped' ? (
            <div className="space-y-3">
              {folderSummaries.map((folder) => {
                const iconStyle = FOLDER_TONE_STYLES[folder.tone] || FOLDER_TONE_STYLES.blue;
                const prods = groupBatchesIntoProducts(folder.items);
                return (
                  <section
                    key={folder.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconStyle}`}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {folder.name} ({prods.length} produk)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleResetFilter();
                          setActiveFolderId(folder.id);
                        }}
                        className="text-[11px] font-bold text-blue-700 hover:underline shrink-0"
                      >
                        Buka Folder →
                      </button>
                    </div>
                    {renderProductCollection(prods, { showFolderBadge: false })}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              {renderProductCollection(allProducts, { showFolderBadge: true })}
            </div>
          )}
        </div>
      ) : activeFolder ? (
        /* Level 2: Produk Obat di Dalam Folder Terpilih */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="px-3.5 sm:px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                data-testid="folder-back-btn"
                onClick={() => setActiveFolderId(null)}
                className="h-9 px-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Folder</span>
              </button>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-950 truncate flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{activeFolder.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {folderProducts.length} produk • {activeFolder.items.length} batch •{' '}
                  <strong className="text-slate-800">{formatRupiah(activeFolder.totalNilai)}</strong>
                </p>
              </div>
            </div>
          </div>

          {renderProductCollection(folderProducts, { showFolderBadge: false })}
        </div>
      ) : (
        /* Level 1: Grid Folder Bersih & Ringan */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {folderSummaries.map((folder) => {
            const iconStyle = FOLDER_TONE_STYLES[folder.tone] || FOLDER_TONE_STYLES.blue;
            return (
              <button
                key={folder.id}
                type="button"
                data-testid={`stok-folder-${folder.id}`}
                onClick={() => setActiveFolderId(folder.id)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-3.5 sm:p-4 shadow-2xs hover:shadow-sm transition-all text-left flex flex-col justify-between gap-2.5 active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconStyle}`}
                    >
                      <Folder className="w-5 h-5" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug line-clamp-1">
                        {folder.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {folder.productCount} produk • {folder.items.length} batch • {folder.totalUnit} unit
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-1" />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {folder.expiredReturCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {folder.expiredReturCount} lewat batas
                      </span>
                    )}
                    {folder.highRiskCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {folder.highRiskCount} risiko
                      </span>
                    )}
                    {folder.expiredReturCount === 0 && folder.highRiskCount === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        {folder.items.length === 0 ? 'Rak kosong' : 'Aman'}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-extrabold text-slate-950 tabular-nums shrink-0">
                    {formatRupiah(folder.totalNilai)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Sheet / Modal Filter Lanjutan (Hemat Ruang di Layar Utama) */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filter &amp; Pengelompokan Lintas Folder</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kelompokkan Folder Menurut
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {groupModes.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleGroupModeChange(m.id)}
                      className={`h-10 px-3 rounded-xl text-xs font-bold border text-left transition ${
                        groupMode === m.id
                          ? 'bg-blue-50 border-blue-400 text-blue-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Distributor (PBF)
                </label>
                <select
                  value={distributorFilter}
                  onChange={(e) => setDistributorFilter(e.target.value)}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="">Semua Distributor ({distributors.length} PBF)</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tingkat Risiko</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'semua', label: 'Semua' },
                    { id: 'tinggi', label: 'Tinggi' },
                    { id: 'sedang', label: 'Sedang' },
                    { id: 'rendah', label: 'Aman' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setRisikoFilter(pill.id)}
                      className={`h-10 rounded-xl text-xs font-bold transition ${
                        risikoFilter === pill.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Retur PBF</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'semua', label: 'Semua Status' },
                    { id: 'bisa_diretur', label: 'Bisa Diretur' },
                    { id: 'lewat_batas', label: 'Lewat Batas' },
                    { id: 'tidak_bisa_diretur', label: 'Tanpa Retur' },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setReturFilter(pill.id)}
                      className={`h-10 rounded-xl text-xs font-bold transition ${
                        returFilter === pill.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleResetFilter();
                  setShowFilterModal(false);
                }}
                className="btn-outline h-11 px-4 text-xs font-bold"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="btn-primary h-11 flex-1 text-xs font-bold justify-center"
              >
                Terapkan ({filteredBatches.length} batch)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Folder Rak Kustom */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-600" />
                <span>Buat Folder Rak Baru</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Folder / Lokasi Rak
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mis. Kulkas Vaksin / Etalase B"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warna Label</label>
                <select
                  value={newFolderTone}
                  onChange={(e) => setNewFolderTone(e.target.value)}
                  className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="blue">Biru</option>
                  <option value="teal">Teal / Hijau Laut</option>
                  <option value="amber">Amber / Kuning</option>
                  <option value="rose">Merah Muda / Prioritas</option>
                  <option value="violet">Ungu</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="btn-outline h-10 px-3.5 text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary h-10 px-4 text-xs font-bold">
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
