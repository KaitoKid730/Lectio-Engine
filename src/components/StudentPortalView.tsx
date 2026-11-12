import React, { useState, useEffect } from 'react';
import { Book, LessonPlan, StudentQuizResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/apiClient';
import { BookOpen, Award, CheckCircle2, XCircle, Volume2, Sparkles, Trophy, ArrowRight, RotateCw, Star } from 'lucide-react';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useToast } from '../context/ToastContext';

export const StudentPortalView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [quizResults, setQuizResults] = useState<StudentQuizResult[]>([]);

  const [activeTab, setActiveTab] = useState<'reader' | 'flashcards' | 'quiz'>('reader');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Flashcards state
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [booksData, lessonsData, resultsData] = await Promise.allSettled([
        apiClient.get<Book[]>('/api/books'),
        apiClient.get<LessonPlan[]>('/api/lessons'),
        apiClient.get<StudentQuizResult[]>('/api/student/quiz-results'),
      ]);

      const fetchedBooks = booksData.status === 'fulfilled' ? booksData.value || [] : [];
      const fetchedLessons = lessonsData.status === 'fulfilled' ? lessonsData.value || [] : [];
      const fetchedResults = resultsData.status === 'fulfilled' ? resultsData.value || [] : [];

      setBooks(fetchedBooks);
      setLessons(fetchedLessons);
      setQuizResults(fetchedResults);

      if (fetchedBooks.length > 0) setSelectedBookId(fetchedBooks[0].id);
      if (fetchedLessons.length > 0) setSelectedLessonId(fetchedLessons[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load student portal content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeBook = books.find((b) => b.id === selectedBookId) || books[0];
  const activeChapter = activeBook?.chapters?.[selectedChapterIdx] || activeBook?.chapters?.[0];
  const vocabList = activeBook?.vocabulary || [];

  const activeLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  const quizQuestions = activeLesson?.quizQuestions || [];

  // Calculate student quiz score
  const score = quizQuestions.reduce((acc, q, idx) => {
    return userAnswers[idx] === q.correctAnswerIndex ? acc + 1 : acc;
  }, 0);

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleQuizSubmit = async () => {
    if (!activeLesson || !user) return;
    setSubmitting(true);
    try {
      // Optional quiz start tracking
      try {
        await apiClient.post('/api/student/quiz-start', { lessonId: activeLesson.id });
      } catch (_e) {
        // Non-blocking telemetry
      }

      const res = await apiClient.post<StudentQuizResult>('/api/student/quiz-submit', {
        lessonId: activeLesson.id,
        lessonTitle: activeLesson.title,
        score,
        totalQuestions: quizQuestions.length,
        studentId: user.id,
        studentName: user.name,
      });

      if (res) {
        setQuizResults((prev) => [res, ...prev]);
        showToast('Quiz submitted successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit quiz', 'error');
    } finally {
      setSubmitting(false);
      setQuizSubmitted(true);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <LoadingSkeleton count={6} className="h-10 mb-3" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Student Portal Offline" message={error} onRetry={fetchData} />;
  }

  const myResults = quizResults.filter((r) => r.studentId === user?.id);

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Learning Portal • Grade 3</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name || 'Learner'}! 🌟</h1>
            <p className="text-xs text-sky-100 max-w-xl">
              Read captivating stories, expand your vocabulary with flashcards, and complete comprehension quizzes to earn badges!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shrink-0 text-center space-y-1">
            <div className="text-2xl font-black text-amber-300 flex items-center justify-center space-x-1">
              <Trophy className="w-6 h-6 text-amber-300" />
              <span>{myResults.length * 150 + 100} XP</span>
            </div>
            <p className="text-[10px] text-sky-200 font-medium">Reading Badges Earned: {myResults.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs">
        <button
          onClick={() => setActiveTab('reader')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'reader'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Interactive Story Reader</span>
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'flashcards'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Vocab Flashcards ({vocabList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Comprehension Quiz</span>
        </button>
      </div>

      {/* Reader View */}
      {activeTab === 'reader' && (
        <div className="space-y-6">
          {books.length === 0 ? (
            <EmptyState
              title="No Books Available"
              description="Ask your teacher to process new storybooks for reading."
              icon={<BookOpen className="w-10 h-10 text-slate-300" />}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Selector Sidebar */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Select Storybook</h3>
                <div className="space-y-2">
                  {books.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBookId(b.id);
                        setSelectedChapterIdx(0);
                      }}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                        activeBook?.id === b.id
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{b.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{b.targetGrade || b.gradeLevel || 'Grade 2'} • By {b.author}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reader Stage */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                {activeBook ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {activeBook.gradeLevel}
                        </span>
                        <h2 className="text-xl font-bold text-slate-900 mt-1">{activeBook.title}</h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setFontSize(fontSize === 'sm' ? 'md' : fontSize === 'md' ? 'lg' : 'sm')}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700"
                        >
                          Text Size: {fontSize.toUpperCase()}
                        </button>
                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className={`px-3 py-1 text-xs rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                            isPlayingAudio ? 'bg-amber-500 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isPlayingAudio ? 'Pause Read-Aloud' : 'Read Aloud'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Passage Content */}
                    <div
                      className={`font-serif leading-relaxed text-slate-800 bg-amber-50/40 p-6 rounded-xl border border-amber-100/60 shadow-2xs ${
                        fontSize === 'sm' ? 'text-xs' : fontSize === 'md' ? 'text-sm' : 'text-base'
                      }`}
                    >
                      {activeChapter?.content || activeBook.summary}
                    </div>

                    {/* Chapter Nav */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        disabled={selectedChapterIdx === 0}
                        onClick={() => setSelectedChapterIdx((prev) => Math.max(0, prev - 1))}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
                      >
                        ← Previous Chapter
                      </button>
                      <span className="text-xs font-semibold text-slate-400">
                        Chapter {(selectedChapterIdx || 0) + 1} of {activeBook.chapters?.length || 1}
                      </span>
                      <button
                        disabled={!activeBook.chapters || selectedChapterIdx >= activeBook.chapters.length - 1}
                        onClick={() => setSelectedChapterIdx((prev) => prev + 1)}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
                      >
                        Next Chapter →
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Select a book to read.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flashcards View */}
      {activeTab === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-6">
          {vocabList.length === 0 ? (
            <EmptyState
              title="No Vocabulary Words"
              description="Selected book has no extracted vocabulary words yet."
              icon={<Sparkles className="w-10 h-10 text-slate-300" />}
            />
          ) : (
            <>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Word {flashcardIdx + 1} of {vocabList.length}</span>
                <span>Click card to flip</span>
              </div>

              {/* Flashcard Box */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-white border-2 border-indigo-200 rounded-2xl p-10 min-h-[220px] flex flex-col items-center justify-center text-center shadow-md cursor-pointer hover:border-indigo-400 transition-all"
              >
                {!isFlipped ? (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                      {vocabList[flashcardIdx]?.difficulty || 'Vocabulary Word'}
                    </span>
                    <h3 className="text-3xl font-extrabold text-slate-900">{vocabList[flashcardIdx]?.word}</h3>
                    <p className="text-xs text-slate-400 pt-2">(Tap card to see definition)</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-indigo-700">{vocabList[flashcardIdx]?.word}</h4>
                    <p className="text-sm text-slate-800 font-medium">{vocabList[flashcardIdx]?.definition}</p>
                    <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">
                      "{vocabList[flashcardIdx]?.contextSentence}"
                    </p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <button
                  disabled={flashcardIdx === 0}
                  onClick={() => {
                    setFlashcardIdx((prev) => Math.max(0, prev - 1));
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Previous Word
                </button>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold"
                >
                  <RotateCw className="w-3.5 h-3.5 inline mr-1" />
                  Flip Card
                </button>
                <button
                  disabled={flashcardIdx >= vocabList.length - 1}
                  onClick={() => {
                    setFlashcardIdx((prev) => prev + 1);
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                >
                  Next Word
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz View */}
      {activeTab === 'quiz' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          {lessons.length === 0 ? (
            <EmptyState
              title="No Quizzes Available"
              description="No lesson quizzes have been generated yet."
              icon={<Award className="w-10 h-10 text-slate-300" />}
            />
          ) : (
            <>
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                  Comprehension Check
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{activeLesson?.title}</h2>
                <p className="text-xs text-slate-500">{activeLesson?.overview}</p>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {(quizQuestions || []).map((q: any, qIdx) => (
                  <div key={qIdx} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-900">
                      {qIdx + 1}. {typeof q.question === 'string' ? q.question : q.question?.text || JSON.stringify(q.question)}
                    </p>
                    <div className="space-y-2">
                      {(Array.isArray(q.options) ? q.options : []).map((opt: any, optIdx) => {
                        const isSelected = userAnswers[qIdx] === optIdx;
                        const isCorrect = q.correctAnswerIndex === optIdx;
                        let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-slate-300';

                        if (quizSubmitted) {
                          if (isCorrect) btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
                          else if (isSelected && !isCorrect) btnStyle = 'bg-rose-50 border-rose-300 text-rose-800';
                        } else if (isSelected) {
                          btnStyle = 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectAnswer(qIdx, optIdx)}
                            className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                          >
                            <span>{typeof opt === 'string' ? opt : opt?.text || JSON.stringify(opt)}</span>
                            {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                            {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quiz Footer Controls */}
              {!quizSubmitted ? (
                <button
                  disabled={submitting || Object.keys(userAnswers).length < quizQuestions.length}
                  onClick={handleQuizSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-xs transition-all text-xs"
                >
                  {submitting ? 'Submitting Quiz...' : 'Submit Answers & Calculate Score'}
                </button>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <Star className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-lg font-bold text-emerald-950">
                    Quiz Complete! You Scored {score} / {quizQuestions.length}
                  </h3>
                  <p className="text-xs text-emerald-700">Great effort! Your score has been logged to your learning record.</p>
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setUserAnswers({});
                    }}
                    className="mt-2 px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
