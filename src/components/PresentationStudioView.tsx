import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import {
  Presentation,
  Play,
  Download,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  HelpCircle,
  RotateCw,
  ImageIcon,
  Layout,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Palette,
  Loader2,
  BookOpen,
  Film,
  Wand2,
  PlayCircle,
  Layers,
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { SlideRenderer } from './SlideRenderer';

interface SlideActivity {
  question?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  front?: string;
  back?: string;
  prompt?: string;
  talkingPoints?: string[];
  animation?: string;
}

export interface SlideStyle {
  bgGradient?: [string, string] | string[];
  accentColor?: string;
  titleColor?: string;
  textColor?: string;
  shape?: 'blob' | 'wave' | 'starburst' | 'cloud' | 'none';
  fontVibe?: 'bubbly' | 'bold' | 'rounded';
  decorations?: string[];
  visualScore?: number;
  creativityScore?: number;
}

export interface Slide {
  id: string;
  presentationId: string;
  slideOrder: number;
  layout: 'title' | 'bullets' | 'image' | 'quiz' | 'flashcard' | 'discussion';
  title: string;
  bullets: string[];
  speakerNotes?: string;
  imageUrl?: string;
  activity?: SlideActivity;
  animation?: string;
  style?: SlideStyle;
  component?: string;
  props?: Record<string, any>;
  composition?: any[];
  imageScore?: number;
  image_score?: number;
}

interface PresentationData {
  id: string;
  title: string;
  theme: string;
  designBrief?: string;
  customPalette?: { bg?: string; accent?: string; text?: string; card?: string };
  custom_palette?: any;
  designReview?: any;
  status: 'draft' | 'generating' | 'ready' | 'failed';
  slides: Slide[];
}

interface BookOption {
  id: string;
  title: string;
}

interface LessonOption {
  id: string;
  title: string;
}

export interface ThemeStyle {
  bg: string;
  text: string;
  accent: string;
  card: string;
  font: string;
  badge: string;
  button: string;
  decoration?: string;
  underline: string;
}

export interface AnimationPreset {
  id: string;
  name: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'reveal';
  description: string;
  renderSvg: () => React.ReactNode;
}

export const getAnimationCSS = (animId?: string): React.CSSProperties => {
  if (!animId) return {};
  switch (animId) {
    case 'fade': return { animation: 'ppt-fade 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'fade-out': return { animation: 'ppt-fade-out 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'fly-in': return { animation: 'ppt-fly-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'fly-out': return { animation: 'ppt-fly-out 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'float-in': return { animation: 'ppt-float-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'float-out': return { animation: 'ppt-float-out 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'grow-n-turn': return { animation: 'ppt-grow-n-turn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'shrink-n-turn': return { animation: 'ppt-shrink-n-turn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'zoom': return { animation: 'ppt-zoom 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'zoom-out': return { animation: 'ppt-zoom-out 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'expand': return { animation: 'ppt-expand 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'peek-in': return { animation: 'ppt-peek-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'swivel': return { animation: 'ppt-swivel 1.5s ease-in-out forwards' };
    case 'swivel-out': return { animation: 'ppt-swivel-out 1.5s ease-in-out forwards' };
    case 'bounce': return { animation: 'ppt-bounce 1.5s ease-out forwards' };
    case 'bounce-out': return { animation: 'ppt-bounce-out 1.5s ease-in forwards' };
    case 'pulse': return { animation: 'ppt-pulse 1.2s ease-in-out forwards' };
    case 'teeter': return { animation: 'ppt-teeter 1.5s ease-in-out forwards' };
    case 'spin': return { animation: 'ppt-spin 2s cubic-bezier(0.16, 1, 0.3, 1) forwards' };
    case 'wipe': return { animation: 'ppt-wipe 1.2s ease-out forwards' };
    case 'wipe-out': return { animation: 'ppt-wipe-out 1.2s ease-in forwards' };
    case 'split-in': return { animation: 'ppt-split-left 1.2s ease-out forwards' };
    case 'split-out': return { animation: 'ppt-splitout-left 1.2s ease-in forwards' };
    case 'shape': return { animation: 'ppt-shape-circle 1.2s ease-out forwards' };
    case 'shape-out': return { animation: 'ppt-shapeout-circle 1.2s ease-in forwards' };
    case 'wheel': return { animation: 'ppt-wheel-circle 1.2s linear forwards' };
    case 'wheel-out': return { animation: 'ppt-wheelout-circle 1.2s linear forwards' };
    default: return {};
  }
};

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'fade',
    name: 'Fade',
    category: 'entrance',
    description: 'Smooth opacity fade-in transition',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold" style={{ animation: 'ppt-fade 2s infinite' }}>
          Fade
        </text>
      </svg>
    ),
  },
  {
    id: 'fade-out',
    name: 'Fade-out',
    category: 'exit',
    description: 'Dissolve opacity fade-out transition',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold" style={{ animation: 'ppt-fade-out 2s infinite' }}>
          Fade-out
        </text>
      </svg>
    ),
  },
  {
    id: 'fly-in',
    name: 'Fly-in',
    category: 'entrance',
    description: 'Rotates 90° and flies in from right margin',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-fly-in 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Fly-in
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'fly-out',
    name: 'Fly-out',
    category: 'exit',
    description: 'Rotates 90° and flies out toward top right',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-fly-out 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Fly-out
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'float-in',
    name: 'Float-in',
    category: 'entrance',
    description: 'Floats gracefully up from lower page boundary',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-float-in 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Float-in
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'float-out',
    name: 'Float-out',
    category: 'exit',
    description: 'Floats down and fades out off screen',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-float-out 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Float-out
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'grow-n-turn',
    name: 'Grow-n-turn',
    category: 'entrance',
    description: 'Scales up from zero while untwisting 90°',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-grow-n-turn 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="22" fontWeight="bold">
            Grow-n-turn
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'shrink-n-turn',
    name: 'Shrink-n-turn',
    category: 'exit',
    description: 'Shrinks to point while twisting 90° away',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-shrink-n-turn 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="20" fontWeight="bold">
            Shrink-n-turn
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'entrance',
    description: 'Zooms in rapidly from center point',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-zoom 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Zoom
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'zoom-out',
    name: 'Zoom-out',
    category: 'exit',
    description: 'Zooms out into background center',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-zoom-out 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Zoom-out
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'expand',
    name: 'Expand',
    category: 'entrance',
    description: '3D Y-axis flip expansion from 90° edge',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-expand 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Expand
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'peek-in',
    name: 'Peek-in',
    category: 'entrance',
    description: 'Peeks up from bottom with delayed reveal',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-peek-in 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Peek-in
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'swivel',
    name: 'Swivel',
    category: 'entrance',
    description: 'Full 360° 3D Y-axis spinning entrance',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-swivel 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Swivel
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'swivel-out',
    name: 'Swivel-out',
    category: 'exit',
    description: 'Full 360° 3D Y-axis spinning exit',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-swivel-out 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="22" fontWeight="bold">
            Swivel-out
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'bounce',
    name: 'Bounce',
    category: 'entrance',
    description: 'Playful parabolic multi-bounce motion',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-bounce 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Bounce
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'bounce-out',
    name: 'Bounce-out',
    category: 'exit',
    description: 'Playful bouncing exit off screen',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-bounce-out 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="22" fontWeight="bold">
            Bounce-out
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'emphasis',
    description: 'Rhythmic scaling pulse for emphasis',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-pulse 1.2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Pulse
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'teeter',
    name: 'Teeter',
    category: 'emphasis',
    description: 'Playful side-to-side rotation wobble',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-teeter 2s infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Teeter
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'spin',
    name: 'Spin',
    category: 'emphasis',
    description: '720° full circular spin rotation',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <g style={{ transformOrigin: 'center', animation: 'ppt-spin 4s linear infinite' }}>
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
            Spin
          </text>
        </g>
      </svg>
    ),
  },
  {
    id: 'wipe',
    name: 'Wipe',
    category: 'reveal',
    description: 'Vertical top-to-bottom wipe curtain reveal',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
          Wipe
        </text>
        <rect width="100%" height="100%" fill="#181818" style={{ animation: 'ppt-wipe 2s infinite' }} />
      </svg>
    ),
  },
  {
    id: 'wipe-out',
    name: 'Wipe-out',
    category: 'reveal',
    description: 'Vertical bottom-to-top wipe curtain cover',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="22" fontWeight="bold">
          Wipe-out
        </text>
        <rect width="100%" height="100%" fill="#181818" style={{ animation: 'ppt-wipe-out 2s infinite' }} />
      </svg>
    ),
  },
  {
    id: 'split-in',
    name: 'Split-in',
    category: 'reveal',
    description: 'Dual door curtains splitting apart horizontally',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
          Split-in
        </text>
        <rect width="50%" height="100%" x="0%" fill="#181818" style={{ animation: 'ppt-split-left 2s infinite linear' }} />
        <rect width="50%" height="100%" x="50%" fill="#181818" style={{ animation: 'ppt-split-right 2s infinite linear' }} />
      </svg>
    ),
  },
  {
    id: 'split-out',
    name: 'Split-out',
    category: 'reveal',
    description: 'Dual door curtains closing together horizontally',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="22" fontWeight="bold">
          Split-out
        </text>
        <rect width="50%" height="100%" x="0%" fill="#181818" style={{ animation: 'ppt-splitout-left 2s infinite linear' }} />
        <rect width="50%" height="100%" x="50%" fill="#181818" style={{ animation: 'ppt-splitout-right 2s infinite linear' }} />
      </svg>
    ),
  },
  {
    id: 'shape',
    name: 'Shape',
    category: 'reveal',
    description: 'Iris circular aperture reveal effect',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
          Shape
        </text>
        <circle cx="50%" cy="50%" r="100" fill="#181818" style={{ animation: 'ppt-shape-circle 2s infinite' }} />
      </svg>
    ),
  },
  {
    id: 'shape-out',
    name: 'Shape-out',
    category: 'reveal',
    description: 'Iris circular aperture closing cover effect',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="22" fontWeight="bold">
          Shape-out
        </text>
        <circle cx="50%" cy="50%" r="0" fill="#181818" style={{ animation: 'ppt-shapeout-circle 2s infinite' }} />
      </svg>
    ),
  },
  {
    id: 'wheel',
    name: 'Wheel',
    category: 'reveal',
    description: 'Circular clock-hand radial stroke reveal',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="24" fontWeight="bold">
          Wheel
        </text>
        <circle
          cx="50%"
          cy="50%"
          r="75"
          fill="transparent"
          stroke="#181818"
          strokeWidth="150"
          strokeDasharray="471"
          strokeDashoffset="471"
          style={{
            animation: 'ppt-wheel-circle 2s linear infinite reverse',
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>
    ),
  },
  {
    id: 'wheel-out',
    name: 'Wheel-out',
    category: 'reveal',
    description: 'Circular clock-hand radial stroke cover',
    renderSvg: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-xl overflow-hidden" viewBox="0 0 200 120">
        <rect width="100%" height="100%" fill="#181818" />
        <text x="50%" y="60%" textAnchor="middle" fill="white" fontFamily="Trebuchet MS, sans-serif" fontSize="22" fontWeight="bold">
          Wheel-out
        </text>
        <circle
          cx="50%"
          cy="50%"
          r="75"
          fill="transparent"
          stroke="#181818"
          strokeWidth="150"
          strokeDasharray="471"
          strokeDashoffset="471"
          style={{
            animation: 'ppt-wheelout-circle 2s linear infinite reverse',
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>
    ),
  },
];

export interface ThemeStyle {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  card: string;
  font: string;
  badge: string;
  button: string;
  underline: string;
  accentBar: string;
  dotGrid: string;
  decoration?: string;
}

export const getThemeStyles = (themeName: string, customPalette?: { bg?: string; accent?: string; text?: string; card?: string; font?: string }): ThemeStyle => {
  if (themeName === 'custom' || customPalette) {
    const bgVal = customPalette?.bg || '#0f172a';
    const accentVal = customPalette?.accent || '#818cf8';
    const textVal = customPalette?.text || '#f8fafc';
    const cardVal = customPalette?.card || '#1e293b';
    const fontVal = customPalette?.font === 'serif' ? 'font-serif' : 'font-sans';

    return {
      id: 'custom',
      name: 'AI Custom Palette',
      bg: `bg-[${bgVal}]`,
      text: `text-[${textVal}]`,
      accent: `text-[${accentVal}]`,
      card: `bg-[${cardVal}] border border-white/10 text-[${textVal}] shadow-md`,
      font: fontVal,
      badge: `bg-[${accentVal}]/20 text-[${accentVal}] border border-[${accentVal}]/30`,
      button: `bg-[${accentVal}] text-white hover:opacity-90`,
      underline: `bg-[${accentVal}]`,
      accentBar: `bg-[${accentVal}]`,
      dotGrid: 'bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:20px_20px] opacity-20',
    };
  }

  switch (themeName) {
    case 'editorial':
      return {
        id: 'editorial',
        name: 'Editorial',
        bg: 'bg-[#fbf9f5]',
        text: 'text-[#1a1a1a]',
        accent: 'text-[#1a1a1a]',
        card: 'bg-[#f3efe6] border border-[#1a1a1a]/15 text-[#1a1a1a] shadow-xs',
        font: 'font-serif',
        badge: 'bg-[#1a1a1a]/10 text-[#1a1a1a] border border-[#1a1a1a]/20',
        button: 'bg-[#1a1a1a] hover:bg-[#333333] text-[#fbf9f5]',
        underline: 'bg-[#1a1a1a]',
        accentBar: 'bg-[#1a1a1a]',
        dotGrid: 'bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] opacity-10',
      };
    case 'tech-glass':
      return {
        id: 'tech-glass',
        name: 'Tech Glass',
        bg: 'bg-slate-950',
        text: 'text-slate-100',
        accent: 'text-indigo-400',
        card: 'backdrop-blur-md bg-white/5 border border-white/10 text-white shadow-xl',
        font: 'font-sans',
        badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        button: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30',
        underline: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
        accentBar: 'bg-indigo-500',
        dotGrid: 'bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:24px_24px] opacity-20',
      };
    case 'corporate':
      return {
        id: 'corporate',
        name: 'Corporate Navy',
        bg: 'bg-[#0a192f]',
        text: 'text-slate-100',
        accent: 'text-cyan-400',
        card: 'bg-[#112240] border-l-4 border-l-cyan-500 border-y border-r border-slate-700/60 text-slate-100 shadow-md',
        font: 'font-sans',
        badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        button: 'bg-cyan-600 hover:bg-cyan-500 text-white',
        underline: 'bg-cyan-500',
        accentBar: 'bg-cyan-500',
        dotGrid: 'bg-[radial-gradient(rgba(6,182,212,0.15)_1px,transparent_1px)] [background-size:20px_20px] opacity-25',
      };
    case 'minimal':
      return {
        id: 'minimal',
        name: 'Minimal Light',
        bg: 'bg-slate-50',
        text: 'text-slate-900',
        accent: 'text-slate-900',
        card: 'bg-white border border-slate-200 text-slate-800 shadow-xs',
        font: 'font-sans',
        badge: 'bg-slate-200 text-slate-800 border border-slate-300',
        button: 'bg-slate-900 hover:bg-slate-800 text-white',
        underline: 'bg-slate-900',
        accentBar: 'bg-slate-900',
        dotGrid: 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40',
      };
    case 'storybook':
      return {
        id: 'storybook',
        name: 'Storybook Cream',
        bg: 'bg-[#FDFBF7]',
        text: 'text-[#292524]',
        accent: 'text-[#B45309]',
        card: 'bg-[#FFFDF9] border border-[#E7E5E4] text-[#292524] shadow-xs',
        font: 'font-serif',
        badge: 'bg-[#F59E0B]/10 text-[#B45309] border border-[#F59E0B]/30',
        button: 'bg-[#B45309] hover:bg-[#92400E] text-white',
        underline: 'bg-[#B45309]',
        accentBar: 'bg-[#B45309]',
        dotGrid: 'bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] opacity-30',
      };
    case 'modern':
    default:
      return {
        id: 'modern',
        name: 'Modern Slate',
        bg: 'bg-slate-900',
        text: 'text-slate-100',
        accent: 'text-indigo-400',
        card: 'bg-slate-800/90 border border-slate-700 text-slate-100 shadow-md',
        font: 'font-sans',
        badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        underline: 'bg-indigo-500',
        accentBar: 'bg-indigo-500',
        dotGrid: 'bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:20px_20px] opacity-20',
      };
  }
};

export const AnimationStudioModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeAnimation?: string;
  onSelectAnimation: (animId: string, applyToAll: boolean) => void;
}> = ({ isOpen, onClose, activeAnimation = 'fade', onSelectAnimation }) => {
  const [filter, setFilter] = useState<'all' | 'entrance' | 'exit' | 'emphasis' | 'reveal'>('all');

  if (!isOpen) return null;

  const filtered = ANIMATION_PRESETS.filter((p) => filter === 'all' || p.category === filter);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                PowerPoint Animation Gallery
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                  27 SVG Keyframe Presets
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live interactive motion previews. Select any animation to apply to your current slide or the entire presentation deck.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-2 py-4 border-b border-slate-800/80 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-2">Category:</span>
          {(['all', 'entrance', 'exit', 'emphasis', 'reveal'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? `All Presets (${ANIMATION_PRESETS.length})` : `${cat} (${ANIMATION_PRESETS.filter((p) => p.category === cat).length})`}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-1">
          {filtered.map((preset) => {
            const isActive = activeAnimation === preset.id;
            return (
              <div
                key={preset.id}
                className={`group relative bg-slate-950 border-2 rounded-2xl p-3 flex flex-col justify-between transition-all hover:scale-[1.02] ${
                  isActive ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* SVG Card Display */}
                <div className="aspect-16/10 w-full rounded-xl overflow-hidden mb-3 relative bg-[#181818]">
                  {preset.renderSvg()}
                  {isActive && (
                    <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Active
                    </span>
                  )}
                </div>

                {/* Preset Metadata */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm text-white">{preset.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{preset.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectAnimation(preset.id, false);
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all text-center"
                  >
                    Apply Slide
                  </button>
                  <button
                    onClick={() => {
                      onSelectAnimation(preset.id, true);
                      onClose();
                    }}
                    title="Apply to all slides in presentation"
                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    Apply All
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Click any card action to set slide animation behavior.</span>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors">
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};

export const DesignReviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  brief?: string;
  reviews: Array<{ slideId: string; approved: boolean; issues: string[]; improvements?: any }>;
  slides: Slide[];
}> = ({ isOpen, onClose, brief, reviews, slides }) => {
  if (!isOpen) return null;

  const totalReviewed = reviews.length;
  const approvedCount = reviews.filter((r) => r.approved).length;
  const fixesCount = totalReviewed - approvedCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-400/30">
              <Wand2 className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">AI Visual QA & Design Critique Report</h3>
              <p className="text-xs text-purple-200/80">Multimodal Gemini Vision QA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="block text-slate-500 font-medium">Slides Evaluated</span>
              <span className="text-lg font-extrabold text-slate-900">{totalReviewed}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
              <span className="block text-emerald-700 font-medium">Approved Visuals</span>
              <span className="text-lg font-extrabold text-emerald-800">{approvedCount}</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
              <span className="block text-purple-700 font-medium">Auto-Improved</span>
              <span className="text-lg font-extrabold text-purple-800">{fixesCount}</span>
            </div>
          </div>

          {brief && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-950">
              <span className="font-bold block mb-1">Target Design Brief:</span>
              <p className="italic text-indigo-900/90">{brief}</p>
            </div>
          )}

          {/* Slide Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Slide-by-Slide Critique Summary</h4>
            {reviews.map((r, idx) => {
              const matchedSlide = slides.find((s) => s.id === r.slideId);
              return (
                <div
                  key={r.slideId || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    r.approved
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {r.approved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900">
                        Slide {idx + 1}: {matchedSlide?.title || 'Untitled'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.approved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.approved ? 'Passed Visual QA' : 'Refined by AI'}
                    </span>
                  </div>

                  {r.issues && r.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="font-semibold text-slate-700 text-[11px]">Critique Notes:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {r.issues.map((iss, i2) => (
                          <li key={i2}>{iss}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.improvements && Object.keys(r.improvements).length > 0 && (
                    <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700">
                      <span className="font-bold text-purple-700 block mb-1">Applied Fixes:</span>
                      {r.improvements.title && <div>• Updated Title: "{r.improvements.title}"</div>}
                      {r.improvements.layout && <div>• Adjusted Layout: {r.improvements.layout}</div>}
                      {r.improvements.bullets && <div>• Refined bullet points & typography</div>}
                      {r.improvements.imagePrompt && <div>• Updated visual artwork prompt</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const PresentationStudioView: React.FC = () => {
  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);
  const [currentPresentation, setCurrentPresentation] = useState<PresentationData | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Animation Studio Modal State
  const [isAnimationModalOpen, setIsAnimationModalOpen] = useState(false);

  // New Generation Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [genTitle, setGenTitle] = useState('');
  const [genSourceType, setGenSourceType] = useState<'book' | 'lesson' | 'prompt'>('book');
  const [genSourceBookId, setGenSourceBookId] = useState('');
  const [genSourceLessonId, setGenSourceLessonId] = useState('');
  const [genSlideCount, setGenSlideCount] = useState(8);
  const [genStyleDirection, setGenStyleDirection] = useState('');
  const [genGradeLevel, setGenGradeLevel] = useState('Grade 3-5');
  const [genDesignBrief, setGenDesignBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Present Mode, Export & AI Visual QA State
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [presentModeInitialIndex, setPresentModeInitialIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [fallbackDownloadUrl, setFallbackDownloadUrl] = useState<string | null>(null);
  const [fallbackFilename, setFallbackFilename] = useState<string>('presentation.pptx');
  const [isReviewingDesign, setIsReviewingDesign] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [designReviewResults, setDesignReviewResults] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApplyAnimation = async (animId: string, applyToAll: boolean) => {
    if (!currentPresentation) return;

    if (applyToAll) {
      const updatedSlides = currentPresentation.slides.map((s) => ({
        ...s,
        animation: animId,
        activity: { ...s.activity, animation: animId },
      }));
      setCurrentPresentation({ ...currentPresentation, slides: updatedSlides });

      await Promise.all(
        updatedSlides.map((s) =>
          apiClient.patch(`/api/slides/${s.id}`, {
            activity: s.activity,
          })
        )
      );
      setToastMessage(`Animation "${animId}" applied to all slides!`);
    } else {
      if (!selectedSlideId) return;
      const slide = currentPresentation.slides.find((s) => s.id === selectedSlideId);
      if (!slide) return;

      const updatedActivity = { ...slide.activity, animation: animId };
      const updatedSlide = { ...slide, animation: animId, activity: updatedActivity };

      const updatedSlides = currentPresentation.slides.map((s) => (s.id === selectedSlideId ? updatedSlide : s));
      setCurrentPresentation({ ...currentPresentation, slides: updatedSlides });

      await apiClient.patch(`/api/slides/${selectedSlideId}`, { activity: updatedActivity });
      setToastMessage(`Slide animation set to "${animId}"!`);
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Presentation List
  const fetchPresentations = async () => {
    try {
      const res = await apiClient.get<PresentationData[]>('/api/presentations');
      setPresentations(res);
      if (res.length > 0 && !selectedPresentationId) {
        setSelectedPresentationId(res[0].id);
      }
    } catch (err) {
      console.error('Error fetching presentations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Single Presentation & Slides
  const fetchPresentationDetails = async (id: string) => {
    try {
      const res = await apiClient.get<PresentationData>(`/api/presentations/${id}`);
      setCurrentPresentation(res);
      if (res.slides && res.slides.length > 0) {
        if (!selectedSlideId || !res.slides.some((s) => s.id === selectedSlideId)) {
          setSelectedSlideId(res.slides[0].id);
        }
      } else {
        setSelectedSlideId(null);
      }
    } catch (err) {
      console.error('Error fetching presentation details:', err);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  useEffect(() => {
    if (selectedPresentationId) {
      fetchPresentationDetails(selectedPresentationId);
    }
  }, [selectedPresentationId]);

  // Polling while presentation is generating
  useEffect(() => {
    if (!currentPresentation || currentPresentation.status !== 'generating') return;
    const interval = setInterval(() => {
      if (selectedPresentationId) {
        fetchPresentationDetails(selectedPresentationId);
        fetchPresentations();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentPresentation?.status, selectedPresentationId]);

  // Load books & lessons for generator dropdowns
  const loadSourceOptions = async () => {
    try {
      const [booksRes, lessonsRes] = await Promise.all([
        apiClient.get<BookOption[]>('/api/books').catch(() => []),
        apiClient.get<LessonOption[]>('/api/lessons').catch(() => []),
      ]);
      setBooks(booksRes);
      setLessons(lessonsRes);
      if (booksRes.length > 0) setGenSourceBookId(booksRes[0].id);
      if (lessonsRes.length > 0) setGenSourceLessonId(lessonsRes[0].id);
    } catch (err) {
      console.error('Error loading source options:', err);
    }
  };

  const handleOpenGenerateModal = () => {
    loadSourceOptions();
    setIsGenerateModalOpen(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const combinedBrief = [
        genDesignBrief,
        genStyleDirection ? `Style Direction: ${genStyleDirection}` : '',
      ].filter(Boolean).join('\n');

      const payload = {
        title: genTitle || undefined,
        sourceBookId: genSourceType === 'book' ? genSourceBookId : undefined,
        sourceLessonId: genSourceType === 'lesson' ? genSourceLessonId : undefined,
        slideCount: genSlideCount,
        theme: 'custom',
        gradeLevel: genGradeLevel,
        designBrief: combinedBrief || undefined,
      };

      const res = await apiClient.post<{ id: string }>('/api/presentations/generate', payload);
      setIsGenerateModalOpen(false);
      setSelectedPresentationId(res.id);
      await fetchPresentations();
      await fetchPresentationDetails(res.id);
    } catch (err: any) {
      alert(err.message || 'Failed to start presentation generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    if (!currentPresentation) return;
    try {
      const updated = await apiClient.patch<PresentationData>(`/api/presentations/${currentPresentation.id}`, { theme: newTheme });
      setCurrentPresentation({ ...currentPresentation, theme: updated.theme });
      setPresentations((prev) => prev.map((p) => (p.id === currentPresentation.id ? { ...p, theme: updated.theme } : p)));
    } catch (err) {
      console.error('Error updating theme:', err);
    }
  };

  const selectedSlide = currentPresentation?.slides?.find((s) => s.id === selectedSlideId) || currentPresentation?.slides?.[0];

  // Slide Modification Helpers
  const handleUpdateSlide = async (updates: Partial<Slide>) => {
    if (!selectedSlide) return;
    try {
      const updated = await apiClient.patch<Slide>(`/api/slides/${selectedSlide.id}`, updates);
      if (currentPresentation) {
        const updatedSlides = currentPresentation.slides.map((s) => (s.id === updated.id ? updated : s));
        setCurrentPresentation({ ...currentPresentation, slides: updatedSlides });
      }
    } catch (err) {
      console.error('Error updating slide:', err);
    }
  };

  const handleAddSlide = async () => {
    if (!currentPresentation) return;
    try {
      const newSlide = await apiClient.post<Slide>(`/api/presentations/${currentPresentation.id}/slides`, {
        layout: 'bullets',
        title: 'New Slide',
        bullets: ['Add key concept here'],
        speakerNotes: '',
      });
      setCurrentPresentation({
        ...currentPresentation,
        slides: [...currentPresentation.slides, newSlide],
      });
      setSelectedSlideId(newSlide.id);
    } catch (err) {
      console.error('Error adding slide:', err);
    }
  };

  const handleDeleteSlide = async (slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPresentation || currentPresentation.slides.length <= 1) {
      alert('A presentation must have at least one slide.');
      return;
    }
    try {
      await apiClient.delete(`/api/slides/${slideId}`);
      const remaining = currentPresentation.slides.filter((s) => s.id !== slideId);
      setCurrentPresentation({ ...currentPresentation, slides: remaining });
      if (selectedSlideId === slideId) {
        setSelectedSlideId(remaining[0]?.id || null);
      }
    } catch (err) {
      console.error('Error deleting slide:', err);
    }
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPresentation) return;
    const slidesCopy = [...currentPresentation.slides];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slidesCopy.length) return;

    const temp = slidesCopy[index];
    slidesCopy[index] = slidesCopy[targetIdx];
    slidesCopy[targetIdx] = temp;

    slidesCopy.forEach((s, idx) => {
      s.slideOrder = idx;
    });

    setCurrentPresentation({ ...currentPresentation, slides: slidesCopy });

    await Promise.all([
      apiClient.patch(`/api/slides/${slidesCopy[index].id}`, { slideOrder: index }),
      apiClient.patch(`/api/slides/${slidesCopy[targetIdx].id}`, { slideOrder: targetIdx }),
    ]);
  };

  const handleExportPPTX = async () => {
    if (!currentPresentation) return;
    setIsExporting(true);
    setToastMessage(null);
    setFallbackDownloadUrl(null);
    try {
      const token = localStorage.getItem('lectio_session_id') || localStorage.getItem('lectio_token');
      const response = await fetch(`/api/presentations/${currentPresentation.id}/export`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ format: 'pptx' }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('application/json') || contentType.includes('text/html')) {
        const errorText = await response.text();
        let errorMsg = 'Failed to download PPTX file.';
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.error || parsed.message || errorMsg;
        } catch (_e) {
          if (errorText) errorMsg = errorText.substring(0, 150);
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const filename = `${currentPresentation.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pptx`;

      // Trigger automatic browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

      // Build Base64 Data URL fallback for sandboxed environments
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setFallbackDownloadUrl(dataUrl);
        setFallbackFilename(filename);
      };
      reader.readAsDataURL(blob);

      setToastMessage('PPTX export completed!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('PPTX Export error:', err);
      setToastMessage(`Export failed: ${err.message || 'Error exporting PPTX.'}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunDesignReview = async () => {
    if (!currentPresentation || !currentPresentation.slides || currentPresentation.slides.length === 0) return;
    setIsReviewingDesign(true);
    setToastMessage('Capturing slide visuals & requesting AI Design Review...');
    try {
      const capturedSlides: Array<{ slideId: string; imageDataUrl: string; layout: string; title: string }> = [];

      for (const slide of currentPresentation.slides) {
        const elem = document.getElementById(`slide-canvas-${slide.id}`);
        if (elem) {
          try {
            const dataUrl = await toPng(elem, { quality: 0.85, pixelRatio: 1.5 });
            capturedSlides.push({
              slideId: slide.id,
              imageDataUrl: dataUrl,
              layout: slide.layout,
              title: slide.title,
            });
          } catch (e) {
            console.warn(`Could not capture PNG for slide ${slide.id}:`, e);
          }
        }
      }

      const token = localStorage.getItem('lectio_session_id') || localStorage.getItem('lectio_token');
      const response = await fetch(`/api/presentations/${currentPresentation.id}/design-review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          slides: capturedSlides,
          designBrief: currentPresentation.designBrief,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('text/html')) {
        const errText = await response.text();
        let errorMsg = 'Design review failed.';
        try {
          const parsed = JSON.parse(errText);
          errorMsg = parsed.error || parsed.message || errorMsg;
        } catch (_e) {
          if (errText) errorMsg = errText.substring(0, 150);
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (result.data?.presentation) {
        setCurrentPresentation(result.data.presentation);
      }
      setDesignReviewResults(result.data?.reviews || []);
      setIsReviewModalOpen(true);
      setToastMessage('AI Design Review completed!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error('Design Review error:', err);
      alert(`Design Review Error: ${err.message || 'Failed to complete design review.'}`);
    } finally {
      setIsReviewingDesign(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{currentPresentation?.title || 'Presentation Studio'}</h1>
              {currentPresentation && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentPresentation.status === 'ready'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : currentPresentation.status === 'generating'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {currentPresentation.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">AI Slide Deck Generation, Theme Studio & PPTX Export</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Deck Switcher Dropdown */}
          <select
            value={selectedPresentationId || ''}
            onChange={(e) => setSelectedPresentationId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {presentations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.status})
              </option>
            ))}
          </select>

          {/* Animation Studio Gallery Trigger */}
          {currentPresentation && (
            <button
              onClick={() => setIsAnimationModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <Film className="w-4 h-4 text-indigo-400" />
              <span>Animations</span>
            </button>
          )}

          <button
            onClick={handleOpenGenerateModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Deck</span>
          </button>

          {currentPresentation && (
            <>
              <button
                onClick={() => setIsPresentMode(true)}
                disabled={!currentPresentation.slides || currentPresentation.slides.length === 0}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Present</span>
              </button>

              <button
                onClick={handleExportPPTX}
                disabled={isExporting}
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download PPTX</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sandboxed Fallback Direct Download Link */}
      {fallbackDownloadUrl && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PPTX File generated successfully! If the automatic download didn't start in your browser:</span>
          </div>
          <a
            href={fallbackDownloadUrl}
            download={fallbackFilename}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-xs"
          >
            Click here to save PPTX
          </a>
        </div>
      )}

      {/* Main Presentation Studio Editor Grid */}
      {currentPresentation ? (
        currentPresentation.status === 'generating' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 animate-spin mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Designing Presentation Slides & Artwork...</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our AI is building lesson slides, generating illustration artwork, and embedding interactive quiz/flashcard activities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Thumbnail Rail */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-[750px] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Slides ({currentPresentation.slides?.length || 0})
                </span>
                <button
                  onClick={handleAddSlide}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Slide
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {currentPresentation.slides?.map((slide, index) => {
                  const isSelected = slide.id === selectedSlide?.id;
                  return (
                    <div
                      key={slide.id}
                      onClick={() => setSelectedSlideId(slide.id)}
                      className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500">Slide {index + 1}</span>
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                          {slide.layout}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 line-clamp-1">{slide.title || 'Untitled Slide'}</p>

                      {/* Hover Reorder / Action Bar */}
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-400 opacity-80 group-hover:opacity-100">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={index === 0}
                            onClick={(e) => handleMoveSlide(index, 'up', e)}
                            className="p-1 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={index === currentPresentation.slides.length - 1}
                            onClick={(e) => handleMoveSlide(index, 'down', e)}
                            className="p-1 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={(e) => handleDeleteSlide(slide.id, e)}
                          className="p-1 hover:text-red-600 text-slate-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center Canvas Preview */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              {/* Slide Canvas Action Bar */}
              {selectedSlide && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Slide Preview</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const idx = currentPresentation.slides.findIndex((s) => s.id === selectedSlideId);
                        setPresentModeInitialIndex(idx >= 0 ? idx : 0);
                        setIsPresentMode(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                      title="Open full-screen presentation mode"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Present</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedSlide ? (
                <SlideCanvasPreview
                  slide={selectedSlide}
                  theme={currentPresentation.theme}
                  customPalette={currentPresentation.customPalette || currentPresentation.custom_palette}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  Select a slide to view preview
                </div>
              )}

              {/* Speaker Notes Canvas Section */}
              {selectedSlide && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Teacher Script & Speaker Notes
                  </label>
                  <textarea
                    rows={3}
                    value={selectedSlide.speakerNotes || ''}
                    onChange={(e) => handleUpdateSlide({ speakerNotes: e.target.value })}
                    placeholder="Enter teacher script / presentation talking points..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Right Inspector Panel */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-[750px] shadow-xs overflow-y-auto">
              {selectedSlide ? (
                <SlideInspector
                  slide={selectedSlide}
                  onUpdate={handleUpdateSlide}
                  theme={currentPresentation.theme}
                  onOpenAnimationGallery={() => setIsAnimationModalOpen(true)}
                />
              ) : (
                <div className="text-xs text-slate-400 text-center py-10">No slide selected</div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <Presentation className="w-12 h-12 text-indigo-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">No Presentations Available</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate your first interactive slide presentation from a Storybook or Lesson Plan.
          </p>
          <button
            onClick={handleOpenGenerateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Generate Presentation
          </button>
        </div>
      )}

      {/* Animation Studio Gallery Modal */}
      <AnimationStudioModal
        isOpen={isAnimationModalOpen}
        onClose={() => setIsAnimationModalOpen(false)}
        activeAnimation={
          currentPresentation?.slides.find((s) => s.id === selectedSlideId)?.animation ||
          currentPresentation?.slides.find((s) => s.id === selectedSlideId)?.activity?.animation ||
          'fade'
        }
        onSelectAnimation={handleApplyAnimation}
      />

      {/* Generation Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Generate Slide Presentation</h3>
              </div>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Content</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setGenSourceType('book')}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      genSourceType === 'book'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Storybook
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenSourceType('lesson')}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      genSourceType === 'lesson'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Lesson Plan
                  </button>
                </div>

                {genSourceType === 'book' ? (
                  <select
                    value={genSourceBookId}
                    onChange={(e) => setGenSourceBookId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={genSourceLessonId}
                    onChange={(e) => setGenSourceLessonId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Presentation Title (Optional)</label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="e.g. Chapter 1 Vocabulary & Comprehension"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade Level</label>
                  <select
                    value={genGradeLevel}
                    onChange={(e) => setGenGradeLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Grade K-2">Grade K-2</option>
                    <option value="Grade 3-5">Grade 3-5</option>
                    <option value="Grade 6-8">Grade 6-8</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slide Count ({genSlideCount})</label>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    value={genSlideCount}
                    onChange={(e) => setGenSlideCount(Number(e.target.value))}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Style Direction (Optional)</label>
                <input
                  type="text"
                  value={genStyleDirection}
                  onChange={(e) => setGenStyleDirection(e.target.value)}
                  placeholder="e.g. underwater adventure, teal and coral, dreamy"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 mb-2"
                />
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {['Underwater Adventure', 'Superhero Comic', 'Space Galaxy', 'Storybook Magic', 'Jungle Explorer'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setGenStyleDirection(chip)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 font-medium transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Free-Form Design Brief / Style Directives</span>
                </label>
                <textarea
                  rows={3}
                  value={genDesignBrief}
                  onChange={(e) => setGenDesignBrief(e.target.value)}
                  placeholder="Describe your visual style, art direction, dark/light theme preferences, or color guidelines (e.g. 'Dark luxury neon cyan with bold typography and high contrast cards')."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Visual QA Design Review Modal */}
      <DesignReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        brief={currentPresentation?.designBrief}
        reviews={designReviewResults}
        slides={currentPresentation?.slides || []}
      />

      {/* Present Mode Overlay */}
      {isPresentMode && currentPresentation && (
        <PresentMode
          presentation={currentPresentation}
          initialIndex={presentModeInitialIndex}
          onClose={() => setIsPresentMode(false)}
        />
      )}
    </div>
  );
};

// Canvas Slide Preview Component
const SlideCanvasPreview: React.FC<{ slide: Slide; theme: string; customPalette?: any }> = ({ slide }) => {
  return (
    <div id={`slide-canvas-${slide.id}`} className="aspect-16/9 w-full rounded-2xl shadow-xl overflow-hidden relative transition-all duration-300">
      <SlideRenderer slide={slide} />
    </div>
  );
};

// Inspector Panel Component
const SlideInspector: React.FC<{
  slide: Slide;
  onUpdate: (u: Partial<Slide>) => void;
  theme: string;
  onOpenAnimationGallery?: () => void;
}> = ({ slide, onUpdate, onOpenAnimationGallery }) => {
  const [bulletInput, setBulletInput] = useState('');

  const currentAnim = slide.animation || slide.activity?.animation || 'fade';

  return (
    <div className="space-y-5 text-xs">
      <div className="pb-2 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm">Slide Inspector</h3>
        <p className="text-[11px] text-slate-500">Edit content, layout & activity</p>
      </div>

      {/* Animation Preset Selector */}
      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-indigo-600" />
            <span>PowerPoint Motion Preset</span>
          </label>
          <span className="text-[10px] text-indigo-700 font-bold uppercase bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
            {currentAnim}
          </span>
        </div>
        <select
          value={currentAnim}
          onChange={(e) => {
            const anim = e.target.value;
            onUpdate({
              animation: anim,
              activity: { ...slide.activity, animation: anim },
            });
          }}
          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
        >
          <optgroup label="Entrance Animations">
            {ANIMATION_PRESETS.filter((p) => p.category === 'entrance').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Exit Animations">
            {ANIMATION_PRESETS.filter((p) => p.category === 'exit').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Emphasis Animations">
            {ANIMATION_PRESETS.filter((p) => p.category === 'emphasis').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Reveal & Wipe Animations">
            {ANIMATION_PRESETS.filter((p) => p.category === 'reveal').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        </select>
        {onOpenAnimationGallery && (
          <button
            onClick={onOpenAnimationGallery}
            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Animation Gallery Studio</span>
          </button>
        )}
      </div>

      {/* Layout Selector */}
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Layout</label>
        <select
          value={slide.layout}
          onChange={(e) => onUpdate({ layout: e.target.value as any })}
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
        >
          <option value="title">Title Slide</option>
          <option value="bullets">Bullets Slide</option>
          <option value="image">Image Slide</option>
          <option value="quiz">Interactive Quiz</option>
          <option value="flashcard">Vocabulary Flashcard</option>
          <option value="discussion">Discussion Prompt</option>
        </select>
      </div>

      {/* Slide Title */}
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Slide Title</label>
        <input
          type="text"
          value={slide.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
        />
      </div>

      {/* Bullets Editor */}
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Bullet Points</label>
        <div className="space-y-1.5 mb-2">
          {slide.bullets?.map((b, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={b}
                onChange={(e) => {
                  const copy = [...slide.bullets];
                  copy[idx] = e.target.value;
                  onUpdate({ bullets: copy });
                }}
                className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <button
                onClick={() => {
                  const copy = slide.bullets.filter((_, i) => i !== idx);
                  onUpdate({ bullets: copy });
                }}
                className="text-slate-400 hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={bulletInput}
            onChange={(e) => setBulletInput(e.target.value)}
            placeholder="Add new bullet point..."
            className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
          <button
            onClick={() => {
              if (bulletInput.trim()) {
                onUpdate({ bullets: [...(slide.bullets || []), bulletInput.trim()] });
                setBulletInput('');
              }
            }}
            className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold"
          >
            Add
          </button>
        </div>
      </div>

      {/* Layout Specific Inspectors */}
      {slide.layout === 'quiz' && (
        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
          <label className="font-bold text-indigo-900 block">Quiz Activity Editor</label>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Question</label>
            <input
              type="text"
              value={slide.activity?.question || ''}
              onChange={(e) => onUpdate({ activity: { ...slide.activity, question: e.target.value } })}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Answer Options & Correct Tag</label>
            {(slide.activity?.options || ['Option A', 'Option B', 'Option C', 'Option D']).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                <input
                  type="radio"
                  name="correctIdx"
                  checked={(slide.activity?.correctAnswerIndex ?? 0) === idx}
                  onChange={() => onUpdate({ activity: { ...slide.activity, correctAnswerIndex: idx } })}
                  className="accent-indigo-600"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const opts = [...(slide.activity?.options || ['A', 'B', 'C', 'D'])];
                    opts[idx] = e.target.value;
                    onUpdate({ activity: { ...slide.activity, options: opts } });
                  }}
                  className="flex-1 p-1 bg-white border border-slate-200 rounded-md text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.layout === 'flashcard' && (
        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
          <label className="font-bold text-amber-900 block">Flashcard Editor</label>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Front Concept / Term</label>
            <input
              type="text"
              value={slide.activity?.front || ''}
              onChange={(e) => onUpdate({ activity: { ...slide.activity, front: e.target.value } })}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Back Explanation / Definition</label>
            <textarea
              rows={2}
              value={slide.activity?.back || ''}
              onChange={(e) => onUpdate({ activity: { ...slide.activity, back: e.target.value } })}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      )}

      {slide.layout === 'image' && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="font-bold text-slate-800 block">Image Settings</label>
          <input
            type="text"
            value={slide.imageUrl || ''}
            onChange={(e) => onUpdate({ imageUrl: e.target.value })}
            placeholder="Paste image URL or data URI..."
            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export const SlideDecorations: React.FC<{ shape?: string; decorations?: string[]; accentColor?: string }> = ({
  shape,
  decorations = [],
  accentColor = 'rgba(255, 255, 255, 0.25)',
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
      {shape === 'blob' && (
        <svg className="absolute -top-10 -right-10 w-64 h-64 sm:w-96 sm:h-96" viewBox="0 0 200 200" fill="none">
          <path
            fill={accentColor}
            d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.7,41.4C64,53.6,52.2,63.4,39.1,70.5C26,77.6,13,82,-0.9,83.5C-14.8,85.1,-29.6,83.8,-42.6,76.9C-55.6,70,-66.8,57.5,-74.6,43.2C-82.4,28.9,-86.8,12.8,-85.4,-2.8C-84,-18.4,-76.8,-33.5,-66.7,-45.3C-56.6,-57,-43.6,-65.4,-29.9,-72.9C-16.2,-80.4,0,-87,15.6,-85.6C31.2,-84.2,30.6,-83.6,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
      )}

      {shape === 'wave' && (
        <svg className="absolute bottom-0 left-0 right-0 w-full h-32 sm:h-48" viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <path
            fill={accentColor}
            d="M0,192L48,202.7C96,213,192,235,288,224C384,213,480,171,576,165.3C672,160,768,192,864,202.7C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      )}

      {shape === 'starburst' && (
        <svg className="absolute -top-12 -left-12 w-48 h-48 sm:w-72 sm:h-72" viewBox="0 0 100 100" fill="none">
          <path
            fill={accentColor}
            d="M50 0 L58 35 L95 25 L68 50 L95 75 L58 65 L50 100 L42 65 L5 75 L32 50 L5 25 L42 35 Z"
          />
        </svg>
      )}

      {shape === 'cloud' && (
        <svg className="absolute top-4 right-8 w-48 h-32" viewBox="0 0 24 24" fill={accentColor}>
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      )}

      {(decorations.includes('stars') || decorations.includes('sparkles') || decorations.length > 0) && (
        <>
          <svg className="absolute top-8 left-12 w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ color: accentColor }}>
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2-6.3-4.6-6.3 4.6 2.3-7.2-6-4.6h7.6z" />
          </svg>
          <svg className="absolute bottom-12 right-16 w-10 h-10 animate-bounce" viewBox="0 0 24 24" fill="currentColor" style={{ color: accentColor }}>
            <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          </svg>
        </>
      )}
    </div>
  );
};

// Fullscreen Present Mode Overlay
export const PresentMode: React.FC<{ presentation: PresentationData; initialIndex?: number; onClose: () => void }> = ({
  presentation,
  initialIndex = 0,
  onClose,
}) => {
  const [slideIdx, setSlideIdx] = useState(initialIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setSlideIdx(initialIndex);
  }, [initialIndex]);

  const currentSlide = presentation.slides[slideIdx];
  const t = getThemeStyles(presentation.theme, presentation.customPalette || presentation.custom_palette);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsFlipped(false);
  }, [slideIdx]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        if (slideIdx < presentation.slides.length - 1) setSlideIdx((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft') {
        if (slideIdx > 0) setSlideIdx((prev) => prev - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideIdx, presentation.slides.length, onClose]);

  if (!currentSlide) return null;

  const slideStyle = currentSlide.style || {};
  const hasBgGradient = Array.isArray(slideStyle.bgGradient) && slideStyle.bgGradient.length >= 2;
  const dynamicContainerStyle: React.CSSProperties = hasBgGradient
    ? { background: `linear-gradient(135deg, ${slideStyle.bgGradient![0]}, ${slideStyle.bgGradient![1]})` }
    : {};
  const titleColorStyle = slideStyle.titleColor ? { color: slideStyle.titleColor } : {};
  const accentColorStyle = slideStyle.accentColor ? { color: slideStyle.accentColor } : {};
  const textColorStyle = slideStyle.textColor ? { color: slideStyle.textColor } : {};

  const currentAnim = currentSlide.animation || currentSlide.activity?.animation || 'fade';
  const animStyle = getAnimationCSS(currentAnim);

  return (
    <div
      style={dynamicContainerStyle}
      className={`fixed inset-0 z-[100] ${!hasBgGradient ? t.bg : ''} ${t.text} ${t.font} flex flex-col justify-between p-8 sm:p-12 select-none transition-all overflow-hidden relative backdrop-blur-2xl`}
    >
      {/* Decorative shapes & SVG accents */}
      <SlideDecorations shape={slideStyle.shape} decorations={slideStyle.decorations} accentColor={slideStyle.accentColor} />

      {/* Dot Grid Background */}
      {!hasBgGradient && <div className={`absolute inset-0 pointer-events-none ${t.dotGrid}`} />}

      {/* Top Navigation Control Bar */}
      <div className="flex items-center justify-between text-xs opacity-90 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg" style={titleColorStyle}>{presentation.title}</span>
          <span className={`px-3 py-1 rounded-full ${t.badge} font-semibold text-xs`}>
            Slide {slideIdx + 1} of {presentation.slides.length}
          </span>
          <span className="text-xs bg-black/40 border border-white/10 px-3 py-1 rounded-full font-semibold tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" />
            {currentAnim}
          </span>
          {(currentSlide.imageScore || currentSlide.image_score) !== undefined && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
              Image Score: {currentSlide.imageScore || currentSlide.image_score}/100
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              showNotes ? t.button : `${t.card} hover:opacity-100`
            }`}
          >
            Speaker Notes
          </button>
          <button onClick={onClose} className="p-2 hover:opacity-80 rounded-xl bg-black/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Display */}
      <div key={`${currentSlide.id}-${slideIdx}`} className="flex-1 my-4 flex items-center justify-center max-w-6xl mx-auto w-full relative z-10 overflow-hidden">
        <div className="w-full h-full max-h-[80vh] flex items-center justify-center">
          <SlideRenderer slide={currentSlide} />
        </div>
      </div>

      {/* Speaker Notes Overlay */}
      {showNotes && currentSlide.speakerNotes && (
        <div className={`p-4 rounded-2xl max-w-5xl mx-auto w-full text-xs mb-4 ${t.card} relative z-10`}>
          <span className={`font-bold ${t.accent} block mb-1`}>Speaker Notes:</span>
          <p>{currentSlide.speakerNotes}</p>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-between border-t border-current/10 pt-4 relative z-10">
        <button
          disabled={slideIdx === 0}
          onClick={() => setSlideIdx((prev) => prev - 1)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30 ${t.card}`}
        >
          Previous
        </button>

        <span className="text-xs opacity-50">Use Left / Right Arrows to Navigate</span>

        <button
          disabled={slideIdx === presentation.slides.length - 1}
          onClick={() => setSlideIdx((prev) => prev + 1)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30 ${t.button}`}
        >
          Next Slide
        </button>
      </div>
    </div>
  );
};
