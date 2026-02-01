'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Super admin error:', error);
  }, [error]);

  return (
    <div className="p-6">
      <Card className="max-w-lg mx-auto bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-white">Admin Panel Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-400">
            An error occurred in the super admin panel. Please try again or contact support.
          </p>

          {error.digest && (
            <p className="text-xs text-center text-slate-500 font-mono bg-slate-800 px-3 py-2 rounded">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="default" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Link href="/super">
              <Button variant="outline" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Super Admin
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
