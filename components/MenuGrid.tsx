
import React, { useState, useEffect } from 'react';
import { MENU_ITEMS } from '../constants';
import { MenuItem } from '../types';

interface MenuGridProps {
  onOpenMontana: () => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ onOpenMontana }) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('montana_admin_verified') === 'true';
    setIsAdminVerified(verified);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, item: MenuItem) => {
    if (item.id === 'montana-v2') {
      e.preventDefault();
      onOpenMontana();
      return;
    }
    
    if (item.badge === 'Admin') {
      if (isAdminVerified) {
        return;
      }
      e.preventDefault();
      setSelectedItem(item);
      setShowAdminModal(true);
      setError(false);
      setIsSuccess(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sengon123') {
      setIsSuccess(true);
      setError(false);
      localStorage.setItem('montana_admin_verified', 'true');
      setIsAdminVerified(true);
      
      setTimeout(() => {
        if (selectedItem) {
          if (selectedItem.id === 'montana-v2') {
            onOpenMontana();
          } else {
            window.open(selectedItem.href, '_blank', 'noopener,noreferrer');
          }
        }
        setShowAdminModal(false);
        setPassword('');
        setIsSuccess(false);
      }, 1500);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {MENU_ITEMS.map((item) => (
          <a 
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleMenuClick(e, item)}
            className="group relative flex flex-col items-center justify-center p-4 py-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/50 dark:border-slate-800/50 transition-all duration-500 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1 active:scale-95 overflow-hidden"
          >
            {item.badge && (
              <span className={`absolute top-3 right-3 px-2 py-0.5 text-white text-[6px] font-black uppercase rounded-full shadow-sm z-10 tracking-widest ${item.badge === 'Admin' ? 'bg-slate-800/80' : 'bg-emerald-600/80'}`}>
                {item.badge}
              </span>
            )}
            
            <div className={`w-12 h-12 mb-3 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/10`}>
              <i className={`fas ${item.icon}`}></i>
            </div>

            <span className="text-[9px] font-bold text-center text-slate-500 dark:text-slate-400 leading-tight px-1 uppercase tracking-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {item.title}
            </span>
            
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/[0.03] group-hover:to-transparent transition-all duration-700"></div>
          </a>
        ))}
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !isSuccess && setShowAdminModal(false)}></div>
          <div className="relative w-full max-sm:max-w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border dark:border-slate-800 animate-drift-puff text-center">
            {isSuccess ? (
              <div className="py-6 space-y-4 animate-fadeIn">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                  <i className="fas fa-check"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Verifikasi Berhasil</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Akses Admin Terbuka</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 text-slate-300 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-6">
                  <i className="fas fa-fingerprint"></i>
                </div>
                <h2 className="text-lg font-black mb-2 tracking-tight">Security Protocol</h2>
                <p className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-8 leading-relaxed">Masukkan sandi khusus departemen untuk verifikasi</p>
                
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
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl text-center text-sm font-black tracking-[0.5em] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all ${error ? 'border-rose-300 animate-shake' : 'border-slate-100 dark:border-slate-700'}`}
                  />
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowAdminModal(false)}
                      className="flex-1 py-4 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      Authorize
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
