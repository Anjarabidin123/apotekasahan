import React from 'react';
import { X } from 'lucide-react';

export function AddPbfModal({ isOpen, newPbf, setNewPbf, onSubmit, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-sm font-black text-slate-900">Daftarkan PBF Mitra Baru</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal PBF"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama PBF Distributor</label>
            <input
              type="text"
              required
              placeholder="Contoh: PBF Kimia Farma TD Medan"
              value={newPbf.nama}
              onChange={(e) => setNewPbf({ ...newPbf, nama: e.target.value })}
              className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 font-bold"
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
                className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Aturan Retur</label>
              <select
                value={newPbf.aturan_retur_bulan}
                onChange={(e) => setNewPbf({ ...newPbf, aturan_retur_bulan: Number(e.target.value) })}
                className="w-full text-xs h-10 px-2 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="0">0 Bulan (Tanpa Retur)</option>
                <option value="1">1 Bulan Sebelum Exp</option>
                <option value="2">2 Bulan Sebelum Exp</option>
                <option value="3">3 Bulan Sebelum Exp</option>
                <option value="6">6 Bulan Sebelum Exp</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIC Retur</label>
              <input
                type="text"
                placeholder="Nama PIC"
                value={newPbf.kontak}
                onChange={(e) => setNewPbf({ ...newPbf, kontak: e.target.value })}
                className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telepon / WA</label>
              <input
                type="text"
                placeholder="0812xxxx"
                value={newPbf.telepon}
                onChange={(e) => setNewPbf({ ...newPbf, telepon: e.target.value })}
                className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline h-10 px-3.5 text-xs cursor-pointer"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary h-10 px-4 text-xs font-bold cursor-pointer">
              Simpan PBF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddKategoriModal({ isOpen, newKat, setNewKat, onSubmit, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-sm font-black text-slate-900">Tambah Golongan Kategori</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kategori"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kategori</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kortikosteroid"
              value={newKat.nama}
              onChange={(e) => setNewKat({ ...newKat, nama: e.target.value })}
              className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stok Min (Unit)</label>
              <input
                type="number"
                value={newKat.stok_minimum}
                onChange={(e) => setNewKat({ ...newKat, stok_minimum: Number(e.target.value) })}
                className="w-full text-xs h-10 px-3 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Golongan</label>
              <select
                value={newKat.jenis}
                onChange={(e) => setNewKat({ ...newKat, jenis: e.target.value })}
                className="w-full text-xs h-10 px-2 rounded-xl border border-slate-200 bg-white font-bold"
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
              onClick={onClose}
              className="btn-outline h-10 px-3.5 text-xs cursor-pointer"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary h-10 px-4 text-xs font-bold cursor-pointer">
              Simpan Kategori
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
