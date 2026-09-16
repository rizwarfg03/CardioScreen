import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PublicLayout from '../components/PublicLayout.jsx';

export default function Landing() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center pb-12">
        <div className="absolute inset-0 bg-slate-900 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1551076805-e18690c5e458?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Healthcare Professional Environment" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001f3f]/90 via-[#001f3f]/70 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
              Transforming Cardiovascular Care Through Digital Innovation
            </h1>
            <p className="text-lg text-blue-100 mb-10 leading-relaxed font-light">
              CardioScreen menghadirkan teknologi digital untuk membantu meningkatkan kesadaran, edukasi, dan deteksi dini risiko penyakit kardiovaskular.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/login" className="bg-[#0057B8] text-white rounded-full px-8 py-3.5 hover:bg-[#00479E] transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2">
                Start Screening <Icon name="arrow_forward" size={20} />
              </Link>
              <a href="#about" className="border-2 border-white text-white rounded-full px-8 py-3.5 hover:bg-white hover:text-[#0057B8] transition-all font-semibold">
                Learn About CardioScreen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About CardioScreen Section */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl font-serif text-[#001f3f] mb-4">About CardioScreen</h2>
          <h3 className="text-xl text-[#0057B8] font-semibold mb-6">Digital Solution for Early Cardiovascular Detection</h3>
          <p className="text-slate-600 leading-relaxed text-lg mb-10">
            CardioScreen merupakan platform digital kesehatan yang dirancang untuk mendukung proses deteksi dini risiko penyakit kardiovaskular melalui pemanfaatan teknologi informasi, analisis data kesehatan, dan pendekatan biomedical engineering.
          </p>
          
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-left">
            <h3 className="text-2xl font-serif text-[#001f3f] mb-4 border-b border-slate-200 pb-4">Website Development Purpose</h3>
            <p className="text-slate-600 leading-relaxed">
              Website CardioScreen dibuat sebagai bentuk digitalisasi kesehatan untuk menyediakan akses informasi, edukasi, serta teknologi pendukung yang dapat membantu masyarakat memahami pentingnya pencegahan penyakit kardiovaskular sejak dini.
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-blue-50 text-[#0057B8] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="search" size={24} />
            </div>
            <h4 className="text-lg font-bold text-[#001f3f] mb-2">Early Detection</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Membantu pengguna memahami faktor risiko penyakit kardiovaskular.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-blue-50 text-[#0057B8] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="devices" size={24} />
            </div>
            <h4 className="text-lg font-bold text-[#001f3f] mb-2">Digital Healthcare</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Mengintegrasikan teknologi digital dalam pelayanan kesehatan.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-blue-50 text-[#0057B8] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="menu_book" size={24} />
            </div>
            <h4 className="text-lg font-bold text-[#001f3f] mb-2">Health Education</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Memberikan informasi kesehatan berbasis ilmiah.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-blue-50 text-[#0057B8] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="biotech" size={24} />
            </div>
            <h4 className="text-lg font-bold text-[#001f3f] mb-2">Biomedical Innovation</h4>
            <p className="text-sm text-slate-600 leading-relaxed">Menghubungkan teknologi rekayasa dengan kebutuhan medis.</p>
          </div>
        </div>
      </section>

      {/* Feature Section Modification */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Card 1: CardioScreen Team Management */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Team" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/80 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h3 className="text-2xl font-serif font-bold">CardioScreen Team Management</h3>
                  <p className="text-sm text-blue-200 font-medium tracking-wide uppercase mt-1">Development Team</p>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  CardioScreen Team Management merupakan halaman yang menampilkan informasi mengenai tim pengembang yang berperan dalam proses perancangan, pengembangan, dan inovasi sistem CardioScreen.
                </p>
                <Link to="/team" className="text-[#0057B8] font-bold text-sm uppercase tracking-wider hover:text-[#001f3f] transition-colors flex items-center gap-1 group-hover:gap-2 duration-300">
                  Explore Team <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </div>

            {/* Card 2: Teknik Biomedis UNAIR */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img src="/images/unair-building.png" alt="Universitas Airlangga" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style={{ objectPosition: 'center' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/80 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h3 className="text-2xl font-serif font-bold">Teknik Biomedis UNAIR</h3>
                  <p className="text-sm text-blue-200 font-medium tracking-wide uppercase mt-1">Research & Development</p>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  Pengembangan CardioScreen dilakukan dengan pendekatan multidisiplin melalui bidang Teknik Biomedis Universitas Airlangga yang menggabungkan teknologi rekayasa, ilmu kesehatan, dan inovasi digital untuk mendukung pengembangan solusi deteksi dini penyakit kardiovaskular.
                </p>
                <Link to="/biomedical-engineering" className="text-[#0057B8] font-bold text-sm uppercase tracking-wider hover:text-[#001f3f] transition-colors flex items-center gap-1 group-hover:gap-2 duration-300">
                  Explore Universitas Airlangga <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </div>

            {/* Card 3: Explore Tenang Madiun Saradan */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Community" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/80 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h3 className="text-2xl font-serif font-bold">Explore Tenang Madiun Saradan</h3>
                  <p className="text-sm text-blue-200 font-medium tracking-wide uppercase mt-1">Community Health Exploration</p>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  Explore Tenang Madiun Saradan merupakan halaman informasi mengenai konteks wilayah implementasi teknologi kesehatan digital CardioScreen serta edukasi masyarakat mengenai pentingnya pencegahan penyakit kardiovaskular.
                </p>
                <Link to="/madiun-saradan" className="text-[#0057B8] font-bold text-sm uppercase tracking-wider hover:text-[#001f3f] transition-colors flex items-center gap-1 group-hover:gap-2 duration-300">
                  Explore Madiun Saradan <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why Choose CardioScreen */}
      <section id="why-choose" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-serif text-[#001f3f] mb-12 text-center">Why Choose CardioScreen</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex items-start gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-[#0057B8] flex items-center justify-center shrink-0">
              <Icon name="memory" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#001f3f] mb-2">Technology Based</h3>
              <p className="text-slate-600 leading-relaxed">Menggunakan pendekatan teknologi digital dalam mendukung kesehatan.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Icon name="health_and_safety" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#001f3f] mb-2">Preventive Healthcare</h3>
              <p className="text-slate-600 leading-relaxed">Berfokus pada pencegahan melalui deteksi dini.</p>
            </div>
          </div>

          <div className="flex items-start gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Icon name="science" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#001f3f] mb-2">Biomedical Approach</h3>
              <p className="text-slate-600 leading-relaxed">Menggabungkan ilmu teknik dan medis.</p>
            </div>
          </div>

          <div className="flex items-start gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Icon name="auto_stories" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#001f3f] mb-2">Accessible Information</h3>
              <p className="text-slate-600 leading-relaxed">Menyediakan informasi kesehatan yang mudah dipahami.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
