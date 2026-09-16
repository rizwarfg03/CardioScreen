/** Indikator muat sederhana; teksnya menjelaskan apa yang sedang diambil. */
export default function Spinner({ label = 'Memuat data...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-xl text-on-surface-variant">
      <span className="w-5 h-5 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
      <span className="text-body-md">{label}</span>
    </div>
  );
}
