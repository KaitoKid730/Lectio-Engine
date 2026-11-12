import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import { LessonPlan, Book } from '../types';
import { apiClient } from '../utils/apiClient';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useToast } from '../context/ToastContext';

export const LessonAIView: React.FC = () => {
  const { showToast } = useToast();

  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [customTopic, setCustomTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 2');
  const [duration, setDuration] = useState(45);
  const [focusArea, setFocusArea] = useState('Comprehension & Vocabulary');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const loadData = async () => {
    try {
      setFetching(true);
      setFetchError(null);

      const [lessonsData, booksData] = await Promise.allSettled([
        apiClient.get<LessonPlan[]>('/api/lessons'),
        apiClient.get<Book[]>('/api/books'),
      ]);

      const fetchedLessons = lessonsData.status === 'fulfilled' ? lessonsData.value || [] : [];
      const fetchedBooks = booksData.status === 'fulfilled' ? booksData.value || [] : [];

      setLessons(fetchedLessons);
      setBooks(fetchedBooks);

      if (fetchedLessons.length > 0) setSelectedLesson(fetchedLessons[0]);
      if (fetchedBooks.length > 0) setSelectedBookId(fetchedBooks[0].id);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load lessons.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Poll for background lesson generation completion
  useEffect(() => {
    const hasPending = lessons.some(
      (l) => l.status === 'generating' || l.status === 'draft'
    );
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const updatedLessons = await apiClient.get<LessonPlan[]>('/api/lessons');
        if (Array.isArray(updatedLessons)) {
          setLessons(updatedLessons);
          if (selectedLesson) {
            const current = updatedLessons.find((l) => l.id === selectedLesson.id);
            if (current) setSelectedLesson(current);
          }
        }
      } catch (_err) {
        // Ignore background poll errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [lessons, selectedLesson?.id]);

  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    if (bookId) {
      const selectedBook = books.find((b) => b.id === bookId);
      if (selectedBook?.targetGrade || selectedBook?.gradeLevel) {
        setGradeLevel(selectedBook.targetGrade || selectedBook.gradeLevel || 'Grade 2');
      }
    }
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const selectedBook = books.find((b) => b.id === selectedBookId);
      const computedTitle = selectedBook?.title || customTopic.trim() || 'Grade Level Reading Lesson';

      const newLesson = await apiClient.post<LessonPlan>('/api/lessons/generate', {
        title: computedTitle,
        topic: computedTitle,
        bookId: selectedBookId || undefined,
        sourceBookId: selectedBookId || undefined,
        bookTitle: selectedBook?.title || computedTitle,
        customTopic: customTopic.trim() || computedTitle,
        gradeLevel,
        targetGradeLevel: gradeLevel,
        targetGrade: gradeLevel,
        durationMinutes: typeof duration === 'number' ? duration : (parseInt(String(duration), 10) || 45),
        focusArea,
      });

      setLessons((prev) => [newLesson, ...prev]);
      setSelectedLesson(newLesson);
      showToast('Lesson plan generation initiated!', 'success');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to generate lesson plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/lessons/${id}`);
    } catch (_err) {
      // Ignore
    }
    const updated = lessons.filter((l) => l.id !== id);
    setLessons(updated);
    if (selectedLesson?.id === id) {
      setSelectedLesson(updated[0] || null);
    }
    showToast('Lesson plan deleted', 'info');
  };

  if (fetching) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <LoadingSkeleton count={5} className="h-10 mb-3" />
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState title="Failed to Load Lessons" message={fetchError} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Subsystem 02 • Pedagogical Planner</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2">AI Lesson Generator & Quiz Synthesizer</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generates structured time-blocked lesson plans with learning objectives, discussion prompts, and quiz items.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Generate Lesson Plan</span>
            </h2>
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleGenerateLesson} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Storybook (Optional)</label>
              <select
                value={selectedBookId}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="">-- Standalone Topic --</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    📖 {b.title} ({b.targetGrade || b.gradeLevel || 'Grade Level'})
                  </option>
                ))}
              </select>
            </div>

            {!selectedBookId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Topic / Theme *</label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Environmental Stewardship in Fiction"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Grade</label>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Mins)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pedagogical Focus Area</label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="Comprehension & Vocabulary">Comprehension & Vocabulary</option>
                <option value="Character Analysis & Ethics">Character Analysis & Ethics</option>
                <option value="Plot Structure & Retelling">Plot Structure & Retelling</option>
                <option value="Phonics & Fluency">Phonics & Fluency</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || (!selectedBookId && !customTopic)}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <span>Generating Lesson Plan...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Lesson Plan</span>
                </>
              )}
            </button>
          </form>

          {/* Lessons Library */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Generated Lessons ({lessons.length})
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lessons.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLesson(l)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    selectedLesson?.id === l.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate text-slate-900">{l.title}</p>
                    <span className="text-[10px] text-slate-500">
                      {l.targetGradeLevel || l.targetGrade || l.gradeLevel || 'Grade Level'} • {l.durationMinutes}m
                      {(l.status === 'generating' || l.status === 'draft') && (
                        <span className="ml-1 text-indigo-600 font-semibold animate-pulse">(Generating...)</span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteLesson(l.id, e)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Lesson Details View */}
        <div className="lg:col-span-7">
          {selectedLesson ? (
            selectedLesson.status === 'generating' || selectedLesson.status === 'draft' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 animate-spin mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Synthesizing Pedagogical Lesson Plan...</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Generating time-blocked lesson agenda, learning objectives, and comprehension quiz items for{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedLesson.targetGradeLevel || selectedLesson.targetGrade || selectedLesson.gradeLevel || 'selected grade'}
                  </span>
                  .
                </p>
                <LoadingSkeleton count={3} className="h-12 w-full mt-4" />
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                    {selectedLesson.targetGradeLevel || selectedLesson.targetGrade || selectedLesson.gradeLevel || 'Grade Level'} • {selectedLesson.durationMinutes} Minutes
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedLesson.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedLesson.overview}</p>
                </div>

              {/* Learning Objectives */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Learning Objectives</h3>
                <ul className="space-y-1.5">
                  {(selectedLesson.learningObjectives || []).map((obj: any, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start space-x-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{typeof obj === 'string' ? obj : obj?.objective || obj?.title || JSON.stringify(obj)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Time-Blocked Agenda */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lesson Agenda</h3>
                <div className="space-y-2">
                  {(selectedLesson.agenda || selectedLesson.timedSteps || []).map((item: any, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{item.activity || item.title || `Step ${idx + 1}`}</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">{item.description || item.instructions}</p>
                      </div>
                      <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded shrink-0">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {item.durationMinutes || item.duration || 10}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz Questions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Comprehension Quiz ({selectedLesson.quizQuestions?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(selectedLesson.quizQuestions || []).map((q: any, qIdx) => (
                    <div key={qIdx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
                      <p className="text-xs font-bold text-slate-900">{qIdx + 1}. {typeof q.question === 'string' ? q.question : q.question?.text || JSON.stringify(q.question)}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(Array.isArray(q.options) ? q.options : []).map((opt: any, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded text-xs border ${
                              optIdx === q.correctAnswerIndex
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            {typeof opt === 'string' ? opt : opt?.text || JSON.stringify(opt)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )
          ) : (
            <EmptyState
              title="No Lesson Plan Selected"
              description="Synthesize a new lesson plan on the left to view details."
              icon={<HelpCircle className="w-10 h-10 text-slate-300" />}
            />
          )}
        </div>
      </div>
    </div>
  );
};
