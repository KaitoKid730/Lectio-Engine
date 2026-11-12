import React from 'react';
import { Sparkles, Star } from 'lucide-react';

export interface HeroTitleSlideProps {
  title?: string;
  subtitle?: string;
  backgroundGradient?: string[];
  decorativeShape?: 'circle' | 'blob' | 'star' | 'wave';
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const HeroTitleSlide: React.FC<HeroTitleSlideProps> = ({
  title = 'Title Here',
  subtitle,
  backgroundGradient = ['#4f46e5', '#7c3aed'],
  decorativeShape = 'circle',
  customPalette,
}) => {
  const bgStyle = backgroundGradient && backgroundGradient.length >= 2
    ? { background: `linear-gradient(135deg, ${backgroundGradient[0]}, ${backgroundGradient[1]})` }
    : { backgroundColor: customPalette?.bg || '#1e1b4b' };

  return (
    <div
      style={bgStyle}
      className="w-full h-full min-h-[420px] rounded-3xl p-8 sm:p-14 flex flex-col justify-center items-center text-center relative overflow-hidden text-white shadow-2xl transition-all select-none"
    >
      {/* Decorative floating shapes */}
      {decorativeShape === 'circle' && (
        <>
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        </>
      )}
      {decorativeShape === 'star' && (
        <div className="absolute top-8 right-10 text-yellow-300/30 animate-pulse pointer-events-none">
          <Star className="w-32 h-32 fill-current" />
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-sm font-semibold tracking-wide border border-white/20 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Interactive Story Session</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-balance text-white drop-shadow-md">
          {title}
        </h1>

        {subtitle && (
          <p className="text-lg sm:text-2xl font-medium text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
