'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Key, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  useSetup2FA, 
  useVerify2FASetup, 
  useDisable2FA, 
  useGet2FAStatus, 
  useRegenerateBackupCodes 
} from '@/lib/hooks';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import QRCode from '@/components/ui/qr-code';

interface TwoFactorAuthProps {
  className?: string;
}

export default function TwoFactorAuth({ className }: TwoFactorAuthProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [setupStep, setSetupStep] = useState<'setup' | 'verify'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Queries and mutations
  const { data: status, refetch: refetchStatus } = useGet2FAStatus();
  const setup2FAMutation = useSetup2FA();
  const verify2FASetupMutation = useVerify2FASetup();
  const disable2FAMutation = useDisable2FA();
  const regenerateBackupCodesMutation = useRegenerateBackupCodes();

  const handleSetup2FA = async () => {
    try {
      const response = await setup2FAMutation.mutateAsync();
      const { qrCodeUrl, secret, backupCodes } = response.data;
      
      setQrCodeUrl(qrCodeUrl);
      setSecret(secret);
      setBackupCodes(backupCodes);
      setShowSetupModal(true);
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
    }
  };

  const handleVerifySetup = async () => {
    try {
      await verify2FASetupMutation.mutateAsync({ code: verificationCode });
      setShowSetupModal(false);
      setSetupStep('setup');
      setVerificationCode('');
      setQrCodeUrl('');
      setSecret('');
      setBackupCodes([]);
      refetchStatus();
    } catch (error) {
      console.error('Failed to verify 2FA setup:', error);
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disable2FAMutation.mutateAsync({ code: disableCode });
      setShowDisableModal(false);
      setDisableCode('');
      refetchStatus();
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const response = await regenerateBackupCodesMutation.mutateAsync({ code: verificationCode });
      setBackupCodes(response.data.backupCodes);
      setVerificationCode('');
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Two-Factor Authentication Backup Codes\n\n` +
      `Account: ${status?.email}\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `Backup Codes (keep these safe):\n` +
      backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {status?.mfaEnabled ? (
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              ) : (
                <ShieldOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
          </div>
          <Badge className={status?.mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
            {status?.mfaEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        <div className="space-y-4">
          {status?.mfaEnabled ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Your account is protected with 2FA</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCodes(true)}
                  className="justify-start"
                >
                  <Key className="w-4 h-4 mr-2" />
                  View Backup Codes
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowDisableModal(true)}
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <ShieldOff className="w-4 h-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                {status?.backupCodesRemaining !== undefined && (
                  <p>{status.backupCodesRemaining} backup codes remaining</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-700">2FA is not enabled on your account</span>
              </div>

              <Button
                onClick={handleSetup2FA}
                disabled={setup2FAMutation.isPending}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                {setup2FAMutation.isPending ? 'Setting up...' : 'Enable Two-Factor Authentication'}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {setupStep === 'setup' ? 'Setup Two-Factor Authentication' : 'Verify Setup'}
              </h3>
              <p className="text-sm text-gray-600">
                {setupStep === 'setup' 
                  ? 'Scan the QR code with your authenticator app'
                  : 'Enter the 6-digit code to verify setup'
                }
              </p>
            </div>

            {setupStep === 'setup' ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {qrCodeUrl && (
                    <QRCode value={qrCodeUrl} size={192} />
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Manual Entry Key</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border flex-1">
                      {showSecret ? secret : '••••••••••••••••••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(secret)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setSetupStep('verify')}
                    className="w-full"
                  >
                    Continue to Verification
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSetupModal(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleVerifySetup}
                    disabled={verificationCode.length !== 6 || verify2FASetupMutation.isPending}
                    className="w-full"
                  >
                    {verify2FASetupMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Verify and Enable
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSetupStep('setup')}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Disable Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">
                Enter your current 2FA code to disable two-factor authentication
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleDisable2FA}
                  disabled={disableCode.length !== 6 || disable2FAMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {disable2FAMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldOff className="w-4 h-4 mr-2" />
                  )}
                  Disable 2FA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisableModal(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Backup Codes</h3>
              <p className="text-sm text-gray-600">
                Store these codes in a safe place. Each code can only be used once.
              </p>
            </div>

            <div className="space-y-4">
              {backupCodes.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 border rounded text-center font-mono text-sm"
                      >
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={downloadBackupCodes}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verify with current code to regenerate
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-[0.3em] font-mono"
                        placeholder="000000"
                      />
                    </div>
                    <Button
                      onClick={handleRegenerateBackupCodes}
                      disabled={verificationCode.length !== 6 || regenerateBackupCodesMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {regenerateBackupCodesMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Regenerate Codes
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No backup codes available</p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setShowBackupCodes(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
