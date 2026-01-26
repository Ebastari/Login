
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';

interface ProfileEditProps {
  user: UserProfile;
  onSave: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    jabatan: user.jabatan || 'Anggota Lapangan',
    telepon: user.telepon || '',
    email: user.email || '',
    photo: user.photo,
    // Add internal auth credentials state
    authUsername: localStorage.getItem('montana_auth_user') || 'Admin',
    authPassword: localStorage.getItem('montana_auth_pass') || 'kalimantan Selatan'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save custom login credentials to localStorage
    localStorage.setItem('montana_auth_user', formData.authUsername);
    localStorage.setItem('montana_auth_pass', formData.authPassword);
    
    onSave({
      name: formData.name,
      jabatan: formData.jabatan,
      telepon: formData.telepon,
      email: formData.email,
      photo: formData.photo
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl animate-drift-puff border-t dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
            <img 
              src={formData.photo} 
              className="w-24 h-24 rounded-[32px] object-cover shadow-2xl border-4 border-white dark:border-slate-800 group-hover:opacity-80 transition-all" 
              alt="Profile"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fas fa-camera text-white text-xl"></i>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
          <p className="mt-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest">Klik Foto untuk Ganti</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Identitas Anggota</h4>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Jabatan / Peran</label>
              <input 
                type="text" 
                value={formData.jabatan}
                onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                <input 
                  type="tel" 
                  value={formData.telepon}
                  onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* New Section: System Login Settings */}
          <div className="space-y-4 p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[28px] border border-emerald-100 dark:border-emerald-800/30">
            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-2 px-1 flex items-center gap-2">
              <i className="fas fa-user-shield text-[12px]"></i> AKSES LOGIN SISTEM
            </h4>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Username Login Baru</label>
              <div className="relative">
                <i className="fas fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/30 text-xs"></i>
                <input 
                  type="text" 
                  value={formData.authUsername}
                  onChange={e => setFormData({ ...formData, authUsername: e.target.value })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Password Login Baru</label>
              <div className="relative">
                <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600/30 text-xs"></i>
                <input 
                  type="text" 
                  value={formData.authPassword}
                  onChange={e => setFormData({ ...formData, authPassword: e.target.value })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-2 text-center">Data disimpan di memori perangkat lokal ini</p>
          </div>

          <div className="flex gap-4 mt-8 pt-2 sticky bottom-0 bg-white dark:bg-slate-900 pb-2 border-t dark:border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
