'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetup2FA, useVerify2FASetup, useDisable2FA, useGet2FAStatus, useRegenerateBackupCodes } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Shield, QrCode, Key, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

export default function TwoFactorSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const setup2FAMutation = useSetup2FA();
  const verify2FASetupMutation = useVerify2FASetup();
  const disable2FAMutation = useDisable2FA();
  const regenerateBackupCodesMutation = useRegenerateBackupCodes();
  const { data: status, isLoading: statusLoading } = useGet2FAStatus();

  const handleSetup = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await setup2FAMutation.mutateAsync();
      setQrCodeUrl(response.data.qrCodeUrl);
      setSecret(response.data.secret);
      setBackupCodes(response.data.backupCodes);
      setSuccess('2FA setup initiated. Scan the QR code and verify below.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    setError('');
    setLoading(true);
    try {
      await verify2FASetupMutation.mutateAsync({ code: verificationCode });
      setSuccess('Two-factor authentication enabled successfully!');
      setQrCodeUrl('');
      setSecret('');
      setBackupCodes([]);
      setVerificationCode('');
      // Refetch status
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setError('');
    setLoading(true);
    try {
      await disable2FAMutation.mutateAsync({ code: disableCode });
      setSuccess('Two-factor authentication disabled. You will be logged out.');
      setDisableCode('');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await regenerateBackupCodesMutation.mutateAsync({ code: regenerateCode });
      setBackupCodes(response.data.backupCodes);
      setSuccess('Backup codes regenerated successfully!');
      setRegenerateCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h1>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4"
        >
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </motion.div>
      )}

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Status</h2>
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full ${status?.mfaEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-gray-700 dark:text-gray-300">
            2FA is {status?.mfaEnabled ? 'enabled' : 'disabled'}
          </span>
        </div>
        {status?.mfaEnabled && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {status.backupCodesRemaining} backup codes remaining
          </p>
        )}
      </div>

      {/* Setup 2FA */}
      {!status?.mfaEnabled && !qrCodeUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Enable Two-Factor Authentication</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add an extra layer of security to your account by enabling two-factor authentication.
            You'll need to use an authenticator app like Google Authenticator, Authy, or 1Password.
          </p>
          <button
            onClick={handleSetup}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Setup 2FA'}
          </button>
        </div>
      )}

      {/* QR Code Setup */}
      {qrCodeUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                Scan this with your authenticator app
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manual Entry Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={secret}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(secret, 'secret')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {copiedSecret ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="000000"
                />
              </div>
              <button
                onClick={handleVerifySetup}
                disabled={loading || verificationCode.length !== 6}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify and Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes */}
      {backupCodes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Backup Codes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {code}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
            className="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            {copiedCodes ? 'Copied!' : 'Copy All Codes'}
          </button>
        </div>
      )}

      {/* Disable 2FA */}
      {status?.mfaEnabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
            Disable Two-Factor Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Disabling 2FA will make your account less secure. You'll be logged out after disabling.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter current 2FA code to disable
              </label>
              <input
                type="text"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="000000"
              />
            </div>
            <button
              onClick={handleDisable}
              disabled={loading || disableCode.length !== 6}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes */}
      {status?.mfaEnabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Regenerate Backup Codes</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate new backup codes. Your old codes will be invalidated.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter current 2FA code
              </label>
              <input
                type="text"
                maxLength={6}
                value={regenerateCode}
                onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="000000"
              />
            </div>
            <button
              onClick={handleRegenerateCodes}
              disabled={loading || regenerateCode.length !== 6}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Regenerating...' : 'Regenerate Codes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
