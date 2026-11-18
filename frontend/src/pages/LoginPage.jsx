import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pill, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export function LoginPage({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@apotek.local');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (role) => {
    if (role === 'admin') {
      setEmail('admin@apotek.local');
      setPassword('admin123');
    } else {
      setEmail('karyawan@apotek.local');
      setPassword('karyawan123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full premium-card p-8 sm:p-10 space-y-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border-slate-100">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center text-white shadow-[0_10px_25px_-5px_rgba(5,150,105,0.4)]"
            style={{ background: 'var(--gradient-card)' }}
          >
            <Pill className="w-7 h-7" strokeWidth={2.4} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
            SIMAAF
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sistem Pemantauan Stok & Kedaluwarsa<br />
            <strong className="text-slate-800">Apotek Asahan Farma</strong> — Kisaran Timur
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@apotek.local"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(5,150,105,0.4)] active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Akses Cepat Demo Akun (Pill Buttons) */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center block mb-2.5">
            Akun Demo Capstone Asah 2026
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDemoAccount('admin')}
              className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-slate-800 text-xs font-bold transition text-left active:scale-95"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-extrabold text-emerald-900">Ibu Anni</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full font-black">Admin</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-normal">Akses penuh komisaris</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('karyawan')}
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition text-left active:scale-95"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-extrabold text-slate-800">Karyawan</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full font-black">Staff</span>
              </div>
              <p className="text-[10px] text-slate-500 font-normal">Input faktur & stok</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
