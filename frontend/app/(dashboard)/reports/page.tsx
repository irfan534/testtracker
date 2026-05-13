'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import Input from '@/components/ui/input';
import { useComplianceReport, useExpiryReport } from '@/lib/hooks';
import { formatDate, getDaysUntilExpiry } from '@/lib/utils';
import Cookies from 'js-cookie';
import {
  Calendar,
  Search,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  ArrowRight,
  Activity,
  Target,
  Shield,
  Award,
  AlertTriangle,
  Download,
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReport, setActiveReport] = useState<'compliance' | 'expiry' | null>(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      setAuthError(true);
      router.push('/login');
    }
  }, [router]);

  const [complianceEnabled, setComplianceEnabled] = useState(false);
  const [expiryEnabled, setExpiryEnabled] = useState(false);

  const {
    data: complianceData,
    isLoading: complianceLoading,
    error: complianceError,
    refetch: refetchCompliance,
  } = useComplianceReport(complianceEnabled);

  const {
    data: expiryData,
    isLoading: expiryLoading,
    error: expiryError,
    refetch: refetchExpiry,
  } = useExpiryReport(expiryEnabled);

  const isLoading = complianceLoading || expiryLoading;
  const hasError = complianceError || expiryError;

  if (authError) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to view compliance reports</p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  const handleGenerate = (type: 'compliance' | 'expiry') => {
    const token = Cookies.get('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setActiveReport(type);
    if (type === 'compliance') {
      setComplianceEnabled(true);
      setTimeout(() => refetchCompliance(), 0);
    } else {
      setExpiryEnabled(true);
      setTimeout(() => refetchExpiry(), 0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError && !complianceData && !expiryData) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Reports</h2>
          <p className="text-gray-600 mb-6">Unable to fetch report data. Please try again.</p>
          <Button
            onClick={() => {
              setComplianceEnabled(false);
              setExpiryEnabled(false);
              setActiveReport(null);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Reset
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">Generate and view compliance reports with real-time data</p>
          </div>

          {/* Report Generation Feature Card */}
          <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center"
                >
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-1">Advanced Report Generation</h3>
                  <p className="text-indigo-700 text-sm mb-3">
                    Generate comprehensive compliance and expiry reports with real-time data
                  </p>

                  {/* Report Generation Flow Visualization */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm"
                    >
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-800">Data Analysis</span>
                    </motion.div>

                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-purple-200 shadow-sm"
                    >
                      <Activity className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-800">Report Generation</span>
                    </motion.div>

                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    >
                      <ArrowRight className="w-4 h-4 text-purple-400" />
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-green-200 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">View Results</span>
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  animate={{
                    rotate: [0, 15, -15, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="hidden md:block"
                >
                  <Zap className="w-8 h-8 text-indigo-400" />
                </motion.div>
              </div>
            </div>
          </Card>

          {/* Quick Actions - Generate Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Compliance Report Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"
                    >
                      <Shield className="w-6 h-6 text-blue-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Compliance Report</h3>
                      <p className="text-sm text-gray-600">Complete compliance overview</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerate('compliance')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {activeReport === 'compliance' && complianceLoading ? 'Loading...' : 'Generate'}
                  </Button>
                </div>

                {/* Compliance Report Data */}
                {complianceData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        Generated: {formatDate(new Date(complianceData.generatedAt))}
                      </span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {complianceData.frameworks?.length || 0} Frameworks
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        {complianceData.avgCompliance || 0}%
                      </span>
                      <span className="text-sm text-gray-600">Average Compliance</span>
                    </div>
                    {complianceData.frameworks && complianceData.frameworks.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {complianceData.frameworks.map((fw: any) => (
                          <div
                            key={fw.id}
                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100"
                          >
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {fw.framework?.name || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    fw.compliancePercentage >= 80
                                      ? 'bg-green-500'
                                      : fw.compliancePercentage >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${fw.compliancePercentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-8">
                                {fw.compliancePercentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {complianceError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-red-600">
                          {'response' in complianceError && (complianceError as any).response?.status === 401
                            ? 'Authentication required.'
                            : 'Failed to load compliance report.'}
                        </p>
                      </div>
                      {'response' in complianceError && (complianceError as any).response?.status === 401 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push('/login')}
                          className="text-xs"
                        >
                          Login
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Expiry Report Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"
                    >
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Expiry Report</h3>
                      <p className="text-sm text-gray-600">Upcoming expirations</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerate('expiry')}
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    {activeReport === 'expiry' && expiryLoading ? 'Loading...' : 'Generate'}
                  </Button>
                </div>

                {/* Expiry Report Data */}
                {expiryData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-purple-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        Generated: {formatDate(new Date(expiryData.generatedAt))}
                      </span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {expiryData.total || 0} Certifications
                      </Badge>
                    </div>

                    {expiryData.certifications && expiryData.certifications.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {expiryData.certifications
                          .filter((cert: any) => {
                            if (!searchTerm) return true;
                            return (
                              cert.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              cert.issuingBody?.toLowerCase().includes(searchTerm.toLowerCase())
                            );
                          })
                          .map((cert: any) => {
                            const days = cert.daysRemaining;
                            let statusColor = 'text-green-600 bg-green-50';
                            let statusText = 'Active';
                            let icon = <CheckCircle className="w-4 h-4 text-green-600" />;

                            if (days < 0) {
                              statusColor = 'text-red-600 bg-red-50';
                              statusText = 'Expired';
                              icon = <AlertCircle className="w-4 h-4 text-red-600" />;
                            } else if (days <= 30) {
                              statusColor = 'text-yellow-600 bg-yellow-50';
                              statusText = 'Expiring Soon';
                              icon = <AlertTriangle className="w-4 h-4 text-yellow-600" />;
                            }

                            return (
                              <div
                                key={cert.id}
                                className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {icon}
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                      {cert.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 ml-6">{cert.issuingBody}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <Badge className={`text-xs ${statusColor}`}>{statusText}</Badge>
                                  <span
                                    className={`text-xs font-medium ${
                                      days < 0
                                        ? 'text-red-600'
                                        : days <= 30
                                          ? 'text-yellow-600'
                                          : 'text-green-600'
                                    }`}
                                  >
                                    {days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">No certifications found</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {expiryError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-red-600">
                          {'response' in expiryError && (expiryError as any).response?.status === 401
                            ? 'Authentication required.'
                            : 'Failed to load expiry report.'}
                        </p>
                      </div>
                      {'response' in expiryError && (expiryError as any).response?.status === 401 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push('/login')}
                          className="text-xs"
                        >
                          Login
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Search Filter */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search certifications in expiry report..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {expiryData?.certifications?.filter((c: any) => c.daysRemaining > 30).length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Active Certifications</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {expiryData?.certifications?.filter((c: any) => c.daysRemaining >= 0 && c.daysRemaining <= 30).length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Expiring Soon (30d)</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {expiryData?.certifications?.filter((c: any) => c.daysRemaining < 0).length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Expired</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
