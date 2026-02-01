'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authApi.login({ email, password, rememberMe });

      if (!result.success || !result.data) {
        // Handle specific error cases
        const errorMsg = result.error || 'Login failed';

        if (errorMsg.includes('rate limit') || errorMsg.includes('Too many')) {
          setError('Too many login attempts. Please wait a minute and try again.');
        } else if (errorMsg.includes('Invalid credentials') || errorMsg.includes('not found')) {
          setError('Invalid email or password.');
        } else if (errorMsg.includes('disabled') || errorMsg.includes('suspended')) {
          setError('Your account has been disabled. Contact support.');
        } else {
          setError(errorMsg);
        }
        return;
      }

      // Store user in Zustand (tokens are in httpOnly cookies)
      setUser({
        id: result.data.user.id,
        email: result.data.user.email,
        full_name: result.data.user.fullName,
        role: result.data.user.role,
        tenant_id: result.data.user.tenantId,
      });

      // Redirect based on role
      if (result.data.user.role === 'super_admin') {
        router.push('/super');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Box className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Silentbox Admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@silentbox.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none"
              >
                Remember me for 30 days
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p className="font-mono text-xs mt-1">admin@meetpoint.pro / demo123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
