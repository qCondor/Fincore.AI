'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service (Sentry, etc.)
    console.error('[Fincore Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d1e36] to-[#0a1628] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="liquid-glass rounded-[24px] p-8 text-center">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-400" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2">
            Something went wrong
          </h1>

          <p className="text-white/60 text-sm mb-6">
            We hit an unexpected issue. Your data is safe — try refreshing or head back home.
          </p>

          {/* Error digest for support (only in production) */}
          {error.digest && (
            <p className="text-[10px] text-white/30 mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 h-12 rounded-full bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <RotateCcw size={16} />
              Try Again
            </button>

            <Link
              href="/"
              className="flex-1 h-12 rounded-full bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <Home size={16} />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
