import React from 'react';
import { Columns3 } from 'lucide-react';

export interface ComparisonColumn {
  title: string;
  items: string[];
  color?: string;
  badge?: string;
}

export interface ComparisonSlideProps {
  title?: string;
  columnA?: ComparisonColumn;
  columnB?: ComparisonColumn;
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const ComparisonSlide: React.FC<ComparisonSlideProps> = ({
  title = 'Side-by-Side Comparison',
  columnA = {
    title: 'Warm-Blooded Animals',
    items: ['Maintain constant body temp', 'Generate heat internally', 'Require more frequent food', 'Examples: Birds, Mammals'],
    color: '#3b82f6',
    badge: 'Category A',
  },
  columnB = {
    title: 'Cold-Blooded Animals',
    items: ['Body temp matches environment', 'Rely on sun/shade for warmth', 'Lower energy requirement', 'Examples: Reptiles, Fish'],
    color: '#10b981',
    badge: 'Category B',
  },
  customPalette,
}) => {
  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#fafafa' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-xl border border-slate-200 overflow-hidden"
    >
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Columns3 className="w-4 h-4 text-indigo-600" />
          <span>Feature Comparison</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-auto">
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xl font-extrabold text-blue-900">{columnA.title}</h3>
            {columnA.badge && <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{columnA.badge}</span>}
          </div>
          <ul className="space-y-2.5">
            {columnA.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 font-medium">
                <span className="text-blue-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xl font-extrabold text-emerald-900">{columnB.title}</h3>
            {columnB.badge && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">{columnB.badge}</span>}
          </div>
          <ul className="space-y-2.5">
            {columnB.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 font-medium">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
