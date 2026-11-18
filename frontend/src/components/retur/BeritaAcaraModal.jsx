import React from 'react';
import { FileText, Printer, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

export function BeritaAcaraModal({ isOpen, batches, apotekProfile, onClose }) {
  if (!isOpen) return null;

  const totalNilai = batches.reduce(
    (acc, curr) => acc + (curr.nilai_total || curr.nilai || 0),
    0
  );

  return (
    <div
      data-testid="bap-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Berita Acara Pengembalian (BAP) Obat
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Dokumen resmi pengajuan retur PBF</p>
          </div>
          <button
            type="button"
            data-testid="bap-modal-close"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Tutup dialog BAP"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 text-xs flex-1">
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-950 tracking-tight uppercase">
              {apotekProfile?.nama_apotek || 'APOTEK ASAHAN FARMA'}
            </h2>
            <p className="text-slate-600 text-[11px] font-medium">
              {apotekProfile?.alamat || 'Jl. Imam Bonjol No.331, Kisaran Timur, Kab. Asahan, Sumatera Utara'}
            </p>
            <p className="text-slate-400 text-[10px] font-mono">
              NIB: {apotekProfile?.nib || '1210210063257'} • SIA: {apotekProfile?.sia || '503/SIA/042/DPMPTSP/2021'} • APJ: {apotekProfile?.apoteker_pj || 'apt. Nurul Hasanah, S.Farm'}
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              BERITA ACARA PENGEMBALIAN BATCH OBAT (BAP)
            </h4>
            <p className="text-slate-500 text-[11px]">
              Diterbitkan pada tanggal{' '}
              <strong>
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>{' '}
              untuk pengembalian produk obat mendekati kedaluwarsa sesuai klausul retur PBF distributor rekanan.
            </p>
          </div>

          <div className="sm:hidden print:hidden border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {batches.map((b, idx) => (
              <div key={b.id || idx} className="p-3 bg-white space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 leading-snug">
                      {idx + 1}. {b.nama_obat}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      <span className="font-mono">{b.nomor_batch || b.no_batch}</span> • {b.nama_distributor || b.pbf}
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-900 tabular-nums shrink-0">
                    {formatRupiah(b.nilai_total || b.nilai)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-rose-600 font-semibold whitespace-nowrap">
                    ED: {b.tanggal_kedaluwarsa || b.ed}
                  </span>
                  <span className="font-bold text-slate-700">
                    {b.jumlah_saat_ini || b.stok} unit
                  </span>
                </div>
              </div>
            ))}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between font-extrabold">
              <span className="text-slate-700">Total Pengajuan Retur</span>
              <span className="text-blue-700 tabular-nums">{formatRupiah(totalNilai)}</span>
            </div>
          </div>

          <div className="hidden sm:block print:block border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-2 px-3">No</th>
                  <th className="py-2 px-3">Nama Obat</th>
                  <th className="py-2 px-3">No. Batch</th>
                  <th className="py-2 px-3">Distributor</th>
                  <th className="py-2 px-3">ED</th>
                  <th className="py-2 px-3 text-center">Unit</th>
                  <th className="py-2 px-3 text-right">Nilai Estimasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b, idx) => (
                  <tr key={b.id || idx}>
                    <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{b.nama_obat}</td>
                    <td className="py-2 px-3 font-mono">{b.nomor_batch || b.no_batch}</td>
                    <td className="py-2 px-3 text-slate-600">{b.nama_distributor || b.pbf}</td>
                    <td className="py-2 px-3 text-rose-600 font-medium whitespace-nowrap">
                      {b.tanggal_kedaluwarsa || b.ed}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {b.jumlah_saat_ini || b.stok}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(b.nilai_total || b.nilai)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-extrabold">
                <tr>
                  <td colSpan={6} className="py-2 px-3 text-right">Total Nilai Pengajuan Retur:</td>
                  <td className="py-2 px-3 text-right text-blue-700 whitespace-nowrap">
                    {formatRupiah(totalNilai)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 text-center text-[11px] sm:text-xs">
            <div className="space-y-10 sm:space-y-12">
              <p className="text-slate-500 font-medium">Apoteker Penanggung Jawab,</p>
              <div>
                <p className="font-bold text-slate-900 underline">
                  {apotekProfile?.apoteker_pj || 'apt. Nurul Hasanah, S.Farm'}
                </p>
                <p className="text-[10px] text-slate-400">
                  SIPA: {apotekProfile?.sipa || '19850412/SIPA-012/2022'}
                </p>
              </div>
            </div>
            <div className="space-y-10 sm:space-y-12">
              <p className="text-slate-500 font-medium">Petugas Ekspedisi / PBF,</p>
              <div>
                <p className="font-bold text-slate-900 underline whitespace-nowrap">( .................... )</p>
                <p className="text-[10px] text-slate-400">Nama Terang &amp; Cap Distributor</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Standar CDOB BPOM • SIMAAF
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen BAP</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline min-h-[44px] px-4 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
