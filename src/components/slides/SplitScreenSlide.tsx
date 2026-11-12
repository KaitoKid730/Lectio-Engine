import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface SplitScreenSlideProps {
  title?: string;
  content?: string;
  bullets?: string[];
  imageUrl?: string;
  imagePrompt?: string;
  imagePosition?: 'left' | 'right';
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const SplitScreenSlide: React.FC<SplitScreenSlideProps> = ({
  title = 'Split Screen Slide',
  content,
  bullets = [],
  imageUrl,
  imagePrompt,
  imagePosition = 'right',
  customPalette,
}) => {
  const accent = customPalette?.accent || '#0284c7';
  const displayImage = imageUrl || 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80';

  const imageBlock = (
    <div className="w-full h-full min-h-[260px] sm:min-h-[340px] rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-100 relative group">
      <img
        src={displayImage}
        alt={imagePrompt || title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {imagePrompt && (
        <div className="absolute bottom-2 left-2 right-2 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] rounded-lg line-clamp-1 opacity-80">
          🎨 {imagePrompt}
        </div>
      )}
    </div>
  );

  const contentBlock = (
    <div className="flex flex-col justify-center space-y-5">
      <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
        {title}
      </h2>

      {content && (
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
          {content}
        </p>
      )}

      {bullets && bullets.length > 0 && (
        <ul className="space-y-3 pt-2">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" style={{ color: accent }} />
              <span className="text-slate-800 text-sm sm:text-base font-medium">{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#ffffff' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xl border border-slate-100 overflow-hidden"
    >
      {imagePosition === 'left' ? (
        <>
          {imageBlock}
          {contentBlock}
        </>
      ) : (
        <>
          {contentBlock}
          {imageBlock}
        </>
      )}
    </div>
  );
};
