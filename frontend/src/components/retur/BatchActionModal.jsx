import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Trash2, Tag, FileText, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { api } from '../../services/api';

export function BatchActionModal({
  isOpen,
  mode, // 'retur' | 'prioritas_jual' | 'dibuang'
  batch,
  petugasNama = 'Petugas Apotek',
  onClose,
  onSuccess,
  onOpenBap,
}) {
  const maxQty = Math.max(0, Number(batch?.jumlah_saat_ini) || 0);
  const [qty, setQty] = useState(maxQty);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !batch) return;
    setError('');
    if (mode === 'prioritas_jual') {
      setQty(0);
      setNote(batch.prioritas_jual ? 'Penjualan prioritas rak depan' : '');
    } else if (mode === 'dibuang') {
      setQty(maxQty);
      setNote('Obat kedaluwarsa dan sudah melewati batas retur PBF');
    } else {
      setQty(maxQty);
      setNote(`Retur ke ${batch.nama_distributor || 'PBF'}`);
    }
  }, [isOpen, mode, batch, maxQty]);

  if (!isOpen || !batch) return null;

  const title =
    mode === 'dibuang'
      ? 'Catat Obat Dibuang'
      : mode === 'prioritas_jual'
      ? 'Prioritas Jual (Lewat Batas Retur)'
      : 'Konfirmasi & Catat Retur PBF';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const numericQty = Number(qty);

    if (mode !== 'prioritas_jual' && (!Number.isFinite(numericQty) || numericQty <= 0)) {
      setError('Jumlah harus lebih dari 0 unit.');
      return;
    }
    if (numericQty < 0 || numericQty > maxQty) {
      setError(`Jumlah tidak boleh melebihi stok tersedia (${maxQty} unit).`);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'retur') {
        await api.catatReturBatch(
          [{ batchId: batch.id, jumlahRetur: numericQty }],
          note,
          petugasNama
        );
        if (onSuccess) {
          await onSuccess(
            `Retur ${numericQty} unit ${batch.nama_obat} (${batch.nomor_batch}) berhasil dicatat.`
          );
        }
      } else if (mode === 'dibuang') {
        await api.catatDibuangBatch(batch.id, numericQty, note, petugasNama);
        if (onSuccess) {
          await onSuccess(
            `Pembuangan ${numericQty} unit ${batch.nama_obat} (${batch.nomor_batch}) dicatat.`
          );
        }
      } else {
        await api.tandaiPrioritasJual(batch.id, numericQty, note, petugasNama);
        const msg =
          numericQty > 0
            ? `${batch.nama_obat} (${batch.nomor_batch}) ditandai Prioritas Jual dan ${numericQty} unit terjual dicatat.`
            : `${batch.nama_obat} (${batch.nomor_batch}) ditandai sebagai Prioritas Jual di rak.`;
        if (onSuccess) await onSuccess(msg);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memproses pencatatan batch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                mode === 'dibuang'
                  ? 'bg-rose-50 text-rose-600'
                  : mode === 'prioritas_jual'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {mode === 'dibuang' ? (
                <Trash2 className="w-4 h-4" />
              ) : mode === 'prioritas_jual' ? (
                <Tag className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 truncate">{title}</h3>
              <p className="text-[11px] text-slate-500 truncate">
                {batch.nama_obat} • {batch.nomor_batch}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Distributor</span>
              <span className="font-bold text-slate-800 truncate">{batch.nama_distributor}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Stok Tersedia</span>
              <span className="font-extrabold text-slate-950 tabular-nums">{maxQty} unit</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Estimasi Nilai</span>
              <span className="font-extrabold text-emerald-700 tabular-nums">
                {formatRupiah((Number(qty) || 0) * (batch.harga_beli_satuan || 0))}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {mode === 'dibuang'
                ? 'Jumlah Unit Dibuang'
                : mode === 'prioritas_jual'
                ? 'Unit Terjual Sekarang (Opsional, 0 jika hanya menandai)'
                : 'Jumlah Unit Diretur'}
            </label>
            <input
              type="number"
              min={mode === 'prioritas_jual' ? 0 : 1}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {mode === 'dibuang' ? 'Alasan Pemusnahan' : 'Catatan Pencatatan'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === 'prioritas_jual'
                  ? 'Mis. Letakkan di etalase promo FEFO'
                  : 'Tambahkan keterangan singkat...'
              }
              className="w-full h-10 px-3 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
            {mode === 'retur' && onOpenBap && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBap(batch);
                }}
                className="btn-outline h-10 px-3 text-xs font-bold mr-auto"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dokumen BAP</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-outline h-10 px-3.5 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`h-10 px-4 rounded-xl text-white text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer ${
                mode === 'dibuang'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : mode === 'prioritas_jual'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting
                ? 'Menyimpan...'
                : mode === 'dibuang'
                ? 'Simpan Catat Dibuang'
                : mode === 'prioritas_jual'
                ? 'Simpan Prioritas Jual'
                : 'Konfirmasi & Catat Retur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
