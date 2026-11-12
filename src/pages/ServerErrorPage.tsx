import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ServerCrash, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ServerErrorPage: React.FC<{ errorDetails?: string }> = ({ errorDetails }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-2xs">
          <ServerCrash className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
          HTTP 500 Internal Error
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-3">Platform Exception</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          An unexpected server error occurred while processing your curriculum request.
        </p>

        {errorDetails && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <p className="text-[10px] font-mono text-slate-600 break-all">{errorDetails}</p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.reload()}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reload Platform
          </Button>
        </div>
      </div>
    </div>
  );
};
