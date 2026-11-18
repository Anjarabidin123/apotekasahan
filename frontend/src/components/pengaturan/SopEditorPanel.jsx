import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';

export function SopEditorPanel({
  namaApotek,
  sopSteps,
  setSopSteps,
  isEditingSop,
  setIsEditingSop,
  newSopStepText,
  setNewSopStepText,
  onSaveSop,
  onResetSop,
}) {
  const handleMoveSop = (index, delta) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= sopSteps.length) return;
    const copy = [...sopSteps];
    [copy[index], copy[targetIdx]] = [copy[targetIdx], copy[index]];
    setSopSteps(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-extrabold text-slate-900">
          SOP Retur &amp; Pengawasan ({namaApotek})
        </p>
        <div className="flex items-center gap-1.5">
          {isEditingSop ? (
            <>
              <button
                type="button"
                onClick={onResetSop}
                className="btn-outline h-9 px-2.5 text-[11px] font-bold text-slate-600 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={onSaveSop}
                className="btn-primary h-9 px-3 text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan SOP</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="edit-sop-btn"
              onClick={() => setIsEditingSop(true)}
              className="btn-outline h-9 px-3 text-xs font-bold text-blue-700 border-blue-200 bg-blue-50/70 hover:bg-blue-100 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit SOP</span>
            </button>
          )}
        </div>
      </div>

      {isEditingSop ? (
        <div className="space-y-2.5">
          <div className="space-y-2">
            {sopSteps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-2"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-1">
                  {idx + 1}
                </span>
                <textarea
                  rows={3}
                  value={step.teks}
                  onChange={(e) => {
                    const next = [...sopSteps];
                    next[idx] = { ...step, teks: e.target.value };
                    setSopSteps(next);
                  }}
                  className="flex-1 text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveSop(idx, -1)}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer"
                    title="Geser ke atas"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSop(idx, 1)}
                    disabled={idx === sopSteps.length - 1}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer"
                    title="Geser ke bawah"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSopSteps(sopSteps.filter((_, i) => i !== idx))}
                    className="w-7 h-7 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer"
                    title="Hapus langkah"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSopStepText}
              onChange={(e) => setNewSopStepText(e.target.value)}
              placeholder="Tambah langkah SOP baru..."
              className="flex-1 text-xs h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium"
            />
            <button
              type="button"
              onClick={() => {
                if (!newSopStepText.trim()) return;
                setSopSteps([...sopSteps, { id: Date.now(), teks: newSopStepText.trim() }]);
                setNewSopStepText('');
              }}
              className="btn-primary h-10 px-3.5 text-xs font-bold shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <ol className="list-decimal pl-4 space-y-2 text-xs text-slate-700 leading-relaxed">
            {sopSteps.map((step, idx) => (
              <li key={step.id || idx}>{step.teks}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
