import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';

export default function AboutSystem() {
  return (
    <AppLayout breadcrumb={['Tentang Sistem']}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0057B8]">
              Arsitektur & Spesifikasi Platform
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tentang Sistem CardioSync Pro
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Sistem informasi manajemen rekam medis elektrokardiografi (ECG) dan portal edukasi kesehatan klinis.
          </p>
        </div>

        {/* Section 1: Tujuan Sistem */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 space-y-4">
          <h2 className="text-base font-bold text-slate-900">1. Tujuan & Fungsi Utama Sistem</h2>
          <div className="text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
            <p>
              Sistem ini dirancang untuk menjembatani perangkat pemeriksaan elektrokardiografi portabel (OMRON Complete HEM-7530T) dengan sistem pengarsipan rekam medis elektronik fasilitas kesehatan primer dan posyandu.
            </p>
            <p>
              Fungsi pokok sistem meliputi:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 text-xs">
              <li>Pengarsipan berkas asli PDF pemeriksaan ECG tanpa degradasi kualitas resolusi.</li>
              <li>Ekstraksi otomatis metadata fisiologis (Heart Rate, Instant Analysis, Durasi, Waktu Rekam) tanpa rekayasa data.</li>
              <li>Pencatatan data tensi manual (Sistolik & Diastolik) secara terpisah dari hasil ECG.</li>
              <li>Alur penelaahan morfologi ritme oleh dokter, dilengkapi verifikasi tanda tangan digital resmi.</li>
              <li>Penyediaan portal edukasi kesehatan masyarakat berbasis riset biomedis.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Keamanan & Privasi Data Pasien */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <Icon name="security" size={20} />
            <h2 className="text-base font-bold text-slate-900">2. Keamanan & Kerahasiaan Data Medis</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Seluruh data identitas pasien (Nama, NIK 16-digit, nomor telepon) dan rekam gelombang ECG dilindungi oleh mekanisme autentikasi Role-Based Access Control (RBAC). Data pemeriksaan pasien hanya dapat diakses oleh staf medis (Perawat, Dokter, dan Administrator) yang memiliki otorisasi aktif.
          </p>
        </section>

        {/* Section 3: Informasi Versi & Institusi */}
        <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Versi Sistem</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">CardioSync Pro v2.0</span>
            <span className="text-[11px] text-slate-500">Clinical & Education Edition</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Institusi Pengembang</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">Teknik Biomedis</span>
            <span className="text-[11px] text-slate-500">Universitas Airlangga</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Integrasi Perangkat</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">OMRON HEM-7530T</span>
            <span className="text-[11px] text-slate-500">Lead II / Single Channel ECG</span>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
