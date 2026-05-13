'use client';

import { useState } from 'react';

// Prevent static generation
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useVerify2FALogin } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, RefreshCw } from 'lucide-react';

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tempToken = useAuthStore((state) => state.tempToken);
  const pending2FAUser = useAuthStore((state) => state.pending2FAUser);
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setMfaEnabled = useAuthStore((state) => state.setMfaEnabled);
  const setTempToken = useAuthStore((state) => state.setTempToken);
  const setPending2FAUser = useAuthStore((state) => state.setPending2FAUser);

  const verify2FAMutation = useVerify2FALogin();

  // Redirect if no temp token
  if (!tempToken || !pending2FAUser) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verify2FAMutation.mutateAsync({
        code,
        tempToken,
        userId: pending2FAUser.id,
      });

      const { accessToken, user } = response.data;

      // Store tokens and user
      Cookies.set('accessToken', accessToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      setUser(user);
      setAccessToken(accessToken);
      setMfaEnabled(true);

      // Clear 2FA state
      setTempToken(null);
      setPending2FAUser(null);

      router.push('/dashboard');
    } catch (err: any) {
      console.error('2FA verification error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Invalid verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          for {pending2FAUser.email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="000000"
            required
            disabled={loading}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500 text-center">
            You can also use a backup code
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Verify
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => router.push('/login')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Back to login
        </button>
      </div>
    </motion.div>
  );
}
