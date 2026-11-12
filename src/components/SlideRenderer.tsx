import React from 'react';
import { HeroTitleSlide } from './slides/HeroTitleSlide';
import { SplitScreenSlide } from './slides/SplitScreenSlide';
import { CardGridSlide } from './slides/CardGridSlide';
import { QuoteSlide } from './slides/QuoteSlide';
import { InteractiveQuizSlide } from './slides/InteractiveQuizSlide';
import { FlashcardSlide } from './slides/FlashcardSlide';
import { ImageWithOverlaySlide } from './slides/ImageWithOverlaySlide';
import { TimelineSlide } from './slides/TimelineSlide';
import { ComparisonSlide } from './slides/ComparisonSlide';
import { DiscussionPromptSlide } from './slides/DiscussionPromptSlide';

export const componentMap: Record<string, React.FC<any>> = {
  HeroTitle: HeroTitleSlide,
  SplitScreen: SplitScreenSlide,
  CardGrid: CardGridSlide,
  Quote: QuoteSlide,
  InteractiveQuiz: InteractiveQuizSlide,
  Flashcard: FlashcardSlide,
  ImageWithOverlay: ImageWithOverlaySlide,
  Timeline: TimelineSlide,
  Comparison: ComparisonSlide,
  DiscussionPrompt: DiscussionPromptSlide,
};

export interface SlideRendererProps {
  slide: {
    id?: string;
    component?: string;
    props?: Record<string, any>;
    layout?: string;
    title?: string;
    bullets?: string[];
    imageUrl?: string;
    activity?: any;
    customPalette?: any;
    style?: any;
  };
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({ slide }) => {
  if (!slide) return null;

  // 1. Direct Component Match
  const componentName = slide.component || slide.props?.component;
  const Component = componentName ? componentMap[componentName] : null;

  if (Component) {
    const combinedProps = {
      ...slide.props,
      customPalette: slide.customPalette || slide.style?.customPalette,
    };
    return <Component {...combinedProps} />;
  }

  // 2. Legacy Slide Fallback Mapping
  const customPalette = slide.customPalette || slide.style?.customPalette;
  const layout = (slide.layout || 'title').toLowerCase();

  if (layout === 'title') {
    return (
      <HeroTitleSlide
        title={slide.title || 'Untitled Slide'}
        subtitle={slide.bullets && slide.bullets.length > 0 ? slide.bullets.join(' • ') : undefined}
        customPalette={customPalette}
      />
    );
  }

  if (layout === 'quiz' || slide.activity?.type === 'quiz') {
    const act = slide.activity?.data || slide.activity || {};
    return (
      <InteractiveQuizSlide
        question={act.question || slide.title || 'Classroom Quiz'}
        options={act.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4']}
        correctAnswerIndex={act.correctAnswerIndex ?? 0}
        explanation={act.explanation || ''}
        customPalette={customPalette}
      />
    );
  }

  if (layout === 'bullets' || (slide.bullets && slide.bullets.length >= 3)) {
    const cards = (slide.bullets || ['Key Concept 1', 'Key Concept 2', 'Key Concept 3']).map((b, i) => {
      const parts = b.split(':');
      if (parts.length > 1) {
        return {
          icon: ['🌟', '💡', '🚀', '📌', '🎯'][i % 5],
          title: parts[0].trim(),
          description: parts.slice(1).join(':').trim(),
        };
      }
      return {
        icon: ['🌟', '💡', '🚀', '📌', '🎯'][i % 5],
        title: `Point ${i + 1}`,
        description: b,
      };
    });

    return (
      <CardGridSlide
        title={slide.title || 'Key Takeaways'}
        cards={cards}
        customPalette={customPalette}
      />
    );
  }

  if (layout === 'image' || slide.imageUrl) {
    return (
      <SplitScreenSlide
        title={slide.title || 'Visual Overview'}
        bullets={slide.bullets || []}
        imageUrl={slide.imageUrl}
        customPalette={customPalette}
      />
    );
  }

  // Default Fallback
  return (
    <HeroTitleSlide
      title={slide.title || 'Presentation Slide'}
      subtitle={slide.bullets?.[0]}
      customPalette={customPalette}
    />
  );
};
