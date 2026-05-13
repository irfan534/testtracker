'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-white p-6 flex items-center justify-center">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Critical Error</h2>
            <p className="text-gray-600 mb-6">
              {error.message || 'A critical error occurred. Please refresh the page.'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </Card>
        </div>
      </body>
    </html>
  );
}
