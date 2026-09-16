import PublicLayout from '../components/PublicLayout.jsx';
import Icon from '../components/Icon.jsx';

export default function BiomedicalEngineering() {
  const kajian = [
    { title: 'Biomedical Instrumentation', icon: 'precision_manufacturing' },
    { title: 'Medical Technology', icon: 'biotech' },
    { title: 'Biomedical Signal Processing', icon: 'timeline' },
    { title: 'Health Informatics', icon: 'computer' },
    { title: 'Medical Device Development', icon: 'medical_services' },
  ];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto space-y-12 py-16 px-4">
        {/* Header */}
        <div className="border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0057B8]">
              Academic Partner
            </span>
          </div>
          <h1 className="text-3xl font-serif text-[#001f3f] tracking-tight">
            Teknik Biomedis Universitas Airlangga
          </h1>
          <p className="text-[#0057B8] font-medium mt-1">Biomedical Engineering, Research, and Digital Health Innovation</p>
          <p className="text-sm text-slate-600 mt-4 max-w-3xl leading-relaxed">
            Teknik Biomedis Universitas Airlangga merupakan bidang keilmuan yang mengintegrasikan ilmu teknik, biologi, kesehatan, dan teknologi untuk mendukung pengembangan berbagai solusi dalam bidang medis dan pelayanan kesehatan.
          </p>
        </div>

        {/* Visuals */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="h-64 rounded-2xl overflow-hidden relative shadow-sm group">
            <img src="/images/unair-building.png" alt="Gedung Universitas Airlangga" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style={{ objectPosition: 'center' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-4 left-4 text-white font-medium text-sm">Gedung Universitas Airlangga</span>
          </div>
          <div className="h-64 rounded-2xl overflow-hidden relative shadow-sm group">
            <img src="https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Laboratorium Teknik Biomedis" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-4 left-4 text-white font-medium text-sm">Laboratorium Teknik Biomedis</span>
          </div>
          <div className="h-64 rounded-2xl overflow-hidden relative shadow-sm group">
            <img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Aktivitas penelitian mahasiswa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-4 left-4 text-white font-medium text-sm">Aktivitas Penelitian Mahasiswa</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-serif text-[#001f3f] mb-4">Teknik Biomedis UNAIR</h2>
            <p className="text-slate-600 leading-relaxed">
              Program Studi Teknik Biomedis UNAIR berfokus pada integrasi antara ilmu teknik dan bidang kesehatan modern. 
              Melalui pendekatan multidisiplin, program ini menggabungkan teknologi rekayasa, ilmu kesehatan, dan inovasi digital untuk mendukung pengembangan solusi medis di Indonesia dan dunia.
            </p>
          </div>
          
          <div className="md:w-1/2 bg-slate-50 p-6 rounded-xl w-full">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Bidang Kajian</h3>
            <ul className="space-y-3">
              {kajian.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0057B8] flex items-center justify-center shrink-0">
                    <Icon name={item.icon} size={18} />
                  </div>
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
