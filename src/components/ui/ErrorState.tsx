import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An Error Occurred',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-2xl bg-rose-50/60 border border-rose-200 text-rose-900 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-100 rounded-xl shrink-0 text-rose-600">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-rose-300 text-rose-800 hover:bg-rose-100"
              onClick={onRetry}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Retry Action
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
