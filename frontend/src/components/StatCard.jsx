import Icon from './Icon.jsx';

/**
 * Kartu metrik gaya Bisfit:
 * - Rounded 24px, putih bersih, subtle shadow
 * - Header: Icon kecil + Label + Status Pill ("Good", "Normal", dsb) + action "..."
 * - Value: Angka besar tegas (teks hitam) + unit
 */
export default function StatCard({
  label,
  value,
  icon = 'monitor_heart',
  tone = 'default',
  badgeText = 'Good',
  unit,
  delta,
  onClick,
}) {
  const badgeStyles = {
    good: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    normal: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100',
    default: 'bg-blue-50 text-blue-600 border border-blue-100',
  };

  const badgeClass = badgeStyles[tone] || badgeStyles.default;

  return (
    <div
      onClick={onClick}
      className={`card p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-card-hover ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <Icon name={icon} size={16} />
            </div>
            <span className="text-slate-400 text-xs font-semibold">{label}</span>
            {badgeText && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                {badgeText}
              </span>
            )}
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1">
            •••
          </button>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-vitals">
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-500 ml-1">{unit}</span>}
        </div>
      </div>

      {delta !== undefined && delta !== null && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2 font-medium">
          <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            {delta >= 0 ? '+' : ''}
            {delta}
          </span>
          <span>vs kemarin</span>
        </div>
      )}
    </div>
  );
}
