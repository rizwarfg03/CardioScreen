import PublicLayout from '../components/PublicLayout.jsx';
import Icon from '../components/Icon.jsx';

export default function MadiunSaradan() {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto space-y-12 py-16 px-4">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Community Health Exploration
            </span>
          </div>
          <h1 className="text-3xl font-serif text-[#001f3f] tracking-tight">
            Tenang Madiun Saradan
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Berikan informasi mengenai konteks wilayah implementasi teknologi kesehatan digital CardioScreen serta edukasi masyarakat mengenai pentingnya pencegahan penyakit kardiovaskular.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-serif text-[#001f3f] mb-4">Wilayah Saradan, Kabupaten Madiun</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Saradan merupakan sebuah kecamatan di Kabupaten Madiun yang menjadi salah satu area fokus implementasi program kesehatan CardioScreen. Kondisi masyarakat yang terus berkembang menuntut adanya peningkatan kesadaran akan pentingnya pemeriksaan risiko penyakit jantung secara berkala.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0057B8] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="groups" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Kondisi Masyarakat</h4>
                  <p className="text-sm text-slate-600 mt-0.5">Meningkatkan aksesibilitas layanan kesehatan digital ke berbagai lapisan masyarakat.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0057B8] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="menu_book" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Edukasi Kesehatan</h4>
                  <p className="text-sm text-slate-600 mt-0.5">Program edukasi berkelanjutan mengenai gaya hidup sehat dan pencegahan penyakit.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="monitor_heart" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Pemeriksaan Risiko Jantung</h4>
                  <p className="text-sm text-slate-600 mt-0.5">Pentingnya skrining awal penyakit jantung untuk penanganan medis yang lebih efektif.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <div className="h-48 rounded-2xl overflow-hidden relative shadow-sm">
              <img src="https://images.unsplash.com/photo-1593113589914-075568e09121?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Wilayah Madiun" className="w-full h-full object-cover" />
            </div>
            <div className="h-48 rounded-2xl overflow-hidden relative shadow-sm">
              <img src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Aktivitas Masyarakat" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Digital Health Awareness Program */}
        <div className="bg-[#001f3f] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0057B8] rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 md:w-2/3">
            <h2 className="text-2xl font-serif mb-4">Digital Health Awareness Program</h2>
            <p className="text-blue-100 leading-relaxed text-lg">
              Melalui pendekatan digitalisasi kesehatan, CardioScreen berupaya meningkatkan pemahaman masyarakat mengenai pentingnya deteksi dini dan gaya hidup sehat.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
