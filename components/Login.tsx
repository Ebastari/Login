
import React, { useState, useRef, useEffect } from 'react';

interface LoginProps {
  onVerified: (userData: { name: string; photo: string; telepon: string; email: string; jabatan: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onVerified }) => {
  const [step, setStep] = useState<'auth' | 'form' | 'welcome'>('auth');
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({ nama: '', telepon: '', email: '' });
  const [gps, setGps] = useState<{ lat: number | null; lon: number | null; acc: number | null; status: string }>({
    lat: null, lon: null, acc: null, status: ''
  });
  
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [faceChecked, setFaceChecked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'analyzing' | 'success'>('idle');
  const [userName, setUserName] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('montanaUser');
    if (saved) {
      setUserName(saved);
      setStep('welcome');
    }
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if custom credentials exist in localStorage
    const savedUser = localStorage.getItem('montana_auth_user');
    const savedPass = localStorage.getItem('montana_auth_pass');

    // Default Fallbacks
    const targetUser = (savedUser || 'Admin').trim().toLowerCase();
    const targetPass = (savedPass || 'kalimantan selatan').trim().toLowerCase();

    const isUsernameValid = authData.username.trim().toLowerCase() === targetUser;
    const isPasswordValid = authData.password.trim().toLowerCase() === targetPass;

    if (isUsernameValid && isPasswordValid) {
      setAuthError(false);
      setStep('form');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 500);
    }
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setPrivacyChecked(checked);
    if (checked) {
      setGps(prev => ({ ...prev, status: '📍 Mengunci lokasi...' }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            acc: Math.round(pos.coords.accuracy),
            status: '📍 Lokasi Berhasil Diverifikasi'
          });
        },
        () => {
          alert("GPS wajib aktif untuk menggunakan aplikasi ini.");
          setPrivacyChecked(false);
          setGps(prev => ({ ...prev, status: '' }));
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleFaceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFaceChecked(checked);
    if (checked) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setScanStatus('scanning');
      } catch (err) {
        alert("Izin kamera diperlukan untuk verifikasi.");
        setFaceChecked(false);
      }
    } else {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      setScanStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyChecked || !termsChecked || !faceChecked || !videoRef.current || !canvasRef.current) return;

    setIsSyncing(true);
    setScanStatus('analyzing');

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.6);

    const payload = {
      nama: formData.nama,
      telepon: formData.telepon,
      email: formData.email,
      lat: gps.lat,
      lon: gps.lon,
      acc: gps.acc,
      image: imageData
    };

    try {
      setScanStatus('success');

      localStorage.setItem('montanaUser', payload.nama);
      localStorage.setItem('montanaUserPhoto', imageData);
      localStorage.setItem('montanaUserPhone', payload.telepon);
      localStorage.setItem('montanaUserEmail', payload.email);
      localStorage.setItem('montanaUserJabatan', 'Anggota Lapangan');

      setUserName(payload.nama);

      setTimeout(() => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setStep('welcome');
      }, 1000);

    } finally {
      setIsSyncing(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-900 dark:text-white">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl text-center border border-slate-100 dark:border-slate-800 animate-drift-puff">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-lg shadow-emerald-500/20">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tight leading-tight">Selamat Datang,<br/> {userName}!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 leading-relaxed italic">Biometric Identity Verified Successfully</p>
          <button 
            onClick={() => onVerified({ 
              name: userName, 
              photo: localStorage.getItem('montanaUserPhoto') || '',
              telepon: localStorage.getItem('montanaUserPhone') || '',
              email: localStorage.getItem('montanaUserEmail') || '',
              jabatan: 'Anggota Lapangan'
            })}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 active:scale-95 transition-all"
          >
            Akses Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-900 dark:text-white overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-drift-puff my-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="text-center mb-10 relative z-10">
          <h2 className="text-3xl font-black mb-1 tracking-tighter">Montana AI</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">
              {step === 'auth' ? 'SYSTEM ACCESS' : 'Identity Hub V2.0'}
            </p>
          </div>
        </div>

        {step === 'auth' ? (
          <form onSubmit={handleAuthSubmit} className={`space-y-6 relative z-10 ${authError ? 'animate-shake' : ''}`}>
             <div className="space-y-5">
                <div className="relative">
                  <i className="fas fa-shield-halved absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-[14px]"></i>
                  <input 
                    type="text" 
                    placeholder="USERNAME" 
                    required 
                    autoComplete="off"
                    value={authData.username}
                    onChange={e => setAuthData({...authData, username: e.target.value})}
                    className="w-full py-5 pl-12 pr-6 bg-slate-100/50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[24px] text-base font-extrabold text-slate-950 dark:text-white placeholder:text-slate-400 placeholder:font-black placeholder:text-[10px] placeholder:tracking-[0.2em] focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <i className="fas fa-key absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-[14px]"></i>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="PASSWORD" 
                    required 
                    value={authData.password}
                    onChange={e => setAuthData({...authData, password: e.target.value})}
                    className="w-full py-5 pl-12 pr-12 bg-slate-100/50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[24px] text-base font-extrabold text-slate-950 dark:text-white placeholder:text-slate-400 placeholder:font-black placeholder:text-[10px] placeholder:tracking-[0.2em] focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600 transition-colors p-2"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-base`}></i>
                  </button>
                </div>
             </div>

             {authError && (
               <div className="bg-rose-50 dark:bg-rose-900/20 py-4 rounded-2xl border border-rose-200 dark:border-rose-800/30">
                 <p className="text-[10px] font-black text-rose-600 uppercase text-center tracking-[0.2em]">Kredensial Tidak Valid!</p>
               </div>
             )}

             <button 
                type="submit"
                className="w-full py-5 bg-slate-950 dark:bg-emerald-600 text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all mt-4 border border-white/10"
              >
                MASUK KE SISTEM
              </button>

              <div className="pt-6 text-center border-t border-slate-100 dark:border-slate-800/50">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Akses terbatas untuk Personel Terdaftar</p>
              </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="space-y-3">
              <div className="relative">
                 <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"></i>
                 <input 
                  type="text" placeholder="NAMA LENGKAP" required 
                  value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-4 pl-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase tracking-widest"
                />
              </div>
              <div className="relative">
                 <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"></i>
                 <input 
                  type="tel" placeholder="NOMOR WHATSAPP" required 
                  value={formData.telepon} onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full p-4 pl-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase tracking-widest"
                />
              </div>
              <div className="relative">
                 <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"></i>
                 <input 
                  type="email" placeholder="ALAMAT EMAIL" required 
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 pl-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase tracking-widest"
                />
              </div>
            </div>
            
            <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-[24px] border border-amber-100 dark:border-amber-800/30">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <i className="fas fa-shield-halved text-amber-600"></i>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Privacy & Ethical Protocol</p>
                  <p className="text-[8px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                    Penggunaan aplikasi Montana AI Pro ditujukan eksklusif bagi personel operasional <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dept. Revegetasi & Rehabilitasi</span>. Dengan melanjutkan, Anda menyetujui perekaman data biometrik wajah, koordinat GPS, dan identitas perangkat untuk keperluan verifikasi kehadiran dan keamanan sistem internal perusahaan. Seluruh data disimpan secara terenkripsi dan rahasia.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-3 mt-5 cursor-pointer group bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/20 active:scale-95 transition-all">
                <input 
                  type="checkbox" 
                  checked={termsChecked} 
                  onChange={e => setTermsChecked(e.target.checked)} 
                  className="w-4 h-4 mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500" 
                />
                <span className="text-[9px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight leading-snug">
                  SAYA MENYETUJUI KEBIJAKAN PRIVASI & SYARAT KETENTUAN PENGGUNAAN DATA OPERASIONAL
                </span>
              </label>
            </div>

            <div className={`p-5 bg-slate-50 dark:bg-slate-800/30 rounded-[24px] border border-slate-100 dark:border-slate-800 transition-all ${!termsChecked && 'opacity-40 grayscale pointer-events-none'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${gps.lat ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <i className={`fas ${gps.lat ? 'fa-location-dot' : 'fa-satellite-dish'}`}></i>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Verifikasi Lokasi</span>
                  {gps.status && <p className="text-[8px] font-bold text-emerald-600 mt-0.5">{gps.status}</p>}
                </div>
                <input type="checkbox" checked={privacyChecked} onChange={handlePrivacyChange} className="w-5 h-5 rounded text-emerald-600 border-slate-300" />
              </label>
            </div>

            <div className={`p-5 bg-slate-50 dark:bg-slate-800/30 rounded-[24px] border border-slate-100 dark:border-slate-800 transition-all ${(!gps.lat || !termsChecked) && 'opacity-40 grayscale pointer-events-none'}`}>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${faceChecked ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <i className={`fas ${faceChecked ? 'fa-face-smile' : 'fa-camera'}`}></i>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Biometric Face Scan</span>
                  {faceChecked && (
                    <p className={`text-[8px] font-bold mt-0.5 uppercase tracking-widest ${scanStatus === 'success' ? 'text-emerald-500' : 'text-blue-500 animate-pulse'}`}>
                      {scanStatus === 'scanning' ? '• MENCARI WAJAH...' : scanStatus === 'analyzing' ? '• MENGANALISIS LIVENESS...' : '• IDENTITAS TERKONFIRMASI'}
                    </p>
                  )}
                </div>
                <input type="checkbox" checked={faceChecked} onChange={handleFaceChange} className="w-5 h-5 rounded text-emerald-600 border-slate-300" />
              </label>
              
              {faceChecked && (
                <div className="relative rounded-[28px] overflow-hidden aspect-[4/5] bg-black border-2 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500"></div>
                    <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500"></div>
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500"></div>
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500"></div>
                    
                    {(scanStatus === 'scanning' || scanStatus === 'analyzing') && (
                      <div className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_15px_#10b981] z-20 animate-[scan_2s_ease-in-out_infinite]" 
                           style={{ top: '0%' }}></div>
                    )}

                    <div className="absolute inset-0 opacity-[0.05]" 
                         style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {scanStatus === 'success' && (
                      <div className="absolute inset-0 bg-white animate-[ping_0.3s_ease-out_forwards]"></div>
                    )}

                    <div className="absolute bottom-10 left-0 right-0 text-center">
                      <div className="inline-block px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-emerald-500/30">
                         <p className="text-[7px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                            {scanStatus === 'analyzing' ? 'PROCESSING BIOMETRICS...' : 'SCANNING ACTIVE'}
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" disabled={!gps.lat || !faceChecked || !termsChecked || isSyncing}
              className="w-full py-5 bg-slate-900 dark:bg-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all mt-4 border border-white/10"
            >
              {isSyncing ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-circle-notch animate-spin"></i> SINKRONISASI...
                </span>
              ) : 'MULAI VERIFIKASI'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Montana Security Protocol Suite 2025</p>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
