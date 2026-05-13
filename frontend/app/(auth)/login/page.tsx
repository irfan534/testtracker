'use client';

import { useState } from 'react';

// Prevent static generation
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { TwoFactorAuthResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setMfaEnabled = useAuthStore((state) => state.setMfaEnabled);
  const setTempToken = useAuthStore((state) => state.setTempToken);
  const setPending2FAUser = useAuthStore((state) => state.setPending2FAUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginMutation = useLogin();

  // Type guard function
  const isTwoFactorResponse = (data: any): data is TwoFactorAuthResponse => {
    return data && typeof data === 'object' && 'requires2FA' in data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      const response = await loginMutation.mutateAsync({ email, password });
      console.log('Login response:', response);

      // Check if 2FA is required
      if (isTwoFactorResponse(response.data)) {
        const { tempToken, user } = response.data;
        
        // Store 2FA state
        setTempToken(tempToken || '');
        setPending2FAUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        console.log('2FA required, redirecting...');
        router.push('/2fa');
        return;
      }

      const { accessToken, user } = response.data;
      console.log('Access token:', accessToken);
      console.log('User:', user);

      // Store tokens and user
      Cookies.set('accessToken', accessToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      });

      console.log('Cookie set successfully');

      setUser(user);
      setAccessToken(accessToken);
      setMfaEnabled(user.mfaEnabled || false);

      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);

      if (err.message === 'Network Error') {
        setError('Cannot connect to the server. Please ensure the backend API is running and your connection is secure.');
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Login failed. Please check your credentials.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@tracker.local');
    setPassword('Demo@123456');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="glass p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleLogin} className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-foreground">
            Welcome Back
          </h1>
          <p className="text-center text-muted-foreground">
            Sign in to access your compliance dashboard
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@tracker.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-smooth"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-smooth"
              required
              disabled={loading}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-accent text-accent-foreground font-medium rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="/register" className="text-accent font-medium hover:underline">
                Sign up
              </a>
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-4 text-sm text-accent hover:bg-accent/10 rounded-lg transition-smooth mb-2"
              disabled={loading}
            >
              Fill Demo Credentials
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Demo credentials: admin@tracker.local / Demo@123456
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
