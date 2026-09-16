import { useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import { HEALTH_ARTICLES } from '../data/healthArticles.js';

export default function HealthArticleDetail() {
  const { id } = useParams();
  const article = HEALTH_ARTICLES.find((a) => a.id === id);

  if (!article) {
    return (
      <AppLayout breadcrumb={['Informasi Kesehatan', 'Artikel Tidak Ditemukan']}>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Artikel Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Artikel yang Anda tuju tidak tersedia atau telah dipindahkan.</p>
          <Link
            to="/health-info"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0057B8] hover:underline"
          >
            <Icon name="arrow_back" size={16} />
            Kembali ke Pusat Informasi Kesehatan
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumb={['Informasi Kesehatan', article.title]}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation back */}
        <Link
          to="/health-info"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0057B8] transition-colors"
        >
          <Icon name="arrow_back" size={16} />
          <span>Kembali ke Daftar Artikel</span>
        </Link>

        {/* Article Header */}
        <header className="space-y-3 pb-6 border-b border-slate-200">
          <span className="text-xs font-bold text-[#0057B8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {article.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span>Penulis: <strong className="text-slate-700">{article.author}</strong></span>
            <span>·</span>
            <span>Dipublikasikan: {article.publishedDate}</span>
            <span>·</span>
            <span className="font-mono text-slate-600">{article.readTime}</span>
          </div>
        </header>

        {/* Summary Card */}
        <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-[#0057B8] text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          {article.summary}
        </div>

        {/* Article Body */}
        <div className="space-y-6 text-sm text-slate-800 leading-relaxed">
          {article.content.map((sec, idx) => (
            <section key={idx} className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {sec.heading}
              </h2>
              <div className="text-slate-700 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                {sec.text}
              </div>
            </section>
          ))}
        </div>

        {/* References Section */}
        {article.references && article.references.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Referensi & Sumber Rujukan
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              {article.references.map((ref, idx) => (
                <li key={idx}>{ref}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer Footer */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-amber-900 flex items-center gap-1.5">
            <Icon name="warning" size={16} className="text-amber-700" />
            Catatan Penting:
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            {article.disclaimer}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
