import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { QAAssessment, Book, LessonPlan } from '../types';
import { apiClient } from '../utils/apiClient';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useToast } from '../context/ToastContext';

export const QAAuditorView: React.FC = () => {
  const { showToast } = useToast();

  const [audits, setAudits] = useState<QAAssessment[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);

  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedAudit, setSelectedAudit] = useState<QAAssessment | null>(null);
  const [targetType, setTargetType] = useState<'book' | 'lesson'>('book');
  const [selectedId, setSelectedId] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [targetGrade, setTargetGrade] = useState<string>('Grade 2');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setFetching(true);
      setFetchError(null);

      const [auditsRes, booksRes, lessonsRes] = await Promise.allSettled([
        apiClient.get<QAAssessment[]>('/api/qa/audits'),
        apiClient.get<Book[]>('/api/books'),
        apiClient.get<LessonPlan[]>('/api/lessons'),
      ]);

      const fetchedAudits = auditsRes.status === 'fulfilled' ? auditsRes.value || [] : [];
      const fetchedBooks = booksRes.status === 'fulfilled' ? booksRes.value || [] : [];
      const fetchedLessons = lessonsRes.status === 'fulfilled' ? lessonsRes.value || [] : [];

      setAudits(fetchedAudits);
      setBooks(fetchedBooks);
      setLessons(fetchedLessons);

      if (fetchedAudits.length > 0) setSelectedAudit(fetchedAudits[0]);
      if (fetchedBooks.length > 0) setSelectedId(fetchedBooks[0].id);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load audit records.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      let contentToAudit = customText;
      let titleToAudit = 'Custom Curriculum Text';

      if (targetType === 'book') {
        const book = books.find((b) => b.id === selectedId);
        if (book) {
          contentToAudit = book.chapters?.[0]?.content || book.summary;
          titleToAudit = book.title;
        }
      } else {
        const lesson = lessons.find((l) => l.id === selectedId);
        if (lesson) {
          contentToAudit = lesson.overview;
          titleToAudit = lesson.title;
        }
      }

      const newAudit = await apiClient.post<QAAssessment>('/api/qa/audit', {
        targetTitle: titleToAudit,
        targetType,
        targetGrade,
        content: contentToAudit,
      });

      setAudits((prev) => [newAudit, ...prev]);
      setSelectedAudit(newAudit);
      showToast('QA Audit evaluation complete!', 'success');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to execute QA audit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <LoadingSkeleton count={5} className="h-10 mb-3" />
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState title="QA Audit Subsystem Offline" message={fetchError} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Subsystem 04 • QA & Compliance Auditor</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2">Pedagogical Compliance & Safety Audit Engine</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Conducts automated evaluations for grade readability appropriateness, safety standards, and bias detection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Run Automated Audit</span>
            </h2>
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleRunAudit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Entity Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('book');
                    if (books.length > 0) setSelectedId(books[0].id);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    targetType === 'book'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  📖 Ingested Storybook
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('lesson');
                    if (lessons.length > 0) setSelectedId(lessons[0].id);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    targetType === 'lesson'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ✨ Generated Lesson
                </button>
              </div>
            </div>

            {targetType === 'book' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Storybook *</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      📖 {b.title} ({b.targetGrade || b.gradeLevel || 'Grade 2'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'lesson' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Lesson Plan *</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      ✨ {l.title} ({l.targetGrade || l.gradeLevel || 'Grade 2'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Grade Standard</label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="Kindergarten">Kindergarten</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4-5">Grade 4-5</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs py-2.5 rounded-lg shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <span>Auditing Content...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Compliance Audit</span>
                </>
              )}
            </button>
          </form>

          {/* Past Audits */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Audit Logs ({audits.length})
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {audits.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAudit(a)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    selectedAudit?.id === a.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate text-slate-900">{a.targetTitle}</p>
                    <span className="text-[10px] text-slate-500">Score: {a.complianceScore}% • {a.targetGrade}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      String(a.status).toLowerCase() === 'passed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Report View */}
        <div className="lg:col-span-7">
          {selectedAudit ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                    {selectedAudit.targetGrade} Target
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedAudit.targetTitle}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Audited on {selectedAudit.timestamp}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-indigo-600">{selectedAudit.complianceScore}%</div>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {selectedAudit.status}
                  </span>
                </div>
              </div>

              {/* Checks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Readability Score</span>
                  <p className="text-sm font-bold text-slate-900">{selectedAudit.readabilityScore}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Child Safety Flag</span>
                  <p className="text-sm font-bold text-emerald-700">
                    {selectedAudit.safetyFlags?.length === 0 ? 'Passed Safety Filters' : 'Flagged Items'}
                  </p>
                </div>
              </div>

              {/* Detailed Recommendations */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auditor Recommendations</h3>
                <ul className="space-y-2">
                  {(selectedAudit.recommendations || []).map((rec, idx) => (
                    <li key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-700">
                      ✨ {typeof rec === 'string' ? rec : (rec as any)?.recommendation || (rec as any)?.text || JSON.stringify(rec)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Audit Selected"
              description="Execute a compliance audit on the left to view results."
              icon={<ShieldCheck className="w-10 h-10 text-slate-300" />}
            />
          )}
        </div>
      </div>
    </div>
  );
};
