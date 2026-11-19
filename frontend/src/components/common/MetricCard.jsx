import React from 'react';

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeColor = 'bg-slate-100 text-slate-700 border-slate-200',
  iconColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          {Icon && (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
              <Icon className="w-4 h-4" strokeWidth={2.2} />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {value}
          </h3>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {subtext && (
        <p className="text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100 line-clamp-1">
          {subtext}
        </p>
      )}
    </div>
  );
}
