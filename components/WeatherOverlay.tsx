
import React, { useMemo } from 'react';
import { WeatherCondition } from '../types';

interface WeatherOverlayProps {
  condition: WeatherCondition;
}

export const WeatherOverlay: React.FC<WeatherOverlayProps> = React.memo(({ condition }) => {
  const rainDrops = useMemo(() => {
    if (condition !== 'rain' && condition !== 'storm') return [];
    const count = condition === 'storm' ? 150 : 80;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      height: `${Math.random() * 30 + 30}px`,
      duration: `${0.3 + Math.random() * 0.4}s`,
      delay: `${Math.random() * 2}s`,
      opacity: condition === 'storm' ? 0.2 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2,
    }));
  }, [condition]);

  if (condition === 'unknown') return null;

  // Background gradients based on image reference
  const getGradientClass = () => {
    switch (condition) {
      case 'clear':
        return 'bg-gradient-to-br from-[#A8D8EA] via-[#B9E9FC] to-[#DDF7E3]';
      case 'rain':
        return 'bg-gradient-to-br from-[#4F709C] via-[#607EAA] to-[#7C99AC]';
      case 'storm':
        return 'bg-gradient-to-br from-[#213555] via-[#2D4356] to-[#435B66]';
      case 'cloudy':
        return 'bg-gradient-to-br from-[#B4CDE6] via-[#D1E1F0] to-[#E8F0F7]';
      default:
        return 'bg-slate-50';
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 ${getGradientClass()}`}>
      
      {/* 1. CERAH / CLEAR (Sun & Clouds) */}
      {condition === 'clear' && (
        <div className="absolute inset-0 flex items-center justify-center opacity-80">
          {/* Main Sun Core */}
          <div className="absolute top-[15%] right-[20%] w-[120px] h-[120px] bg-yellow-400 rounded-full blur-md shadow-[0_0_60px_rgba(250,204,21,0.6)] animate-pulse">
             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-200 opacity-80" />
          </div>
          
          {/* Large Soft Clouds */}
          <div className="absolute top-[25%] w-[80%] h-[150px] bg-white/40 rounded-full blur-[60px] animate-drift" />
          <div className="absolute bottom-[20%] w-[100%] h-[200px] bg-white/20 rounded-full blur-[80px] animate-drift" style={{ animationDelay: '-5s' }} />
        </div>
      )}

      {/* 2. HUJAN / RAIN */}
      {condition === 'rain' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/5" />
          {/* Muted Clouds */}
          <div className="absolute top-0 w-full h-[40%] bg-slate-300/30 rounded-full blur-[100px] animate-drift" />
          
          {/* Drops */}
          <div className="absolute inset-0">
            {rainDrops.map((drop) => (
              <div 
                key={drop.id}
                className="rain-drop"
                style={{
                  left: drop.left,
                  height: drop.height,
                  opacity: drop.opacity,
                  animationDuration: drop.duration,
                  animationDelay: drop.delay,
                  background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.4))'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. BADAI PETIR / STORM */}
      {condition === 'storm' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Lightning Flash (Custom Animation) */}
          <div className="absolute inset-0 bg-white opacity-0 pointer-events-none" style={{ animation: 'lightningFlash 6s infinite' }} />

          {/* Heavy Clouds */}
          <div className="absolute top-0 w-full h-[50%] bg-slate-900/40 rounded-full blur-[120px] animate-drift" />
          
          {/* Heavy Rain Drops */}
          <div className="absolute inset-0">
            {rainDrops.map((drop) => (
              <div 
                key={drop.id}
                className="rain-drop"
                style={{
                  left: drop.left,
                  height: drop.height,
                  opacity: drop.opacity,
                  animationDuration: drop.duration,
                  animationDelay: drop.delay,
                  background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.5))'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. BERAWAN / CLOUDY */}
      {condition === 'cloudy' && (
        <div className="absolute inset-0 opacity-60">
           <div className="absolute top-[20%] left-[10%] w-[60%] h-[120px] bg-white/60 rounded-full blur-[50px] animate-drift" />
           <div className="absolute bottom-[30%] right-[10%] w-[70%] h-[150px] bg-slate-100/40 rounded-full blur-[70px] animate-drift" style={{ animationDelay: '-10s' }} />
        </div>
      )}
    </div>
  );
});
