'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import Cookies from 'js-cookie';
import AddCertificationDialog from '@/components/certifications/add-certification-dialog';
import {
  ArrowLeft,
  Building2,
  Users,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Mail,
  Phone,
  Globe,
  Shield,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Timer,
  Plus
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  userCount: number;
  certificationCount: number;
  certifications?: any[];
  logo?: string;
}

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchCompanyDetails();
  }, [params.id]);

  const fetchCompanyDetails = async () => {
    try {
      setError(null);
      const response = await apiClient.get(`/companies/${params.id}`);
      setCompany(response.data);
    } catch (error: any) {
      console.error('Failed to fetch company details:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        const message = error.response?.data?.message || error.message || 'Failed to load company details';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCertificationAdded = () => {
    fetchCompanyDetails(); // Refresh company details to show new certification
  };

  const getComplianceStatus = (certifications: any[]) => {
    if (!certifications || certifications.length === 0) {
      return { status: 'NO_CERTIFICATIONS', color: 'text-gray-600 bg-gray-100', icon: AlertTriangle };
    }

    const activeCount = certifications.filter(cert => cert.status === 'ACTIVE').length;
    const expiringSoonCount = certifications.filter(cert => cert.status === 'EXPIRING_SOON').length;
    const expiredCount = certifications.filter(cert => cert.status === 'EXPIRED').length;

    if (expiredCount > 0) {
      return { status: 'COMPLIANCE_ISSUES', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    } else if (expiringSoonCount > 0) {
      return { status: 'ATTENTION_NEEDED', color: 'text-yellow-600 bg-yellow-100', icon: Clock };
    } else if (activeCount > 0) {
      return { status: 'FULLY_COMPLIANT', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    } else {
      return { status: 'NO_CERTIFICATIONS', color: 'text-gray-600 bg-gray-100', icon: AlertTriangle };
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { days: Math.abs(diffDays), status: 'expired', text: '' };
    } else if (diffDays === 0) {
      return { days: 0, status: 'today', text: 'Expires today' };
    } else if (diffDays <= 30) {
      return { days: diffDays, status: 'expiring', text: `${diffDays} days left` };
    } else {
      return { days: diffDays, status: 'active', text: `${diffDays} days left` };
    }
  };

  const getDaysRemainingColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50';
      case 'today': return 'text-orange-600 bg-orange-50';
      case 'expiring': return 'text-yellow-600 bg-yellow-50';
      case 'active': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCertificationStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'EXPIRED';
    } else if (diffDays === 0) {
      return 'EXPIRING_TODAY';
    } else if (diffDays <= 30) {
      return 'EXPIRING_SOON';
    } else {
      return 'ACTIVE';
    }
  };

  const getCertificationStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'EXPIRING_SOON': return 'text-yellow-600 bg-yellow-50';
      case 'EXPIRING_TODAY': return 'text-orange-600 bg-orange-50';
      case 'EXPIRED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'INACTIVE': return 'text-red-600 bg-red-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </div>
          <Card className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Company</h2>
            <p className="text-gray-600 mb-4">{error || 'Company not found'}</p>
            <Button onClick={() => router.push('/companies')}>
              Go to Companies List
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const complianceStatus = getComplianceStatus(company.certifications || []);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Companies
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{company.name}</h1>
                <p className="text-gray-600">{company.industry}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(company.status)}`}>
              {company.status}
            </span>
          </div>

          {/* Company Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Company Overview</h2>
                  {company.description && (
                    <p className="text-gray-600 mb-4">{company.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.website && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {company.website}
                        </a>
                      </div>
                    )}
                    {company.contactEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{company.contactEmail}</span>
                      </div>
                    )}
                    {company.contactPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{company.contactPhone}</span>
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{company.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Compliance Status Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Compliance Status</h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${complianceStatus.color}`}>
                  <complianceStatus.icon className="w-4 h-4" />
                  {complianceStatus.status.replace('_', ' ')}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{company.certifications?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Certifications</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {company.certifications?.filter(cert => cert.status === 'ACTIVE').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {company.certifications?.filter(cert => cert.status === 'EXPIRING_SOON').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Expiring Soon</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {company.certifications?.filter(cert => cert.status === 'EXPIRED').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Expired</div>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Certifications List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
                <AddCertificationDialog onSuccess={handleCertificationAdded}>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Certification
                  </Button>
                </AddCertificationDialog>
              </div>
              {company.certifications && company.certifications.length > 0 ? (
                <div className="space-y-4">
                  {company.certifications.map((cert, index) => {
                    const daysRemaining = getDaysRemaining(cert.expiryDate);
                    const calculatedStatus = getCertificationStatus(cert.expiryDate);
                    return (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{cert.name}</h3>
                          <p className="text-sm text-gray-600">{cert.issuingBody}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCertificationStatusColor(calculatedStatus)}`}>
                          {calculatedStatus}
                        </div>
                      </div>

                      {/* Days Remaining Visual Indicator */}
                      {daysRemaining.status !== 'expired' && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getDaysRemainingColor(daysRemaining.status)} mb-3`}>
                          <Timer className="w-4 h-4" />
                          <span className="text-sm font-medium">{daysRemaining.text}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Issued: {new Date(cert.issueDate).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Expires: {new Date(cert.expiryDate).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>

                      {cert.description && (
                        <p className="text-sm text-gray-600">{cert.description}</p>
                      )}
                    </motion.div>
                  );
                })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications</h3>
                  <p className="text-gray-600">This company doesn't have any certifications yet.</p>
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
