
import React from 'react';

export const AboutSection: React.FC = () => {
  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      {/* Header Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="flex flex-col items-center text-center relative z-10">
          <img 
            src="https://avatars.githubusercontent.com/u/104192667?v=4" 
            className="w-28 h-28 rounded-[40px] object-cover border-4 border-white dark:border-slate-800 shadow-2xl mb-6 bg-slate-100 dark:bg-slate-800"
            alt="Agung Laksono"
            onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Agung+Laksono&background=10b981&color=fff"; }}
          />
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Agung Laksono</h2>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1 mb-4">Web Application Developer | Environmental Monitoring</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">Kepala Seksi Revegetasi — PT Energi Batubara Lestari</p>
          <div className="flex gap-4">
            <a href="https://github.com/Ebastari" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <i className="fab fa-github"></i> GitHub
            </a>
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
              INTERNAL SYSTEM
            </div>
          </div>
        </div>
      </div>

      {/* Narasi Bio */}
      <section className="px-2 space-y-6">
        <blockquote className="border-l-4 border-emerald-500 pl-6 py-2">
          <p className="text-lg font-medium italic text-slate-600 dark:text-slate-300 leading-relaxed">
            “Code should not only function efficiently, but also support environmental responsibility.”
          </p>
        </blockquote>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
            Agung Laksono adalah seorang pengembang aplikasi web sekaligus praktisi lingkungan yang berfokus pada pengelolaan data lingkungan, reklamasi lahan, dan sistem monitoring berbasis teknologi. Saat ini, ia menjabat sebagai <strong>Kepala Seksi Revegetasi di PT Energi Batubara Lestari</strong>, dengan peran strategis dalam pengelolaan dan inovasi kegiatan reklamasi pascatambang.
          </p>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
            Berangkat dari kebutuhan lapangan yang kompleks, Agung mengembangkan <strong>Montana AI</strong>, sebuah aplikasi web berbasis GIS yang dirancang untuk menjembatani operasional lapangan dengan sistem dokumentasi yang transparan serta terverifikasi.
          </p>
        </div>
      </section>

      {/* Professional Focus */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Professional Focus</h4>
        <ul className="grid grid-cols-1 gap-4">
          {[
            'Pengembangan aplikasi web berbasis kebutuhan lapangan',
            'Sistem monitoring lingkungan dan reklamasi',
            'Integrasi data spasial dan dokumentasi visual',
            'Solusi teknologi sederhana, terukur, dan berkelanjutan'
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[8px]">
                <i className="fas fa-check"></i>
              </div>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Engineering Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
           <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">Technology Stack Matrix</h4>
           <div className="px-3 py-1 bg-emerald-500 rounded-full text-[7px] font-black">PRODUCTION READY</div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b dark:border-slate-800">
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Domain</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Technology</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            <tr>
              <td className="px-6 py-5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Core Engine</td>
              <td className="px-6 py-5 text-[10px] font-medium text-slate-500 dark:text-slate-400">HTML5, JS, Tailwind CSS</td>
            </tr>
            <tr>
              <td className="px-6 py-5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Geospatial AI</td>
              <td className="px-6 py-5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Leaflet.js, KMZ Processing</td>
            </tr>
            <tr>
              <td className="px-6 py-5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Data Pipeline</td>
              <td className="px-6 py-5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Google App Script, Spreadsheet</td>
            </tr>
            <tr>
              <td className="px-6 py-5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Mobile Sync</td>
              <td className="px-6 py-5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Camera, GPS, EXIF Integration</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Innovation Section */}
      <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[40px] text-white shadow-2xl">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 opacity-60">Innovation Track Record</h4>
        <div className="space-y-8">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[11px] font-black uppercase tracking-tight">Metode Penanaman Potting</p>
              <span className="text-[9px] font-black text-emerald-400">± Rp50JT / HA</span>
            </div>
            <p className="text-[9px] opacity-60 leading-relaxed font-medium">Alternatif reklamasi efektif dengan efisiensi biaya yang signifikan terhadap metode konvensional.</p>
          </div>
          
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[11px] font-black uppercase tracking-tight">Integrated Farming System</p>
              <span className="text-[9px] font-black text-emerald-400">± Rp100JT / THN</span>
            </div>
            <p className="text-[9px] opacity-60 leading-relaxed font-medium">Integrasi reklamasi dengan peternakan untuk optimalisasi nutrisi tanah dan penghematan pupuk.</p>
          </div>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="text-center py-10 opacity-40">
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">“Urip kudu urup.”</p>
         <p className="text-[8px] font-bold uppercase tracking-widest">Montana AI © 2025</p>
      </div>
    </div>
  );
};
