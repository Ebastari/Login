
import React, { useMemo } from 'react';
import { GrowthLevel } from '../types';
import { LEVEL_THRESHOLDS } from '../constants';

interface GrowthCardProps {
  currentSeconds: number;
}

export const GrowthCard: React.FC<GrowthCardProps> = ({ currentSeconds }) => {
  const formattedTime = useMemo(() => {
    const days = Math.floor(currentSeconds / 86400);
    const hours = Math.floor((currentSeconds % 86400) / 3600);
    const minutes = Math.floor((currentSeconds % 3600) / 60);
    const seconds = currentSeconds % 60;
    return `${days}h ${hours}j ${minutes}m ${seconds}d`;
  }, [currentSeconds]);

  const growthData = useMemo(() => {
    const rimbaThreshold = LEVEL_THRESHOLDS[GrowthLevel.RIMBA];
    const totalProgress = Math.min(100, Math.round((currentSeconds / rimbaThreshold) * 100));

    let currentLevel = GrowthLevel.SEMAI;
    if (currentSeconds >= LEVEL_THRESHOLDS[GrowthLevel.RIMBA]) currentLevel = GrowthLevel.RIMBA;
    else if (currentSeconds >= LEVEL_THRESHOLDS[GrowthLevel.POHON]) currentLevel = GrowthLevel.POHON;
    else if (currentSeconds >= LEVEL_THRESHOLDS[GrowthLevel.TIANG]) currentLevel = GrowthLevel.TIANG;
    else if (currentSeconds >= LEVEL_THRESHOLDS[GrowthLevel.PANCANG]) currentLevel = GrowthLevel.PANCANG;

    return { currentLevel, totalProgress };
  }, [currentSeconds]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-7 shadow-xl shadow-emerald-900/5 dark:shadow-none border border-emerald-50 dark:border-slate-800 transition-all hover:shadow-2xl hover:shadow-emerald-900/10 dark:hover:border-emerald-500/30 group relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 group-hover:rotate-12 transition-transform">
              <i className="fas fa-seedling"></i>
            </div>
            <div>
              <h3 className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1">Status Pertumbuhan</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{growthData.currentLevel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600 leading-none">{formattedTime}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Waktu Aktif</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative pt-2">
            <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${growthData.totalProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div 
              className="absolute top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-2 border-emerald-500 transition-all duration-1000 ease-out z-20 flex items-center justify-center"
              style={{ left: `calc(${growthData.totalProgress}% - 8px)` }}
            >
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
          </div>

          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
            <span className={growthData.currentLevel === GrowthLevel.SEMAI ? 'text-emerald-600' : ''}>Semai</span>
            <span className={growthData.currentLevel === GrowthLevel.PANCANG ? 'text-emerald-600' : ''}>Pancang</span>
            <span className={growthData.currentLevel === GrowthLevel.TIANG ? 'text-emerald-600' : ''}>Tiang</span>
            <span className={growthData.currentLevel === GrowthLevel.POHON ? 'text-emerald-600' : ''}>Pohon</span>
            <span className={growthData.currentLevel === GrowthLevel.RIMBA ? 'text-emerald-600' : ''}>Rimba</span>
          </div>

          <div className="bg-emerald-50/50 dark:bg-slate-800/50 rounded-2xl p-4 flex justify-between items-center group-hover:bg-emerald-50 dark:group-hover:bg-slate-800 transition-colors">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Kemajuan Total</p>
              <p className="text-xl font-black text-emerald-900 dark:text-emerald-500">{growthData.totalProgress}%</p>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-bold text-slate-500 uppercase">Target: 30 Hari</p>
               <p className="text-[8px] font-black text-emerald-600/40 dark:text-emerald-400/40 uppercase tracking-tighter mt-1">Sistem Terintegrasi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
