import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import { HEALTH_ARTICLES, HEALTH_CATEGORIES } from '../data/healthArticles.js';

export default function HealthInfo() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = HEALTH_ARTICLES.filter((article) => {
    const matchesCat =
      selectedCategory === 'Semua' || article.category === selectedCategory;
    const matchesQuery =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <AppLayout breadcrumb={['Informasi Kesehatan']}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Editorial */}
        <div className="border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0057B8]">
              Edukasi Kesehatan Masyarakat & Teknologi Medis
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Pusat Informasi & Edukasi Kesehatan
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Kumpulan artikel dan panduan medis praktis seputar kesehatan sistem kardiovaskular, elektrokardiografi (ECG), pemantauan tekanan darah, dan pencegahan penyakit dari perspektif teknologi biomedis.
          </p>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-start gap-3">
          <Icon name="info" size={20} className="text-[#0057B8] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">Disclaimer Medis:</strong> Informasi pada portal ini ditujukan semata-mata untuk edukasi kesehatan umum dan pemahaman teknologi biomedis, serta tidak menggantikan konsultasi, diagnosis, atau penanganan medis langsung oleh dokter profesional.
          </p>
        </div>

        {/* Search and Category Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Categories Pill List */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            {HEALTH_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#0057B8] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik kesehatan..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
            />
          </div>
        </div>

        {/* Articles List */}
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <p className="text-sm text-slate-500">Tidak ada artikel yang cocok dengan pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-[#0057B8]/40 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#0057B8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {article.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {article.readTime}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 leading-snug hover:text-[#0057B8] transition-colors">
                    <Link to={`/health-info/${article.id}`}>{article.title}</Link>
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">{article.publishedDate}</span>
                  <Link
                    to={`/health-info/${article.id}`}
                    className="text-[#0057B8] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Baca Selengkapnya</span>
                    <Icon name="arrow_forward" size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
