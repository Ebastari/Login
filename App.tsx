
import React, { useState, useEffect } from 'react';
import { GrowthCard } from './components/GrowthCard';
import { MenuGrid } from './components/MenuGrid';
import { BottomNav } from './components/BottomNav';
import { Skeleton } from './components/Skeleton';
import { WeatherOverlay } from './components/WeatherOverlay';
import { Login } from './components/Login';
import { ProfileEdit } from './components/ProfileEdit';
import { AboutSection } from './components/AboutSection';
import { MontanaCameraV2 } from './components/MontanaCameraV2';
import { UserProfile, WeatherCondition } from './types';

interface TeamMemberStatus {
  isOnline: boolean;
  lastSeen: string;
}

const FIELD_TEAM = [
  { name: 'Mariano A S', role: 'Kepala Departemen RnR', phone: '6282157832272', photo: 'https://ui-avatars.com/api/?name=Mariano+AS&background=10b981&color=fff' },
  { name: 'Agung Laksono', role: 'Kepala Seksi Revegetasi', phone: '6281122220044', photo: 'https://avatars.githubusercontent.com/u/104192667?v=4' },
  { name: 'Syarudin', role: 'Spesialis Pembibitan', phone: '6282144987894', photo: 'https://ui-avatars.com/api/?name=Syarudin&background=059669&color=fff' },
  { name: 'Daniel', role: 'GL Revegetasi', phone: '6281231887845', photo: 'https://ui-avatars.com/api/?name=Daniel&background=3b82f6&color=fff' },
  { name: 'Andree', role: 'Pengawas Vendor CV KBS', phone: '6285141443022', photo: 'https://ui-avatars.com/api/?name=Andree&background=6366f1&color=fff' }
];

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showMontanaCamera, setShowMontanaCamera] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>('clear');
  const [showWelcomeNotif, setShowWelcomeNotif] = useState(false);
  const [latestBibit, setLatestBibit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  
  const [teamStatuses, setTeamStatuses] = useState<TeamMemberStatus[]>(
    FIELD_TEAM.map(() => ({ isOnline: true, lastSeen: '' }))
  );
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('montana_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [user, setUser] = useState<UserProfile>({
    name: '',
    photo: '',
    jabatan: 'Anggota Lapangan',
    telepon: '',
    email: '',
    activeSeconds: 0,
    lastSeen: new Date().toISOString()
  });

  const SHEETY_URL = 'https://api.sheety.co/ecf70bd684db7a654a0aa41957dff1a8/nursery/bibit';

  useEffect(() => {
    const updatePresence = () => {
      setTeamStatuses(current => {
        const indices = [...Array(FIELD_TEAM.length).keys()];
        const shuffled = indices.sort(() => 0.5 - Math.random());
        const onlineIndices = shuffled.slice(0, 3);

        return current.map((status, idx) => {
          const isNowOnline = onlineIndices.includes(idx);
          let lastSeen = status.lastSeen;
          if (status.isOnline && !isNowOnline) {
            lastSeen = currentTime;
          }
          return {
            isOnline: isNowOnline,
            lastSeen: lastSeen || (status.isOnline ? '' : currentTime)
          };
        });
      });
    };
    const interval = setInterval(updatePresence, 25000);
    return () => clearInterval(interval);
  }, [currentTime]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const witaString = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setCurrentTime(witaString);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('montana_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const fetchLatestNotif = async () => {
    try {
      const res = await fetch(SHEETY_URL);
      const json = await res.json();
      if (json.bibit && json.bibit.length > 0) {
        const sorted = [...json.bibit].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        setLatestBibit(sorted[0]);
        setShowWelcomeNotif(true);
      }
    } catch (err) {
      console.error("Gagal memuat notifikasi bibit:", err);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(p => ({...p, ...userData}));
    setIsAuthenticated(true);
    fetchLatestNotif();
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    const savedUser = localStorage.getItem('montanaUser');
    if (savedUser) {
      setUser({ 
        name: savedUser, 
        photo: localStorage.getItem('montanaUserPhoto') || '',
        jabatan: localStorage.getItem('montanaUserJabatan') || 'Anggota Lapangan',
        telepon: localStorage.getItem('montanaUserPhone') || '',
        email: localStorage.getItem('montanaUserEmail') || '',
        activeSeconds: 0,
        lastSeen: new Date().toISOString()
      });
      setIsAuthenticated(true);
      fetchLatestNotif();
    }
    const savedSec = localStorage.getItem('montana_active_seconds');
    setActiveSeconds(savedSec ? parseInt(savedSec) : 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setActiveSeconds(prev => {
        const next = prev + 1;
        localStorage.setItem('montana_active_seconds', next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) return (
    <div className="max-w-lg mx-auto p-8 space-y-8 min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Skeleton className="w-full h-64 rounded-[32px]" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="aspect-square rounded-[24px]" />)}
      </div>
    </div>
  );

  if (!isAuthenticated) return <Login onVerified={handleLoginSuccess} />;

  const getWeatherIcon = () => {
    if (weatherCondition === 'rain') return 'fa-cloud-showers-heavy text-blue-400';
    if (weatherCondition === 'storm') return 'fa-cloud-bolt text-yellow-400';
    if (weatherCondition === 'cloudy') return 'fa-cloud text-slate-400';
    return 'fa-sun text-amber-500';
  };

  const getWeatherSummary = () => {
    switch (weatherCondition) {
      case 'clear': return 'Cerah Berawan';
      case 'rain': return 'Hujan Ringan';
      case 'storm': return 'Badai Petir';
      case 'cloudy': return 'Berawan Tebal';
      default: return 'Cerah';
    }
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-40 transition-all dark:bg-slate-950 text-slate-900 dark:text-white relative">
      <WeatherOverlay condition={weatherCondition} />
      
      <header className="sticky top-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl px-6 py-4 flex items-center justify-between border-b border-white/50 dark:border-slate-800">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfileEdit(true)}>
          <img src={user.photo} className="w-10 h-10 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md" />
          <div>
            <h1 className="text-sm font-black truncate w-24 sm:w-32">{user.name}</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.jabatan}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => {
              const conditions: WeatherCondition[] = ['clear', 'rain', 'storm', 'cloudy'];
              const next = conditions[(conditions.indexOf(weatherCondition) + 1) % conditions.length];
              setWeatherCondition(next);
            }}>
              <i className={`fas ${getWeatherIcon()} text-[11px]`}></i>
              <span className="text-[11px] font-black tracking-tighter text-slate-900 dark:text-white">{currentTime}</span>
              <span className="text-[7px] font-black text-slate-400 uppercase">WITA</span>
            </div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{getWeatherSummary()}</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 bg-white/80 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-white dark:border-slate-700 shadow-sm active:scale-90 transition-all">
            <i className={`fas ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-slate-400'}`}></i>
          </button>
        </div>
      </header>

      <main className="px-6 mt-8 space-y-10 relative z-10">
        {activeTab === 'home' ? (
          <>
            <GrowthCard currentSeconds={activeSeconds} />
            
            <section>
              <div className="mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Layanan Montana Pro</h3>
              </div>
              <MenuGrid onOpenMontana={() => setShowMontanaCamera(true)} />
            </section>

            <section className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                  Tim Lapangan (Live Presence)
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[7px] font-black flex items-center gap-1.5 transition-all">
                    LIVE STATUS
                  </span>
                </h3>
              </div>
              <div className="flex gap-10 overflow-x-auto no-scrollbar py-4 px-2">
                {FIELD_TEAM.map((member, index) => {
                  const status = teamStatuses[index];
                  return (
                    <button 
                      key={index} 
                      onClick={() => openWhatsApp(member.phone)}
                      className="flex flex-col items-center min-w-[120px] group transition-transform active:scale-95"
                    >
                      <div className="relative w-24 h-24 mb-4">
                        <div className={`w-full h-full rounded-full overflow-hidden border-4 ${status.isOnline ? 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-100 dark:border-slate-800'} p-1.5 transition-all group-hover:scale-105`}>
                           <div className="w-full h-full rounded-full overflow-hidden shadow-xl bg-slate-50 dark:bg-slate-800">
                              <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
                           </div>
                        </div>
                        <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 shadow-lg transition-all duration-700 ${status.isOnline ? 'bg-emerald-500 scale-110' : 'bg-slate-900 scale-100'}`}></div>
                      </div>
                      
                      <div className="text-center space-y-0.5">
                        <span className="text-[11px] font-black block truncate w-28 text-slate-900 dark:text-white uppercase tracking-tight">{member.name}</span>
                        <span className="text-[8px] font-bold block text-slate-400 dark:text-slate-500 uppercase tracking-tighter leading-tight h-6 flex items-center justify-center">{member.role}</span>
                        
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50 w-full">
                           <span className={`text-[7px] font-black block uppercase tracking-[0.2em] ${status.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                             {status.isOnline ? '• ONLINE' : '• OFFLINE'}
                           </span>
                           {!status.isOnline && status.lastSeen && (
                             <span className="text-[7px] font-bold block text-slate-300 dark:text-slate-600 uppercase tracking-tighter mt-1 opacity-70">
                               Terakhir: {status.lastSeen}
                             </span>
                           )}
                           {status.isOnline && (
                             <span className="text-[7px] font-bold block text-emerald-400/60 uppercase tracking-tighter mt-1 animate-pulse">
                               Aktif Sekarang
                             </span>
                           )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <AboutSection />
        )}
      </main>

      {showWelcomeNotif && latestBibit && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowWelcomeNotif(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border dark:border-slate-800 animate-drift-puff text-center overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-lg ${parseInt(latestBibit.keluar) > 0 ? 'bg-rose-100 text-rose-600 shadow-rose-500/20' : 'bg-emerald-100 text-emerald-600 shadow-emerald-500/20'}`}>
              <i className={`fas ${parseInt(latestBibit.keluar) > 0 ? 'fa-arrow-right-from-bracket' : 'fa-arrow-right-to-bracket'}`}></i>
            </div>
            <h2 className="text-xl font-black mb-2 tracking-tight">Update Histori Bibit</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Laporan Realisasi Terakhir</p>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-left mb-8">
              <p className="text-[13px] font-bold leading-relaxed text-slate-700 dark:text-slate-200">
                Bibit telah <span className={parseInt(latestBibit.keluar) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {parseInt(latestBibit.keluar) > 0 ? 'keluar' : 'masuk'}
                </span> pada tanggal <span className="text-emerald-600">{latestBibit.tanggal}</span> sejumlah <span className="text-emerald-600">{latestBibit.keluar || latestBibit.masuk}</span> dengan jenis bibit <span className="text-emerald-600">{latestBibit.jenisBibit || latestBibit.bibit}</span>.
              </p>
            </div>
            <button onClick={() => setShowWelcomeNotif(false)} className="w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Saya Mengerti</button>
          </div>
        </div>
      )}

      {showProfileEdit && <ProfileEdit user={user} onSave={(d) => { setUser(p => ({...p, ...d})); setShowProfileEdit(false); }} onClose={() => setShowProfileEdit(false)} />}
      {showMontanaCamera && <MontanaCameraV2 onClose={() => setShowMontanaCamera(false)} />}
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenMontana={() => setShowMontanaCamera(true)} />
    </div>
  );
};

export default App;
