
import React, { useState, useEffect } from 'react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMontana: () => void;
}

const navItems = [
  { id: 'home', icon: 'fa-house', label: 'Home' },
  { id: 'peta', icon: 'fa-map-location-dot', label: 'Peta', external: 'https://ebastari.github.io/Realisasi-pekerjaan/Realisasi2025.html' },
  { id: 'montana', icon: 'fa-camera', label: 'Montana', isMontana: true, isAdmin: true },
  { id: 'notif', icon: 'fa-bell', label: 'Notif', external: 'https://ebastari.github.io/notifikasi/notif.html' },
  { id: 'profile', icon: 'fa-user-gear', label: 'Profil' }
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenMontana }) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isMontanaPending, setIsMontanaPending] = useState(false);

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isMontana) {
      const verified = localStorage.getItem('montana_admin_verified') === 'true';
      if (!verified) {
        setIsMontanaPending(true);
        setShowAdminModal(true);
        return;
      }
      onOpenMontana();
      return;
    }

    if (item.external) {
      window.open(item.external, '_blank', 'noopener,noreferrer');
    } else {
      setActiveTab(item.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sengon123') {
      localStorage.setItem('montana_admin_verified', 'true');
      if (isMontanaPending) {
        onOpenMontana();
      }
      setShowAdminModal(false);
      setPassword('');
      setIsMontanaPending(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/50 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex justify-around p-2 pointer-events-auto">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center py-3 px-4 rounded-[24px] transition-all duration-500 relative group flex-1 ${activeTab === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/20 rounded-[20px] transition-all animate-pulse"></div>
              )}
              <i className={`fas ${item.icon} text-lg mb-1 relative z-10 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}></i>
              <span className={`text-[8px] font-black uppercase tracking-wider relative z-10 transition-opacity duration-300 ${activeTab === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setShowAdminModal(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border dark:border-slate-800 animate-drift-puff text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-6">
              <i className="fas fa-lock"></i>
            </div>
            <h2 className="text-lg font-black mb-2 tracking-tight">Verifikasi Admin</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-8 leading-relaxed">Masukkan sandi untuk mengakses fitur Admin secara permanen</p>
            
            <form onSubmit={handleVerify} className="space-y-4">
              <input 
                autoFocus
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full p-4 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl text-center text-sm font-black tracking-[0.5em] focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${error ? 'border-rose-500 animate-shake' : 'border-slate-100 dark:border-slate-700'}`}
              />
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
