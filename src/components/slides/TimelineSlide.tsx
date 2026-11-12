import React from 'react';
import { Milestone } from 'lucide-react';

export interface TimelineStep {
  stepNumber?: number | string;
  icon?: string;
  title: string;
  description: string;
}

export interface TimelineSlideProps {
  title?: string;
  subtitle?: string;
  steps?: TimelineStep[];
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const TimelineSlide: React.FC<TimelineSlideProps> = ({
  title = 'Timeline & Sequence',
  subtitle,
  steps = [
    { stepNumber: '1', icon: '🌱', title: 'Seed Stage', description: 'Planting the seed in nutrient soil.' },
    { stepNumber: '2', icon: '🌿', title: 'Sprouting', description: 'First leaves appear above the surface.' },
    { stepNumber: '3', icon: '🌻', title: 'Full Bloom', description: 'Flowers blossom into full beauty.' },
  ],
  customPalette,
}) => {
  const accent = customPalette?.accent || '#10b981';

  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#f0fdf4' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-xl border border-emerald-100 overflow-hidden"
    >
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <Milestone className="w-4 h-4 text-emerald-600" />
          <span>Step-by-Step Progress</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="text-xs sm:text-sm text-slate-600">{subtitle}</p>}
      </div>

      <div className="relative my-auto">
        {/* Horizontal connecting bar */}
        <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-1.5 bg-emerald-200 -translate-y-1/2 rounded-full z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200/80 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center space-y-3 group"
            >
              <div
                style={{ backgroundColor: accent }}
                className="w-12 h-12 rounded-full text-white font-extrabold flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform"
              >
                {step.icon || step.stepNumber || idx + 1}
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
