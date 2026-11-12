import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, CheckCircle2, Trash2, Clock } from 'lucide-react';
import { Book } from '../types';
import { apiClient } from '../utils/apiClient';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { useToast } from '../context/ToastContext';

interface BookProcessingViewProps {
  books?: Book[];
  onBookProcessed?: (newBook: Book) => void;
  onDeleteBook?: (id: string) => void;
}

export const BookProcessingView: React.FC<BookProcessingViewProps> = () => {
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [loadingFetch, setLoadingFetch] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 2');
  const [passageText, setPassageText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const samplePassages = [
    {
      title: 'The Brave Hummingbird',
      author: 'Maya Lin',
      gradeLevel: 'Grade 2',
      text: 'Deep in the heart of the Amazon rainforest, a small flame began to spark on a dry branch. While the big animals ran away in fear, a tiny emerald hummingbird named Pip flew to the nearest stream, picked up a single drop of water in her beak, and carried it to the fire. "What can a tiny bird like you do?" asked the jaguar. Pip replied calmly: "I am doing my part." Inspired by her courage, all the creatures returned together to extinguish the flames.',
    },
    {
      title: 'The Secret Garden Seed',
      author: 'Robert Sterling',
      gradeLevel: 'Grade 3',
      text: 'Leo found a dull brown seed buried under dark soil in his grandmother\'s backyard. He watered it daily and spoke gentle encouraging words. Weeks passed with no sign of growth. Leo remained patient, learning that beautiful things take time to blossom under dark soil before rising into the sunlight.',
    },
  ];

  const fetchBooks = async () => {
    try {
      setLoadingFetch(true);
      setFetchError(null);
      const data = await apiClient.get<Book[]>('/api/books');
      setBooks(data || []);
      if (data && data.length > 0) {
        setSelectedBook(data[0]);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load storybooks library.');
    } finally {
      setLoadingFetch(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Polling mechanism for background book processing
  useEffect(() => {
    const hasProcessing = books.some((b) => b.status === 'processing');
    if (!hasProcessing) return;

    const intervalId = setInterval(async () => {
      try {
        const freshList = await apiClient.get<Book[]>('/api/books');
        if (freshList) {
          setBooks(freshList);
          if (selectedBook) {
            const updatedSelected = freshList.find((b) => b.id === selectedBook.id);
            if (updatedSelected) {
              setSelectedBook(updatedSelected);
            }
          }
        }
      } catch (_pollErr) {
        // Silent catch for background polling
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [books, selectedBook?.id]);

  const handleProcessBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !passageText) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const newBook = await apiClient.post<Book>('/api/books/process', {
        title,
        author: author || 'Unknown Author',
        targetGrade: gradeLevel,
        text: passageText,
      });

      setBooks((prev) => [newBook, ...prev]);
      setSelectedBook(newBook);
      setTitle('');
      setAuthor('');
      setPassageText('');
      showToast('Storybook successfully processed and ingested!', 'success');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to process storybook passage.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/books/${id}`);
    } catch (_err) {
      // Non-critical fallback
    }
    const updated = books.filter((b) => b.id !== id);
    setBooks(updated);
    if (selectedBook?.id === id) {
      setSelectedBook(updated[0] || null);
    }
    showToast('Book removed from library', 'info');
  };

  const fillSample = (sample: (typeof samplePassages)[0]) => {
    setTitle(sample.title);
    setAuthor(sample.author);
    setGradeLevel(sample.gradeLevel);
    setPassageText(sample.text);
  };

  if (loadingFetch) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <LoadingSkeleton count={5} className="h-10 mb-4" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <ErrorState
        title="Failed to Load Storybooks"
        message={fetchError}
        onRetry={fetchBooks}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Subsystem 01 • Storybook Parser</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2">Storybook Ingestion & Structural Analysis</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Extracts vocabulary terms, moral themes, character arcs, and reading complexity from raw story passages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Ingest New Storybook</span>
            </h2>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500 block">Load Sample Passages:</span>
            <div className="grid grid-cols-2 gap-2">
              {samplePassages.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => fillSample(s)}
                  className="text-left text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 p-2.5 rounded-lg truncate transition-all cursor-pointer font-medium"
                >
                  📖 {s.title}
                </button>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleProcessBook} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Brave Hummingbird"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4-5">Grade 4-5</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storybook Passage Text *</label>
              <textarea
                rows={5}
                value={passageText}
                onChange={(e) => setPassageText(e.target.value)}
                placeholder="Paste book excerpt or full story passage here..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-serif leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !title || !passageText}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gemini Extracting Pedagogy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Analysis & Ingest</span>
                </>
              )}
            </button>
          </form>

          {/* Book Library List */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Processed Library ({books.length})
            </span>
            {books.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No books ingested yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {books.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBook(b)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selectedBook?.id === b.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate text-slate-900">{b.title}</p>
                      <span className="text-[10px] text-slate-500">{b.gradeLevel} • {b.author}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteBook(b.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete Book"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Book Details View */}
        <div className="lg:col-span-7">
          {selectedBook ? (
            selectedBook.status === 'processing' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">AI Chapter & Vocabulary Extraction in Progress...</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Gemini 3.6 Flash is analyzing raw manuscript text, computing readability metrics, and generating child-safe vocabulary expansion terms.
                </p>
                <div className="pt-2">
                  <LoadingSkeleton count={3} className="h-4 max-w-sm mx-auto mb-2" />
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                    {selectedBook.targetGrade || selectedBook.gradeLevel || 'Grade 2'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{selectedBook.chapters ? Math.ceil(selectedBook.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0) / 100) || 3 : 3} Minutes Read</span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedBook.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">By {selectedBook.author}</p>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Pedagogical Summary</h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-lg">
                  {selectedBook.summary}
                </p>
              </div>

              {/* Key Moral Themes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Moral Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedBook.moralThemes || selectedBook.themes || []).map((theme, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-800 border border-indigo-100 text-xs px-3 py-1 rounded-full font-medium">
                      ✨ {typeof theme === 'string' ? theme : (theme as any)?.name || (theme as any)?.theme || JSON.stringify(theme)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vocabulary Expansion Terms */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vocabulary Expansion Words ({(selectedBook.vocabulary || []).length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedBook.vocabulary || []).map((v: any, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{typeof v === 'string' ? v : v?.word || 'Word'}</span>
                        <span className="text-[10px] text-slate-500 italic">{typeof v === 'object' ? v?.difficulty : ''}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{typeof v === 'object' ? v?.definition : ''}</p>
                      {v?.contextSentence && (
                        <p className="text-[11px] text-indigo-700 italic border-t border-slate-200/60 pt-1 mt-1">"{v.contextSentence}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Passage Preview */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Raw Text Passage</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs font-serif text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedBook.chapters?.[0]?.content || selectedBook.summary}
                </div>
              </div>
            </div>
          )
        ) : (
            <EmptyState
              title="No Book Selected"
              description="Process a new storybook on the left or select an ingested book from the library to view details."
              icon={<BookOpen className="w-10 h-10 text-slate-300" />}
            />
          )}
        </div>
      </div>
    </div>
  );
};
