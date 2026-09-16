import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout.jsx';
import Icon from '../components/Icon.jsx';

const TEAM_MEMBERS = [
  {
    title: 'Project Manager',
    desc: 'Responsible for project coordination, development planning, team communication, and ensuring the CardioScreen development process remains aligned with project objectives.',
  },
  {
    title: 'AI Developer',
    desc: 'Responsible for developing and integrating artificial intelligence components and data processing mechanisms used within the CardioScreen system.',
  },
  {
    title: 'Web Developer',
    desc: 'Responsible for developing, maintaining, and integrating the frontend and backend components of the CardioScreen web platform.',
  },
  {
    title: 'UI/UX Designer',
    desc: 'Responsible for designing the user interface and user experience to ensure CardioScreen remains accessible, intuitive, responsive, and easy to use.',
  },
  {
    title: 'Dokumentator',
    desc: 'Responsible for documenting the development process, activities, system progress, and supporting documentation required throughout the CardioScreen project.',
  },
  {
    title: 'Administrator',
    desc: 'Responsible for supporting administrative management, data organization, project coordination, and operational documentation.',
  },
  {
    title: 'Administrator',
    desc: 'Responsible for assisting administrative activities, managing project information, and supporting the operational requirements of the CardioScreen development process.',
  }
];

export default function Team() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto space-y-12 py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link to="/" className="hover:text-[#0057B8] flex items-center gap-1 transition-colors">
            <Icon name="arrow_back" size={16} /> Home
          </Link>
          <span>&gt;</span>
          <span className="text-slate-900">CardioScreen Team Management</span>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0057B8] text-xs font-bold uppercase tracking-wider">
            Our Team
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#001f3f] tracking-tight">
            People Behind CardioScreen
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            CardioScreen dikembangkan melalui kolaborasi multidisiplin untuk mengintegrasikan teknologi digital, biomedical engineering, desain sistem, serta pengelolaan platform dalam mendukung inovasi kesehatan kardiovaskular.
          </p>
        </div>

        {/* Section 1: Academic Supervisor */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wider text-center border-b border-slate-200 pb-4">
            Academic Supervisor
          </h2>
          
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:-translate-y-1 transition-transform duration-300">
            <div className="md:w-1/3 bg-slate-50 border-r border-slate-100 flex-shrink-0">
              <img 
                src="/images/dr-riries.png" 
                alt="Dr. Riries Rulaningtyas, S.T., M.T." 
                className="w-full h-72 md:h-full object-cover object-top" 
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-[#001f3f]">Dr. Riries Rulaningtyas, S.T., M.T.</h3>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-medium text-[#0057B8]">Academic Supervisor</p>
                <p className="text-sm font-semibold text-slate-500">Dosen Pembimbing</p>
                <p className="text-sm text-slate-600">Teknik Biomedis, Universitas Airlangga</p>
              </div>
              <p className="text-slate-700 leading-relaxed mt-4 mb-6">
                Memberikan arahan akademik dan supervisi dalam proses pengembangan CardioScreen agar pengembangan sistem tetap selaras dengan pendekatan keilmuan Teknik Biomedis dan kebutuhan teknologi kesehatan.
              </p>
              <div>
                <a 
                  href="https://scholar.google.com/citations?user=PLt60RYAAAAJ&hl=id&oi=ao" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-[#0057B8] text-[#0057B8] hover:text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <Icon name="school" size={18} /> Google Scholar
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Development Team */}
        <section className="mt-20">
          <h2 className="text-xl font-bold text-slate-900 mb-8 uppercase tracking-wider text-center border-b border-slate-200 pb-4">
            Development Team
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM_MEMBERS.map((role, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center ${idx === 6 ? 'lg:col-start-2' : ''}`}
              >
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border-2 border-slate-200 overflow-hidden shrink-0">
                  <Icon name="person" size={48} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Coming Soon</h3>
                <p className="text-sm font-bold text-[#0057B8] mt-1 mb-3">{role.title}</p>
                <p className="text-sm text-slate-600 leading-relaxed font-light">
                  {role.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
