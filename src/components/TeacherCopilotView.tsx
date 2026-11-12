import React, { useState, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Copy, Check, FileSpreadsheet, Users, HeartHandshake, Smile } from 'lucide-react';
import { TeacherMessage, Book } from '../types';
import { apiClient } from '../utils/apiClient';

export const TeacherCopilotView: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<TeacherMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: "Hello Educator! I'm your AI Copilot. How can I assist with your classroom instruction today? I can differentiate lessons for ELL/ESL students, draft IEP modifications, create practice worksheets, or write parent updates.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Book[]>('/api/books')
      .then((data) => setBooks(data || []))
      .catch(() => {});
  }, []);

  const presets = [
    { label: 'ELL / ESL Scaffold', category: 'Differentiation', icon: Users, prompt: 'How can I scaffold this lesson for English Language Learners with limited vocabulary?' },
    { label: 'IEP / 504 Modification', category: 'Special Needs', icon: HeartHandshake, prompt: 'Suggest 3 specific IEP accommodations for a student with ADHD during quiet reading time.' },
    { label: 'Homework Worksheet', category: 'Worksheet', icon: FileSpreadsheet, prompt: 'Draft a 5-question printable homework worksheet based on character courage and friendship.' },
    { label: 'Parent Progress Update', category: 'Communication', icon: Smile, prompt: 'Draft a warm, positive 1-paragraph email to parents detailing weekly reading achievements.' },
  ];

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: TeacherMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const selectedBook = books.find((b) => b.id === selectedBookId);
      const res = await apiClient.post<{ message: TeacherMessage }>('/api/teacher/copilot-chat', {
        message: textToSend,
        bookTitle: selectedBook?.title,
        context: selectedBook?.summary,
      });

      const aiText = res.message?.text || (res as any).aiResponse || (res as any).text || 'I am here to assist you with curriculum differentiation, lesson adaptation, and parent communications.';
      const aiMsg: TeacherMessage = res.message || {
        id: (res as any).messageId || `ai_${Date.now()}`,
        sender: 'assistant',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an issue processing your request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>Subsystem 03 • Teacher Assistant Copilot</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-2">Classroom Differentiation & Copilot Assistant</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generates ELL scaffolds, IEP modifications, custom worksheets, and parent communications in real time.
          </p>
        </div>

        {books.length > 0 && (
          <div className="shrink-0">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Attached Context Book:</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- General Classroom Assistant --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  📖 {b.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Preset Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {presets.map((p, idx) => {
          const IconComponent = p.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(p.prompt)}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                <IconComponent className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-indigo-600">
                  {p.category}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-950">{p.label}</p>
            </button>
          );
        })}
      </div>

      {/* Chat Window */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col h-[500px]">
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 relative group ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{typeof m.text === 'string' ? m.text : (m.text as any)?.text || JSON.stringify(m.text)}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] opacity-70">
                  <span>{m.timestamp}</span>
                  {m.sender === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(m.id, m.text)}
                      className="hover:text-indigo-600 p-1 rounded"
                      title="Copy to clipboard"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs text-slate-500">
                Copilot is composing response...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Copilot for lesson adaptations, ELL scaffolds, or worksheet prompts..."
            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
