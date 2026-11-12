import React from 'react';
import { Quote } from 'lucide-react';

export interface QuoteSlideProps {
  quote?: string;
  author?: string;
  role?: string;
  avatarUrl?: string;
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const QuoteSlide: React.FC<QuoteSlideProps> = ({
  quote = "The only way to do great work is to love what you do.",
  author = "Steve Jobs",
  role = "Visionary & Creator",
  avatarUrl,
  customPalette,
}) => {
  const accent = customPalette?.accent || '#f59e0b';

  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#fffbeb' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-8 sm:p-14 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-xl border border-amber-100"
    >
      <div className="absolute top-6 left-8 text-amber-300/40 pointer-events-none">
        <Quote className="w-24 h-24 sm:w-36 sm:h-36 fill-current" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug italic font-serif">
          “{quote}”
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={author} className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-xl shadow-sm">
              {author ? author[0] : 'Q'}
            </div>
          )}

          <div className="text-left">
            <h4 className="text-lg font-bold text-slate-900 leading-tight">{author}</h4>
            {role && <p className="text-xs sm:text-sm text-slate-600 font-medium" style={{ color: accent }}>{role}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
