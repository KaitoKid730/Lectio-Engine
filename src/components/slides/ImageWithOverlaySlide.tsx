import React from 'react';

export interface ImageWithOverlaySlideProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  imagePrompt?: string;
  overlayPosition?: 'center' | 'bottom-left' | 'bottom-right';
  customPalette?: { bg?: string; text?: string; accent?: string; card?: string };
}

export const ImageWithOverlaySlide: React.FC<ImageWithOverlaySlideProps> = ({
  title = 'A Wing Beats 80 Times a Second!',
  description = 'Hummingbirds are the only birds that can fly backwards, sideways, and even upside down!',
  imageUrl = 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=1200&auto=format&fit=crop&q=80',
  imagePrompt,
  overlayPosition = 'bottom-left',
}) => {
  const positionClass =
    overlayPosition === 'center'
      ? 'justify-center items-center text-center'
      : overlayPosition === 'bottom-right'
      ? 'justify-end items-end text-right'
      : 'justify-end items-start text-left';

  return (
    <div className="w-full h-full min-h-[420px] rounded-3xl relative overflow-hidden shadow-2xl flex flex-col p-6 sm:p-10 select-none border border-slate-800">
      <img
        src={imageUrl}
        alt={imagePrompt || title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className={`relative z-10 w-full h-full flex flex-col ${positionClass} mt-auto`}>
        <div className="max-w-2xl p-6 sm:p-8 rounded-3xl bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-yellow-300">
            {title}
          </h2>
          {description && (
            <p className="text-sm sm:text-lg font-medium text-slate-100 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
