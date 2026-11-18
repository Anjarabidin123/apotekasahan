import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  getAiConfig,
  saveAiConfig,
  parseUploadedDocument,
  downloadTemplateFakturCsv,
  exportToExcelCsv,
} from '../utils/fileTools';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Camera,
  KeyRound,
  Download,
  FileSpreadsheet,
  Sparkles,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

export function FakturInputPage({ onBatchSaved }) {
  const [distributors, setDistributors] = useState([]);
  const [obatList, setObatList] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionInfo, setExtractionInfo] = useState(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [items, setItems] = useState([]);
  const [tanggalMasuk, setTanggalMasuk] = useState('2026-10-31');
  const [catatan, setCatatan] = useState('');

  // Konfigurasi token API AI opsional untuk pembacaan faktur/dokumen akurat
  const [aiConfig, setAiConfig] = useState(() => getAiConfig());
  const [showAiModal, setShowAiModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadMasters();
  }, []);

  /**
   * Mengambil daftar master distributor PBF dan daftar obat apotek.
   */
  const loadMasters = async () => {
    try {
      const [dList, oList] = await Promise.all([
        api.getDistributors(),
        api.getObatList(),
      ]);
      setDistributors(dList);
      setObatList(oList);
      if (dList.length > 0) setSelectedDistributorId(dList[0].id);
    } catch (e) {
      console.error('Gagal memuat master data:', e);
    }
  };

  /**
   * Memproses unggahan berkas foto faktur, Excel/CSV, atau Word/dokumen.
   */
  const handleFileUpload = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);

    try {
      const res = await parseUploadedDocument(file, obatList, distributors);
      setExtractionInfo({
        fileName: file.name,
        metode: res.metode,
        pesan: res.pesan,
      });
      if (res.data?.distributor_id) {
        setSelectedDistributorId(res.data.distributor_id);
      }
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      if (res.data?.nomor_faktur) {
        setCatatan(`Faktur No: ${res.data.nomor_faktur}`);
      }
    } catch (e) {
      setErrorMsg(
        e.message || 'Gagal membaca berkas. Silakan gunakan templat CSV atau tambah baris manual.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateDummyInvoice = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);
    try {
      const res = await api.ekstrakFakturFoto(null);
      setExtractionInfo({
        fileName: 'Contoh_Faktur_PBF.jpg',
        metode: 'Simulasi Contoh Lokal',
        pesan: 'Data contoh berhasil dimuat ke tabel koreksi.',
      });
      setSelectedDistributorId(res.data.distributor_id);
      setItems(res.data.items);
      setCatatan(`Faktur Demo: ${res.data.nomor_faktur}`);
    } catch {
      setErrorMsg('Terjadi kendala saat memuat contoh faktur.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAiToken = (e) => {
    e.preventDefault();
    const saved = saveAiConfig(aiConfig);
    setAiConfig(saved);
    setShowAiModal(false);
    setSuccessMsg(
      saved.apiKey
        ? `Token ${saved.provider.toUpperCase()} (${saved.model}) aktif untuk ekstraksi dokumen & foto.`
        : 'Token AI dikosongkan. Sistem beralih ke parser berkas lokal.'
    );
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'obat_id') {
      const selected = obatList.find((o) => o.id === Number(value));
      if (selected) {
        updated[index].nama_obat = selected.nama;
        updated[index].satuan = selected.satuan;
      }
    }
    setItems(updated);
  };

  const handleAddRow = () => {
    const defaultObat = obatList[0] || { id: 1, nama: 'Obat Baru', satuan: 'box' };
    setItems([
      ...items,
      {
        obat_id: defaultObat.id,
        nama_obat: defaultObat.nama,
        nomor_batch: 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
        tanggal_kedaluwarsa: '2027-10-01',
        jumlah: 10,
        harga_beli_satuan: 25000,
        satuan: defaultObat.satuan || 'box',
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleExportDraftCsv = () => {
    if (items.length === 0) return;
    const headers = [
      'Nama Obat',
      'Nomor Batch',
      'Tanggal Kedaluwarsa',
      'Jumlah',
      'Harga Beli Satuan',
      'Satuan',
    ];
    const rows = items.map((it) => [
      it.nama_obat,
      it.nomor_batch,
      it.tanggal_kedaluwarsa,
      it.jumlah,
      it.harga_beli_satuan,
      it.satuan || 'box',
    ]);
    exportToExcelCsv(`draft_faktur_${tanggalMasuk}.csv`, headers, rows);
  };

  const handleSaveBatches = async () => {
    if (items.length === 0) {
      setErrorMsg('Tabel item obat masih kosong. Tambahkan minimal 1 obat.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.nomor_batch || !it.tanggal_kedaluwarsa || !it.jumlah || it.jumlah <= 0) {
        setErrorMsg(
          `Baris ke-${i + 1}: Nomor batch, tanggal kedaluwarsa, dan jumlah (>0) wajib diisi.`
        );
        return;
      }
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      const payload = items.map((it) => ({
        ...it,
        distributor_id: selectedDistributorId,
        tanggal_masuk: tanggalMasuk,
        keterangan: catatan,
      }));

      await api.simpanBatchList(payload);
      setSuccessMsg(`Berhasil mendaftarkan ${items.length} batch obat ke inventori!`);
      setItems([]);
      setExtractionInfo(null);
      if (onBatchSaved) onBatchSaved();
    } catch (e) {
      setErrorMsg(e.message || 'Gagal menyimpan batch.');
    } finally {
      setIsProcessing(false);
    }
  };

  const hasAiToken = Boolean(aiConfig.apiKey);

  return (
    <div className="space-y-4">
      {/* Bilah Alat & Status Token AI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Penerimaan & Impor Faktur Obat
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  hasAiToken
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {hasAiToken ? `Token AI Aktif (${aiConfig.provider.toUpperCase()})` : 'Mode Lokal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dukung foto faktur, Excel (.csv/.xlsx), Word (.docx), atau berkas teks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>Atur Token AI</span>
          </button>

          <button
            type="button"
            onClick={downloadTemplateFakturCsv}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Template CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateDummyInvoice}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold transition disabled:opacity-60"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Contoh Faktur</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Area Unggah Multi-Format */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Unggah Foto, Excel/CSV, atau Dokumen Word
          </h3>
          <span className="text-[11px] text-slate-400">
            JPG, PNG, CSV, XLSX, DOCX, TXT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
          <div className="md:col-span-2 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-center flex flex-col items-center justify-center bg-slate-50/60 hover:bg-blue-50/30 transition">
            <div className="w-11 h-11 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center mb-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Pilih Berkas Faktur atau Daftar Obat
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Otomatis membaca tabel CSV/Excel, teks Word (.docx), atau OCR foto
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 mt-3.5 w-full sm:w-auto">
              <label className="btn-outline h-11 min-h-[44px] px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-700 w-full sm:w-auto">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Pilih File / Dokumen</span>
                <input
                  type="file"
                  accept="image/*,.csv,.tsv,.xlsx,.xls,.docx,.doc,.txt,.json"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
              </label>

              <label className="btn-primary h-11 min-h-[44px] px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-white w-full sm:w-auto">
                <Camera className="w-4 h-4" />
                <span>Kamera Faktur</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="min-h-[130px] rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 flex flex-col items-center justify-center text-center">
            {isProcessing ? (
              <div className="space-y-2">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-800">Memproses berkas...</p>
                <p className="text-[11px] text-slate-500">
                  Mengekstrak item obat, nomor batch, & tanggal ED
                </p>
              </div>
            ) : extractionInfo ? (
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                  {extractionInfo.fileName}
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                  {extractionInfo.metode}
                </span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {extractionInfo.pesan}
                </p>
              </div>
            ) : (
              <div className="text-slate-400 space-y-1.5">
                <ImageIcon className="w-7 h-7 mx-auto opacity-60" />
                <p className="text-xs font-medium text-slate-500">Belum ada berkas diunggah</p>
                <p className="text-[11px] text-slate-400">
                  Bisa juga langsung isi baris secara manual di bawah
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Identitas Distributor & Tanggal Penerimaan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Informasi Distributor & Tanggal Masuk
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Distributor (PBF)
            </label>
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="w-full text-xs h-11 sm:h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama} ({d.aturan_retur_bulan ? `Retur H-${d.aturan_retur_bulan} bln` : 'Tanpa retur'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Penerimaan
            </label>
            <input
              type="date"
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className="w-full text-xs h-11 sm:h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Faktur / Catatan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: FAK-2026/10/089"
              className="w-full text-xs h-11 sm:h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Tabel Koreksi Rincian Batch Obat */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Batch Obat ({items.length} Item)
            </h3>
            <p className="text-[11px] text-slate-500">
              Periksa kembali nomor batch, tanggal kedaluwarsa, dan jumlah sebelum disimpan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleExportDraftCsv}
                className="inline-flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Ekspor Draft CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Baris</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Belum ada item obat. Unggah berkas atau klik <strong>Tambah Baris</strong>.
          </div>
        ) : (
          <>
            {/* Tampilan Kartu Mobile */}
            <div className="block md:hidden divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                      Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      aria-label={`Hapus item ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Nama Obat
                    </label>
                    <select
                      value={item.obat_id}
                      onChange={(e) => updateItem(idx, 'obat_id', e.target.value)}
                      className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {obatList.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nama} ({o.satuan})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Nomor Batch
                      </label>
                      <input
                        type="text"
                        value={item.nomor_batch}
                        onChange={(e) => updateItem(idx, 'nomor_batch', e.target.value)}
                        className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Tanggal ED
                      </label>
                      <input
                        type="date"
                        value={item.tanggal_kedaluwarsa}
                        onChange={(e) => updateItem(idx, 'tanggal_kedaluwarsa', e.target.value)}
                        className="w-full text-xs h-11 px-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Jumlah
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.jumlah}
                        onChange={(e) => updateItem(idx, 'jumlah', e.target.value)}
                        className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Harga Beli (Rp)
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={item.harga_beli_satuan}
                        onChange={(e) => updateItem(idx, 'harga_beli_satuan', e.target.value)}
                        className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 text-right font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tampilan Tabel Desktop */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold text-[11px]">
                    <th className="py-3 px-4">Nama Obat</th>
                    <th className="py-3 px-4">Nomor Batch</th>
                    <th className="py-3 px-4">Tgl Kedaluwarsa</th>
                    <th className="py-3 px-4">Jumlah</th>
                    <th className="py-3 px-4">Harga Beli (Rp)</th>
                    <th className="py-3 px-4 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-4">
                        <select
                          value={item.obat_id}
                          onChange={(e) => updateItem(idx, 'obat_id', e.target.value)}
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                        >
                          {obatList.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nama} ({o.satuan})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={item.nomor_batch}
                          onChange={(e) => updateItem(idx, 'nomor_batch', e.target.value)}
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="date"
                          value={item.tanggal_kedaluwarsa}
                          onChange={(e) => updateItem(idx, 'tanggal_kedaluwarsa', e.target.value)}
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 w-28">
                        <input
                          type="number"
                          min="1"
                          value={item.jumlah}
                          onChange={(e) => updateItem(idx, 'jumlah', e.target.value)}
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 w-40">
                        <input
                          type="number"
                          step="500"
                          value={item.harga_beli_satuan}
                          onChange={(e) => updateItem(idx, 'harga_beli_satuan', e.target.value)}
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 text-right font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {items.length > 0 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600">
              {items.length} batch obat siap disimpan ke inventori
            </span>
            <button
              type="button"
              onClick={handleSaveBatches}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-600/20 active:scale-95 disabled:opacity-60 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{isProcessing ? 'Menyimpan...' : 'Simpan ke Inventori'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Konfigurasi Token API Key AI */}
      {showAiModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Token AI Pembaca Dokumen</h3>
                  <p className="text-[11px] text-slate-500">Opsional, tersimpan di browser Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAiToken} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penyedia Layanan AI
                </label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) =>
                    setAiConfig({
                      ...aiConfig,
                      provider: e.target.value,
                      model: e.target.value === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash',
                    })
                  }
                  className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="gemini">Google Gemini (Disarankan untuk Vision)</option>
                  <option value="openai">OpenAI GPT (gpt-4o / gpt-4o-mini)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Model
                </label>
                <input
                  type="text"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  placeholder="gemini-2.5-flash"
                  className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key / Token AI
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    placeholder="Tempel API key Gemini atau OpenAI di sini..."
                    className="w-full text-xs h-10 pl-3 pr-10 rounded-xl border border-slate-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kosongkan token jika hanya ingin memakai parser CSV/Excel/Word lokal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="btn-outline h-10 px-4"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary h-10 px-4">
                  Simpan Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
