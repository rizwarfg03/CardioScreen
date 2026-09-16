import Icon from './Icon.jsx';

const STYLES = {
  normal: { bg: 'bg-emerald-50 border border-emerald-200/60', text: 'text-emerald-700', icon: 'check_circle' },
  abnormal: { bg: 'bg-rose-50 border border-rose-200/60', text: 'text-rose-700', icon: 'warning' },
  pending: { bg: 'bg-amber-50 border border-amber-200/60', text: 'text-amber-700', icon: 'pending_actions' },
  info: { bg: 'bg-blue-50 border border-blue-200/60', text: 'text-blue-700', icon: 'info' },
};

/** Lencana status berbentuk pil modern clean */
export default function StatusBadge({ tone = 'normal', children, icon }) {
  const style = STYLES[tone] || STYLES.info;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <Icon name={icon || style.icon} size={14} />
      <span>{children}</span>
    </span>
  );
}
