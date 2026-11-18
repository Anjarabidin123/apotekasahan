import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Wallet, AlertTriangle, Boxes, FileText, 
  RefreshCw, Plus, Calendar, Settings 
} from 'lucide-react';

export function DashboardPage({ onNavigateToPengingat, onNavigateToInventori, onNavigateToFaktur, onNavigateToKalender }) {
  const [data, setData] = useState({ summary: { total_nilai_persediaan: 0, total_nilai_berisiko: 0 }, pengingat: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [summaryRes, pengingatRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getPengingat()
      ]);
      setData({ summary: summaryRes.data, pengingat: pengingatRes.data });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const menuItems = [
    { icon: Plus, label: 'Input Faktur', action: onNavigateToFaktur, color: 'text-blue-600' },
    { icon: Boxes, label: 'Stok Obat', action: onNavigateToInventori, color: 'text-emerald-600' },
    { icon: AlertTriangle, label: 'Retur/Mendesak', action: onNavigateToPengingat, color: 'text-rose-600' },
    { icon: Calendar, label: 'Kalender', action: onNavigateToKalender, color: 'text-amber-600' },
  ];

  if (loading) return <div className="p-4 text-center text-sm">Memuat...</div>;

  return (
    <div className="p-3 space-y-4 bg-slate-50 min-h-screen">
      {/* M-Banking Style Balance Header */}
      <div className="bg-slate-900 text-white p-4 rounded-lg shadow-md">
        <p className="text-slate-400 text-xs mb-1">Total Nilai Stok</p>
        <h1 className="text-2xl font-bold tracking-tight">{formatRupiah(data.summary.total_nilai_persediaan)}</h1>
        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between">
          <div>
            <p className="text-slate-400 text-[10px]">Risiko Retur</p>
            <p className="font-semibold text-sm text-rose-400">{formatRupiah(data.summary.total_nilai_berisiko)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px]">Kepatuhan</p>
            <p className="font-semibold text-sm">94.2%</p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item, idx) => (
          <button 
            key={idx}
            onClick={item.action}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-all shadow-sm"
          >
            <item.icon className={`w-6 h-6 mb-2 ${item.color}`} />
            <span className="text-xs font-semibold text-slate-700">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Alerts */}
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <h2 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Alert Mendesak</h2>
        <div className="space-y-2">
          {data.pengingat.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-700 truncate w-3/4">{item.nama_obat}</span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Sisa {item.stok}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
