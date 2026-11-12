import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

export interface InteractiveQuizSlideProps {
  question?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const InteractiveQuizSlide: React.FC<InteractiveQuizSlideProps> = ({
  question = 'What is the fastest bird on earth?',
  options = ['Peregrine Falcon', 'Hummingbird', 'Ostrich', 'Golden Eagle'],
  correctAnswerIndex = 0,
  explanation = 'The Peregrine Falcon can reach speeds of over 240 mph during its characteristic hunting stoop!',
  customPalette,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div
      style={{ backgroundColor: customPalette?.bg || '#f0f9ff' }}
      className="w-full h-full min-h-[420px] rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-xl border border-sky-100 overflow-hidden"
    >
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Quick Quiz Time!</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {question}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-4">
        {options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === correctAnswerIndex;
          let btnStyle = "bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50/50";

          if (selectedIdx !== null) {
            if (isCorrect) {
              btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm";
            } else if (isSelected) {
              btnStyle = "bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-sm";
            } else {
              btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between text-left text-sm sm:text-base font-semibold min-h-[64px] ${btnStyle}`}
            >
              <span>{opt}</span>
              {selectedIdx !== null && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
              {selectedIdx !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {selectedIdx !== null && explanation && (
        <div className="p-4 rounded-2xl bg-white border border-sky-200 shadow-xs text-xs sm:text-sm text-slate-700 animate-fadeIn flex items-start gap-3">
          <span className="text-xl shrink-0">💡</span>
          <div>
            <span className="font-bold text-sky-900 block mb-0.5">Explanation:</span>
            <span>{explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
