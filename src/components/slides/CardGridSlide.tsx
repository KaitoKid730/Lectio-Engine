import React from 'react';
import { Layers } from 'lucide-react';

export interface CardGridItem {
  icon?: string;
  title: string;
  description: string;
  badge?: string;
  color?: string;
}

export interface CardGridSlideProps {
  title?: string;
  subtitle?: string;
  cards?: CardGridItem[];
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const CardGridSlide: React.FC<CardGridSlideProps> = ({
  title = 'Key Highlights',
  subtitle,
  cards = [
    { icon: '🌟', title: 'Card One', description: 'Interesting details and description for the first point.' },
    { icon: '🚀', title: 'Card Two', description: 'Interesting details and description for the second point.' },
    { icon: '💡', title: 'Card Three', description: 'Interesting details and description for the third point.' },
  ],
  customPalette,
}) => {
  const cardBg = customPalette?.card || '#f8fafc';
  const accent = customPalette?.accent || '#0284c7';

  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#ffffff' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-xl border border-slate-100 overflow-hidden"
    >
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600" style={{ color: accent }}>
          <Layers className="w-4 h-4" />
          <span>Core Concepts</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-sm sm:text-base text-slate-600">{subtitle}</p>}
      </div>

      <div className={`grid grid-cols-1 ${cards.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4 sm:gap-6`}>
        {cards.map((card, idx) => (
          <div
            key={idx}
            style={{ backgroundColor: cardBg }}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 hover:border-sky-300 transition-all hover:shadow-md flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl sm:text-4xl p-2.5 rounded-xl bg-white shadow-xs border border-slate-100">
                {card.icon || '📌'}
              </span>
              {card.badge && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                  {card.badge}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
