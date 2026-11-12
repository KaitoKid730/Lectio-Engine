import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-2xs">
          <FileQuestion className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800">
          HTTP 404 Not Found
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-3">Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The curriculum view or resource you are searching for does not exist or has been moved.
        </p>

        <div className="mt-6 flex justify-center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard')}
            icon={<Home className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
