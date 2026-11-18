import React from 'react';
import { Clock, CheckCircle2, XCircle, ShieldAlert, AlertTriangle } from 'lucide-react';

export function StatusReturBadge({ status, batasRetur, sisaHari }) {
  if (status === 'lewat_batas') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
        Lewat Batas
      </span>
    );
  }

  if (status === 'tidak_bisa_diretur') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        Tanpa Retur
      </span>
    );
  }

  // Jika tenggat retur mendesak (< 30 hari)
  if (sisaHari !== undefined && sisaHari !== null && sisaHari <= 30) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        {sisaHari <= 0 ? 'Hari Ini Batas' : `Sisa ${sisaHari} Hari`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
      Bisa Diretur
    </span>
  );
}

export function StatusRisikoBadge({ status, skor }) {
  if (status === 'tinggi') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
        title={`Tingkat Risiko: ${Math.round((skor || 0.85) * 100)}%`}
      >
        <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
        Risiko Tinggi
      </span>
    );
  }

  if (status === 'sedang') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        title={`Tingkat Risiko: ${Math.round((skor || 0.5) * 100)}%`}
      >
        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
        Risiko Sedang
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
      title={`Tingkat Risiko: ${Math.round((skor || 0.2) * 100)}%`}
    >
      <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
      Aman
    </span>
  );
}
