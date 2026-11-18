import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Camera
} from 'lucide-react';

export function FakturInputPage({ onBatchSaved }) {
  const [distributors, setDistributors] = useState([]);
  const [obatList, setObatList] = useState([]);
  
  // State unggah dokumen dan pemrosesan faktur
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  // State form hasil koreksi
  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [items, setItems] = useState([]);
  const [tanggalMasuk, setTanggalMasuk] = useState('2026-10-31');
  const [catatan, setCatatan] = useState('');
  
  // Notifikasi
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    try {
      const [dList, oList] = await Promise.all([
        api.getDistributors(),
        api.getObatList()
      ]);
      setDistributors(dList);
      setObatList(oList);
      if (dList.length > 0) setSelectedDistributorId(dList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);

    const url = URL.createObjectURL(file);
    setPreviewImage(url);

    try {
      const res = await api.ekstrakFakturFoto(file);
      setExtractionResult(res.data);
      setSelectedDistributorId(res.data.distributor_id);
      setItems(res.data.items);
      setCatatan(`Faktur No: ${res.data.nomor_faktur}`);
    } catch (e) {
      setErrorMsg('Gagal membaca berkas faktur. Silakan masukkan data manual lewat tabel di bawah.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateDummyInvoice = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);
    setPreviewImage('dummy');

    try {
      const res = await api.ekstrakFakturFoto(null);
      setExtractionResult(res.data);
      setSelectedDistributorId(res.data.distributor_id);
      setItems(res.data.items);
      setCatatan(`Faktur Demo: ${res.data.nomor_faktur}`);
    } catch (e) {
      setErrorMsg('Terjadi kendala saat simulasi.');
    } finally {
      setIsProcessing(false);
    }
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
        satuan: defaultObat.satuan || 'box'
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveBatches = async () => {
    if (items.length === 0) {
      setErrorMsg('Tabel item obat masih kosong. Tambahkan minimal 1 obat.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.nomor_batch || !it.tanggal_kedaluwarsa || !it.jumlah || it.jumlah <= 0) {
        setErrorMsg(`Baris ke-${i + 1}: Nomor batch, tanggal exp, dan jumlah (>0) wajib diisi.`);
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
        keterangan: catatan
      }));

      await api.simpanBatchList(payload);
      setSuccessMsg(`Berhasil mendaftarkan ${items.length} batch obat ke inventori!`);
      setItems([]);
      setPreviewImage(null);
      setExtractionResult(null);
      if (onBatchSaved) onBatchSaved();
    } catch (e) {
      setErrorMsg(e.message || 'Gagal menyimpan batch.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
            Input Cepat Inventori
          </span>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Penerimaan Obat & Pemindaian Faktur
          </h2>
          <p className="text-xs text-slate-500">
            Unggah foto lembaran faktur distributor untuk pembacaan otomatis nomor batch dan tanggal kedaluwarsa.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulateDummyInvoice}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-xs font-bold transition shrink-0 active:scale-95 shadow-sm"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Contoh Pemindaian Faktur</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-blue-800 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      <div className="premium-card p-4 space-y-3">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
          1. Unggah Foto Lembaran Faktur Fisik
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-center flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <UploadCloud className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Unggah Berkas atau Ambil Foto Faktur Fisik
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Format JPG, PNG, atau WEBP (Maksimal 5 MB)
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 mt-3 w-full sm:w-auto">
                <label className="btn-outline h-11 min-h-[44px] px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-700 w-full sm:w-auto">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Pilih dari Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                </label>
                <label className="btn-primary h-11 min-h-[44px] px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-white w-full sm:w-auto">
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto Kamera HP</span>
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
          </div>

          {/* Status Pemrosesan Dokumen */}
          <div className="h-full min-h-[130px] rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col items-center justify-center text-center">
            {isProcessing ? (
              <div className="space-y-2">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-800">Memindai dokumen faktur...</p>
                <p className="text-[10px] text-slate-400">Mengekstrak nomor batch, tanggal ED, dan harga beli</p>
              </div>
            ) : previewImage ? (
              <div className="space-y-1.5 text-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-blue-700 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-extrabold text-slate-900">Ekstraksi Selesai!</p>
                <p className="text-[10px] text-slate-500">Silakan tinjau tabel koreksi di bawah.</p>
              </div>
            ) : (
              <div className="text-slate-400 space-y-1">
                <ImageIcon className="w-7 h-7 mx-auto opacity-50" />
                <p className="text-xs font-medium">Belum ada foto yang dipindai</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="premium-card p-4 space-y-3.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
          2. Pengaturan Distributor & Tanggal Masuk
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Distributor (PBF)
            </label>
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama} ({d.aturan_retur_bulan ? `Retur H-${d.aturan_retur_bulan} bln` : 'Tanpa retur'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal Penerimaan Apotek
            </label>
            <input
              type="date"
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Faktur / Keterangan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: FAK-2026/10/089"
              className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
              3. Tinjau Rincian Obat
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              Daftar Batch Obat yang Akan Didaftarkan
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] sm:min-h-0 h-11 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Baris Manual</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Belum ada obat yang dimasukkan. Silakan unggah foto faktur atau klik <strong>Tambah Baris Manual</strong>.
          </div>
        ) : (
          <>
            {/* Mobile / Tablet Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                      Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                      title="Hapus Baris"
                      aria-label={`Hapus baris obat item ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
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
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                        Nomor Batch
                      </label>
                      <input
                        type="text"
                        value={item.nomor_batch}
                        onChange={(e) => updateItem(idx, 'nomor_batch', e.target.value)}
                        placeholder="BMX2610A"
                        className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                        Tgl Kedaluwarsa
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
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                        Jumlah
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.jumlah}
                        onChange={(e) => updateItem(idx, 'jumlah', e.target.value)}
                        className="w-full text-xs h-11 px-3 rounded-xl border border-slate-200 text-center font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                        Harga Satuan (Rp)
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

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Nama Obat</th>
                    <th className="py-3 px-4">Nomor Batch</th>
                    <th className="py-3 px-4">Tgl Kedaluwarsa</th>
                    <th className="py-3 px-4">Jumlah</th>
                    <th className="py-3 px-4">Harga Beli Satuan (Rp)</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
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
                          placeholder="BMX2610A"
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-2.5 px-4">
                        <input
                          type="date"
                          value={item.tanggal_kedaluwarsa}
                          onChange={(e) => updateItem(idx, 'tanggal_kedaluwarsa', e.target.value)}
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        />
                      </td>

                      <td className="py-2.5 px-4 w-28">
                        <input
                          type="number"
                          min="1"
                          value={item.jumlah}
                          onChange={(e) => updateItem(idx, 'jumlah', e.target.value)}
                          className="w-full text-xs h-9 px-2.5 rounded-xl border border-slate-200 text-center font-black focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <span className="text-xs font-bold text-slate-600">
              {items.length} item obat siap didaftarkan ke inventori
            </span>
            <button
              type="button"
              onClick={handleSaveBatches}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-60 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{isProcessing ? 'Menyimpan...' : 'Konfirmasi & Simpan ke Inventori'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
