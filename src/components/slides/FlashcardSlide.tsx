import React, { useState } from 'react';
import { RotateCw, Sparkles } from 'lucide-react';

export interface FlashcardSlideProps {
  frontText?: string;
  backText?: string;
  prompt?: string;
  category?: string;
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const FlashcardSlide: React.FC<FlashcardSlideProps> = ({
  frontText = 'What is Photosynthesis?',
  backText = 'Photosynthesis is the process used by plants to convert light energy into chemical energy to fuel their growth.',
  prompt = 'Click card or button to flip',
  category = 'Vocabulary Flashcard',
  customPalette,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#fdf4ff' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-6 sm:p-10 flex flex-col justify-between items-center shadow-xl border border-fuchsia-100 overflow-hidden"
    >
      <div className="w-full flex items-center justify-between text-xs font-bold text-fuchsia-700 uppercase tracking-wider">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-fuchsia-100 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-600" />
          {category}
        </span>
        <span className="text-slate-500 font-medium">{prompt}</span>
      </div>

      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full max-w-2xl h-56 sm:h-64 my-4 cursor-pointer perspective-1000 group"
      >
        <div
          className={`w-full h-full duration-500 transition-transform transform-style-3d relative rounded-3xl shadow-md border-2 ${
            isFlipped ? 'rotate-y-180 bg-fuchsia-900 text-white border-fuchsia-700' : 'bg-white text-slate-900 border-fuchsia-200 group-hover:border-fuchsia-400'
          } p-6 sm:p-10 flex flex-col items-center justify-center text-center`}
        >
          {!isFlipped ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-fuchsia-600 uppercase tracking-widest block">FRONT / QUESTION</span>
              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                {frontText}
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-widest block">BACK / ANSWER</span>
              <p className="text-lg sm:text-2xl font-semibold leading-relaxed">
                {backText}
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsFlipped(!isFlipped)}
        className="flex items-center gap-2 px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
      >
        <RotateCw className="w-4 h-4" />
        <span>Flip Flashcard ({isFlipped ? 'Show Front' : 'Show Back'})</span>
      </button>
    </div>
  );
};
