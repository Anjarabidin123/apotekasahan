import React from 'react';

export function SettingToggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-3 text-left cursor-pointer group"
    >
      <div className="min-w-0">
        <p className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
          checked ? 'bg-emerald-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}
