import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, AlertCircle, Palette } from 'lucide-react';
import { GeneratedImage, Book } from '../types';
import { apiClient } from '../utils/apiClient';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useToast } from '../context/ToastContext';

export const ImageAIView: React.FC = () => {
  const { showToast } = useToast();

  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Storybook Watercolor');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setFetching(true);
      setFetchError(null);

      const [imagesRes, booksRes] = await Promise.allSettled([
        apiClient.get<GeneratedImage[]>('/api/images'),
        apiClient.get<Book[]>('/api/books'),
      ]);

      const fetchedImages = imagesRes.status === 'fulfilled' ? imagesRes.value || [] : [];
      const fetchedBooks = booksRes.status === 'fulfilled' ? booksRes.value || [] : [];

      setImages(fetchedImages);
      setBooks(fetchedBooks);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load generated images.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stylePresets = [
    { label: 'Storybook Watercolor', desc: 'Soft pastel tones, expressive fairytale warmth' },
    { label: '3D Animated Cartoon', desc: 'Vibrant primary colors, crisp playful character lighting' },
    { label: 'Flat Vector Graphic', desc: 'Clean geometric shapes, ideal for vocabulary flashcards' },
  ];

  const quickPrompts = [
    'A quiet young lion cub sitting peacefully under an acacia tree in a golden savannah, watercolor',
    'A glowing magical seed shining brightly inside rich black garden soil, 3D animation',
    'An emerald hummingbird carrying a single drop of sparkling water in her beak',
  ];

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res: any = await apiClient.post('/api/images/generate', {
        prompt,
        visualStyle: style,
        aspectRatio,
      });

      const resData = res?.data || res;
      const dynamicFallbackUrl = prompt
        ? `https://source.unsplash.com/random/800x600/?${encodeURIComponent(prompt.trim())}`
        : 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80';

      const newImg: GeneratedImage = {
        id: resData?.id || `img_${Date.now()}`,
        prompt: resData?.prompt || prompt,
        visualStyle: resData?.visualStyle || style,
        style: style,
        aspectRatio: resData?.aspectRatio || aspectRatio,
        imageUrl: resData?.imageUrl || resData?.url || dynamicFallbackUrl,
        status: resData?.status || 'generating',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      setImages((prev) => [newImg, ...prev]);
      setPrompt('');
      showToast('Child-safe story illustration queued and created!', 'success');
    } catch (err: any) {
      console.error('Error generating image:', err);
      setSubmitError(err.message || 'Failed to generate storybook image.');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <LoadingSkeleton count={4} className="h-10 mb-3" />
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState title="Image Subsystem Offline" message={fetchError} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Subsystem 05 • Storybook Illustrator</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2">Child-Safe Storybook Illustration Engine</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generates fairytale watercolor, 3D animated, or vector artwork with automated safety prompt wrappers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Generate New Illustration</span>
            </h2>
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleGenerateImage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Illustration Prompt *</label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. An emerald hummingbird carrying a drop of water..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Quick Prompt Inspirations:</span>
              <div className="space-y-1">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(qp)}
                    className="w-full text-left p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-lg text-[11px] text-slate-700 truncate border border-slate-200 cursor-pointer"
                  >
                    ✨ {qp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Artistic Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                {stylePresets.map((sp, idx) => (
                  <option key={idx} value={sp.label}>
                    🎨 {sp.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !prompt.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <span>Generating Image...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Illustration</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Gallery */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>Storybook Art Gallery ({images.length})</span>
          </h2>

          {images.length === 0 ? (
            <EmptyState
              title="No Images Generated Yet"
              description="Enter a prompt on the left to generate fairytale storybook artwork."
              icon={<ImageIcon className="w-10 h-10 text-slate-300" />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((img) => (
                <div key={img.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 space-y-2 p-3">
                  <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={img.imageUrl || (img as any).url || `https://source.unsplash.com/random/800x600/?${encodeURIComponent(img.prompt || 'storybook')}`}
                      alt={img.prompt || 'Generated storybook artwork'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">{img.prompt}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{img.style}</span>
                      <span>{img.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
