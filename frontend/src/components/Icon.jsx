/** Ikon Material Symbols; `filled` untuk versi solid seperti di desain. */
export default function Icon({ name, className = '', filled = false, size }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${filled ? 'icon-filled' : ''} ${className}`}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  );
}
