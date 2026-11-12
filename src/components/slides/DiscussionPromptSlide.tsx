import React from 'react';
import { MessageSquare, Lightbulb } from 'lucide-react';

export interface DiscussionPromptSlideProps {
  question?: string;
  subtitle?: string;
  discussionTips?: string[];
  speechBubbleColor?: string;
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const DiscussionPromptSlide: React.FC<DiscussionPromptSlideProps> = ({
  question = 'What would you do if you saw a lost baby bird in your yard?',
  subtitle = 'Turn to your talk partner and share your thoughts!',
  discussionTips = [
    'Think about safety first.',
    'Would you look for its nest?',
    'Who could you ask for help?',
  ],
  customPalette,
}) => {
  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#fef3c7' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-6 sm:p-10 flex flex-col justify-between items-center text-center shadow-xl border border-amber-200 overflow-hidden"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
        <MessageSquare className="w-4 h-4 text-amber-700" />
        <span>Classroom Discussion Prompt</span>
      </div>

      <div className="my-auto max-w-3xl space-y-6">
        <div className="relative bg-white p-8 sm:p-10 rounded-3xl shadow-md border-2 border-amber-300 text-slate-900">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            “{question}”
          </h2>
          {/* Speech bubble tail pointer */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-r-2 border-b-2 border-amber-300 rotate-45" />
        </div>

        {subtitle && (
          <p className="text-base sm:text-xl font-bold text-amber-900 pt-2">
            🗣️ {subtitle}
          </p>
        )}
      </div>

      {discussionTips && discussionTips.length > 0 && (
        <div className="w-full max-w-2xl bg-amber-100/80 p-4 rounded-2xl border border-amber-200 flex items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-amber-900">
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            {discussionTips.map((tip, idx) => (
              <span key={idx} className="bg-white/80 px-3 py-1 rounded-full shadow-2xs">
                {tip}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
