/**
 * Garis trace EKG yang berjalan terus, seperti monitor bedside sungguhan.
 * Murni CSS (satu <path> diulang & digeser lewat animasi transform), jadi
 * ringan dan otomatis berhenti kalau pengguna mengaktifkan "reduced motion"
 * (lihat aturan global di index.css).
 */
export default function EcgPulseTrace({ className = '', stroke = '#2B66FF' }) {
  // Satu siklus detak: garis datar -> lekukan P -> QRS tajam -> gelombang T -> datar lagi.
  const cycle = 'M0,20 L18,20 L24,10 L30,28 L36,4 L42,32 L48,20 L58,20 L66,12 L74,20 L120,20';

  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 120 40"
        preserveAspectRatio="none"
        className="w-[200%] h-full animate-ekg-scroll"
      >
        <path d={cycle} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        <path
          d={cycle}
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(120, 0)"
        />
      </svg>
    </div>
  );
}
