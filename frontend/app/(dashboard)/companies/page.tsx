'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import Cookies from 'js-cookie';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, Search, Plus, Building2, Users, Calendar, Mail, Phone, Edit, Trash2, Eye, X, TrendingUp, Globe, Award, Target, Zap, ArrowRight, Activity, CheckCircle, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

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

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    website: '',
    region: '',
    logo: null as string | null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const [deletedCompanyInfo, setDeletedCompanyInfo] = useState<Company | null>(null);
  const [deletedCompanies, setDeletedCompanies] = useState<Set<string>>(new Set());
  
  const [actionError, setActionError] = useState<string | null>(null);
  // Add certification modal states
  const [showAddCertificationModal, setShowAddCertificationModal] = useState(false);
  const [certificationFormData, setCertificationFormData] = useState({
    name: '',
    certificateId: '',
    certificateType: '',
    issueDate: '',
    expiryDate: '',
    validityDays: 365,
    issuingBody: '',
    owner: '',
    department: '',
    description: '',
    renewalReminderDays: 30,
  });

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setFetchError(false);
      setErrorMessage(null);
      console.log('Attempting to fetch companies...');
      const response = await apiClient.get('/companies');
      setCompanies(response.data.companies || []);
    } catch (error: any) {
      console.error('Company Fetch Error:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        const isNetworkError = error.message === 'Network Error' || (!error.response && error.request);
        const configuredApiUrl = (apiClient as any).defaults?.baseURL;
        const fallbackUrl = typeof window !== 'undefined' ? window.location.origin : 'server';
        const apiUrl = configuredApiUrl || fallbackUrl;
        
        console.error('Companies fetch failed:', { 
          message: error.message, 
          url: configuredApiUrl ? `${configuredApiUrl}/companies` : 'API URL NOT CONFIGURED',
          isNetworkError 
        });

        setFetchError(true);
        const message = !configuredApiUrl 
          ? "Configuration Error: NEXT_PUBLIC_API_URL is not defined. The frontend doesn't know where the backend is."
          : isNetworkError 
          ? `Network Error: Cannot reach the server at ${apiUrl}. Please verify the backend container is running and CORS is configured correctly.` 
          : (error.response?.data?.message || error.message || 'An unexpected error occurred');
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData({ ...formData, logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setFormData({ ...formData, logo: null });
  };

  const handleAddCertification = async () => {
    if (!certificationFormData.name || !certificationFormData.certificateId || 
        !certificationFormData.certificateType || !certificationFormData.issueDate || 
        !certificationFormData.expiryDate || !certificationFormData.issuingBody) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Debug: Log form data
      console.log('Form data being sent:', certificationFormData);
      
      // Send certification data to backend
      const certificationData = {
        name: certificationFormData.name,
        certificateId: certificationFormData.certificateId,
        certificateType: certificationFormData.certificateType,
        issueDate: new Date(certificationFormData.issueDate),
        expiryDate: new Date(certificationFormData.expiryDate),
        validityDays: certificationFormData.validityDays,
        renewalReminderDays: certificationFormData.renewalReminderDays,
        issuingBody: certificationFormData.issuingBody,
        owner: certificationFormData.owner,
        department: certificationFormData.department,
        description: certificationFormData.description,
      };

      // Debug: Log data being sent to API
      console.log('Data being sent to API:', JSON.stringify(certificationData, null, 2));
      console.log('certificateId type:', typeof certificationData.certificateId);
      console.log('certificateId value:', certificationData.certificateId);

      const response = await apiClient.post('/certifications', certificationData);
      console.log('Certification added successfully', response.data);

      setShowAddCertificationModal(false);
      setCertificationFormData({
        name: '',
        certificateId: '',
        certificateType: '',
        issueDate: '',
        expiryDate: '',
        validityDays: 365,
        issuingBody: '',
        owner: '',
        department: '',
        description: '',
        renewalReminderDays: 30,
      });

      // Update local state to show the new certification
      if (selectedCompany) {
        const updatedCompany = {
          ...selectedCompany,
          certifications: [...(selectedCompany.certifications || []), response.data],
          certificationCount: (selectedCompany.certificationCount || 0) + 1
        };
        setSelectedCompany(updatedCompany);
      }

      alert('Certification added successfully!');
    } catch (error: any) {
      console.error('Failed to add certification:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to add certification';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleAddCompany = async () => {
    console.log('handleAddCompany called', formData);

    if (!formData.name) {
      alert('Please enter a company name');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      console.log('Sending JSON request');
      const response = await apiClient.post('/companies', {
        name: formData.name,
        industry: formData.industry,
        description: formData.description,
        website: formData.website,
        
        region: formData.region,
        logo: formData.logo,
      });

      console.log('Company added successfully', response.data);

      setShowAddModal(false);
      setFormData({
        name: '',
        industry: '',
        description: '',
        website: '',
        
        region: '',
        logo: null,
      });
      setLogoPreview(null);
      fetchCompanies(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to add company:', error);
      const message = error.response?.data?.message || error.message || 'Failed to add company';
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanyClick = (company: Company) => {
    router.push(`/companies/${company.id}`);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowEditModal(true);
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;
    
    try {
      setActionError(null);
      const response = await apiClient.put(`/companies/${editingCompany.id}`, {
        name: editingCompany.name,
        industry: editingCompany.industry,
        description: editingCompany.description,
        website: editingCompany.website,
      });

      setShowEditModal(false);
      setEditingCompany(null);
      fetchCompanies(); // Refresh the list
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update company';
      setActionError(message);
    }
  };

  const handleDeleteCompany = (company: Company) => {
    setDeletingCompany(company);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCompany = async () => {
    if (!deletingCompany) return;
    
    try {
      await apiClient.delete(`/companies/${deletingCompany.id}`);
      
      // Store deleted company info for undo
      setDeletedCompanyInfo(deletingCompany);
      setShowDeleteConfirm(false);
      setDeletingCompany(null);
      
      // Add to deleted companies set
      setDeletedCompanies(prev => new Set(prev).add(deletingCompany.id));
      
      // Show undo notification
      setShowUndoNotification(true);
      
      // Hide undo notification after 5 seconds
      setTimeout(() => {
        setShowUndoNotification(false);
      }, 5000);
      
      // Remove from companies list
      setCompanies(prev => prev.filter(company => company.id !== deletingCompany.id));
      
      console.log('Company deleted successfully:', deletingCompany.name);
    } catch (error: any) {
      console.error('Failed to delete company:', error);
      if (error.response) {
        alert(`Failed to delete company: ${error.response.data.message || error.message}`);
      } else {
        alert(`Failed to delete company: ${error.message}`);
      }
    }
  };

  const handleUndoDelete = () => {
    // This is a mock undo - in real implementation, you'd restore from database
    if (deletedCompanyInfo) {
      console.log('Undoing delete for:', deletedCompanyInfo.name);
      
      // Remove from deleted companies set
      setDeletedCompanies(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedCompanyInfo.id);
        return newSet;
      });
      
      // Add company back to main list
      setCompanies(prev => [...prev, deletedCompanyInfo]);
      
      setDeletedCompanyInfo(null);
      setShowUndoNotification(false);
      // Company restored successfully - no alert needed
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || company.status === filterStatus;
    const isNotDeleted = !deletedCompanies.has(company.id);
    return matchesSearch && matchesStatus && isNotDeleted;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'INACTIVE': return 'text-red-600 bg-red-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-purple-600 bg-purple-50';
      case 'large': return 'text-orange-600 bg-orange-50';
      case 'enterprise': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            {/* Loading Spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mb-8"
            >
              <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </motion.div>
            
            {/* Loading Text */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl font-semibold text-gray-900 mb-2"
            >
              Loading Companies
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-gray-600 mb-8"
            >
              Fetching company data and compliance information...
            </motion.p>
            
            {/* Progress Bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-8"
            >
              <div className="h-full bg-blue-600 rounded-full"></div>
            </motion.div>
            
            {/* Skeleton Cards with Staggered Animation */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className="animate-pulse"
                >
                  <div className="h-64 bg-gray-200 rounded-lg">
                    <div className="p-6">
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                      <div className="flex justify-between mt-8">
                        <div className="h-8 bg-gray-300 rounded w-20"></div>
                        <div className="h-8 bg-gray-300 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Companies</h2>
          <p className="text-gray-600 mb-6">{errorMessage || 'Unable to fetch company data. Please try again.'}</p>
          <Button
            onClick={() => {
              setLoading(true);
              fetchCompanies();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Companies</h1>
              <p className="text-gray-600">Manage organizations and their compliance data</p>
            </div>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>

          {/* Company Management Feature Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"
              >
                <Building2 className="w-6 h-6 text-blue-600" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Company Management Hub</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Organize and track compliance data across all your organizations
                </p>

                {/* Company Management Flow Visualization */}
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-200 shadow-sm"
                  >
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">Add Company</span>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm"
                  >
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium text-indigo-800">Track Users</span>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  >
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-purple-200 shadow-sm"
                  >
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-800">Monitor Compliance</span>
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
                <Zap className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Companies</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{companies.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Companies</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{companies.filter(c => c.status === 'ACTIVE').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Users</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{companies.reduce((sum, c) => sum + c.userCount, 0)}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Certifications</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{companies.reduce((sum, c) => sum + c.certificationCount, 0)}</p>
                </div>
                <Award className="w-8 h-8 text-orange-400" />
              </div>
            </motion.div>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanyClick(company)}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600">{company.industry}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                    {company.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {company.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{company.description}</p>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {company.website}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{company.userCount} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{company.certificationCount} certifications</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-xs text-gray-500">
                    Created {new Date(company.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/companies/${company.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCompany(company);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCompany(company);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600">Get started by adding your first company</p>
            </div>
          )}
        </motion.div>

        {/* Add Company Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company organization to track compliance data
                </DialogDescription>
              </DialogHeader>
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {actionError}
                </div>
              )}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium mb-1 block">Company Name</label>
                    <Input
                      id="name"
                      placeholder="Enter company name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Company Logo</label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Company logo preview"
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="industry" className="text-sm font-medium mb-1 block">Industry</label>
                    <Input
                      id="industry"
                      placeholder="Enter industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="text-sm font-medium mb-1 block">Description</label>
                    <Input
                      id="description"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="text-sm font-medium mb-1 block">Website</label>
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="region" className="text-sm font-medium mb-1 block">Region</label>
                    <Input
                      id="region"
                      placeholder="Enter region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddCompany} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Company'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Company Modal */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Company</DialogTitle>
                <DialogDescription>
                  Update company information
                </DialogDescription>
              </DialogHeader>
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {actionError}
                </div>
              )}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="edit-name" className="text-sm font-medium mb-1 block">Company Name</label>
                    <Input
                      id="edit-name"
                      placeholder="Enter company name"
                      value={editingCompany?.name || ''}
                      onChange={(e) => editingCompany && setEditingCompany({ ...editingCompany, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-industry" className="text-sm font-medium mb-1 block">Industry</label>
                    <Input
                      id="edit-industry"
                      placeholder="Enter industry"
                      value={editingCompany?.industry || ''}
                      onChange={(e) => editingCompany && setEditingCompany({ ...editingCompany, industry: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-description" className="text-sm font-medium mb-1 block">Description</label>
                    <Input
                      id="edit-description"
                      placeholder="Enter description"
                      value={editingCompany?.description || ''}
                      onChange={(e) => editingCompany && setEditingCompany({ ...editingCompany, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-website" className="text-sm font-medium mb-1 block">Website</label>
                    <Input
                      id="edit-website"
                      placeholder="https://example.com"
                      value={editingCompany?.website || ''}
                      onChange={(e) => editingCompany && setEditingCompany({ ...editingCompany, website: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCompany}>
                  Update Company
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Modal */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this company? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Company: <strong>{deletingCompany?.name}</strong>
                </p>
                <p className="text-xs text-red-600">
                  This will permanently remove all company data including certifications and users.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={confirmDeleteCompany}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Company
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Undo Notification */}
          {showUndoNotification && deletedCompanyInfo && (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v10a8 8 0 01-8 8h-10" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{deletedCompanyInfo.name} restored</p>
                  <p className="text-sm opacity-90">Click to undo</p>
                </div>
                <button
                  onClick={handleUndoDelete}
                  className="ml-4 bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Undo
                </button>
              </div>
            </div>
          )}

          {/* Company Detail Modal */}
          <Dialog open={showCompanyDetail} onOpenChange={setShowCompanyDetail}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Company Details</DialogTitle>
                <DialogDescription>
                  View comprehensive compliance status and manage certifications
                </DialogDescription>
              </DialogHeader>
              {selectedCompany && (
                <div className="space-y-6">
                  {/* Company Info Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-white rounded-lg shadow-sm flex items-center justify-center">
                        {selectedCompany.logo ? (
                          <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Building2 className="w-10 h-10 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedCompany.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {selectedCompany.industry}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {selectedCompany.userCount} users
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCompany.status)}`}>
                            {selectedCompany.status}
                          </span>
                        </div>
                        {selectedCompany.description && (
                          <p className="text-gray-700 mb-3">{selectedCompany.description}</p>
                        )}
                        {selectedCompany.website && (
                          <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline inline-flex">
                            <Globe className="w-4 h-4 mr-1" />
                            {selectedCompany.website}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compliance Status Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {selectedCompany.certifications?.filter((c: any) => c.status === 'ACTIVE').length || 0}
                      </p>
                      <p className="text-xs text-green-700 mt-1">Active Certifications</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-xs text-yellow-600 font-medium">Expiring</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">
                        {selectedCompany.certifications?.filter((c: any) => {
                          const daysUntilExpiry = Math.ceil((new Date(c.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                        }).length || 0}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">Expiring Soon</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="text-xs text-red-600 font-medium">Expired</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">
                        {selectedCompany.certifications?.filter((c: any) => {
                          const daysUntilExpiry = Math.ceil((new Date(c.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return daysUntilExpiry <= 0;
                        }).length || 0}
                      </p>
                      <p className="text-xs text-red-700 mt-1">Expired</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{selectedCompany.certificationCount}</p>
                      <p className="text-xs text-blue-700 mt-1">Total Certifications</p>
                    </div>
                  </div>

                  {/* Detailed Certifications Section */}
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Certifications & Compliance</h4>
                        <p className="text-sm text-gray-600 mt-1">Detailed certificate information and validity status</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowAddCertificationModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Certification
                      </Button>
                    </div>
                    
                    {selectedCompany.certifications && selectedCompany.certifications.length > 0 ? (
                      <div className="space-y-6">
                        {selectedCompany.certifications.map((cert: any) => {
                          const expiryDate = new Date(cert.expiryDate);
                          const today = new Date();
                          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                          const isExpired = daysUntilExpiry <= 0;
                          const issueDate = new Date(cert.issueDate);
                          const totalDays = cert.validityDays;
                          const daysElapsed = Math.ceil((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
                          const progressPercentage = Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100));

                          return (
                            <div key={cert.id} className="border rounded-lg overflow-hidden">
                              {/* Certificate Header */}
                              <div className={`p-4 border-l-4 ${
                                isExpired ? 'bg-red-50 border-red-500' :
                                isExpiringSoon ? 'bg-yellow-50 border-yellow-500' :
                                cert.status === 'ACTIVE' ? 'bg-green-50 border-green-500' :
                                'bg-gray-50 border-gray-500'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h5 className="text-lg font-semibold text-gray-900">{cert.name}</h5>
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        isExpired ? 'text-red-700 bg-red-100' :
                                        isExpiringSoon ? 'text-yellow-700 bg-yellow-100' :
                                        cert.status === 'ACTIVE' ? 'text-green-700 bg-green-100' :
                                        'text-gray-700 bg-gray-100'
                                      }`}>
                                        {isExpired ? 'EXPIRED' : isExpiringSoon ? `EXPIRING IN ${daysUntilExpiry} DAYS` : cert.status}
                                      </span>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                        {cert.certificateType}
                                      </span>
                                    </div>
                                    {cert.description && (
                                      <p className="text-gray-700 mb-3">{cert.description}</p>
                                    )}
                                    
                                    {/* Validity Progress Bar */}
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span>Validity Progress</span>
                                        <span>{Math.round(progressPercentage)}% complete</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            isExpired ? 'bg-red-500' :
                                            isExpiringSoon ? 'bg-yellow-500' :
                                            progressPercentage > 80 ? 'bg-orange-500' :
                                            'bg-green-500'
                                          }`}
                                          style={{ width: `${Math.min(100, progressPercentage)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button size="sm" variant="outline" className="text-blue-600">
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-gray-500">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Certificate Details Grid */}
                              <div className="p-4 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Certificate Information */}
                                  <div className="space-y-3">
                                    <h6 className="font-semibold text-gray-900 text-sm border-b pb-2">Certificate Information</h6>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Certificate ID:</span>
                                        <span className="font-mono text-gray-900">{cert.certificateId}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Type:</span>
                                        <span className="text-gray-900">{cert.certificateType}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`font-medium ${
                                          isExpired ? 'text-red-600' :
                                          isExpiringSoon ? 'text-yellow-600' :
                                          cert.status === 'ACTIVE' ? 'text-green-600' :
                                          'text-gray-600'
                                        }`}>
                                          {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : cert.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Issuing Authority */}
                                  <div className="space-y-3">
                                    <h6 className="font-semibold text-gray-900 text-sm border-b pb-2">Issuing Authority</h6>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Issuing Body:</span>
                                        <span className="text-gray-900">{cert.issuingBody}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Issue Date:</span>
                                        <span className="text-gray-900">{issueDate.toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Expiry Date:</span>
                                        <span className={`font-medium ${
                                          isExpired ? 'text-red-600' :
                                          isExpiringSoon ? 'text-yellow-600' :
                                          'text-gray-900'
                                        }`}>
                                          {expiryDate.toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Validity Period:</span>
                                        <span className="text-gray-900">{cert.validityDays} days</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Renewal Reminder:</span>
                                        <span className="text-gray-900">{cert.renewalReminderDays} days before</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assignment & Contact */}
                                  <div className="space-y-3">
                                    <h6 className="font-semibold text-gray-900 text-sm border-b pb-2">Assignment</h6>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Owner:</span>
                                        <span className="text-gray-900">{cert.owner || 'Not assigned'}</span>
                                      </div>
                                      {cert.department && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Department:</span>
                                          <span className="text-gray-900">{cert.department}</span>
                                        </div>
                                      )}
                                      {cert.user && (
                                        <div className="mt-3 pt-3 border-t">
                                          <span className="text-gray-600 block mb-1">Assigned to:</span>
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                              <span className="text-xs font-medium text-blue-600">
                                                {cert.user.firstName[0]}{cert.user.lastName[0]}
                                              </span>
                                            </div>
                                            <span className="text-gray-900">
                                              {cert.user.firstName} {cert.user.lastName}
                                            </span>
                                          </div>
                                          <span className="text-xs text-gray-500">{cert.user.email}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Evidence Documents */}
                                {cert.evidenceUrls && cert.evidenceUrls.length > 0 && (
                                  <div className="mt-4 pt-4 border-t">
                                    <h6 className="font-semibold text-gray-900 text-sm mb-3">Evidence Documents</h6>
                                    <div className="flex flex-wrap gap-2">
                                      {cert.evidenceUrls.map((url: string, index: number) => (
                                        <a
                                          key={index}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
                                        >
                                          <Globe className="w-3 h-3" />
                                          Document {index + 1}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h5 className="text-lg font-medium text-gray-900 mb-2">No Certifications Yet</h5>
                        <p className="text-gray-600 mb-4">This company doesn't have any certifications assigned yet.</p>
                        <Button onClick={() => setShowAddCertificationModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Certification
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setShowCompanyDetail(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Certification Modal */}
          <Dialog open={showAddCertificationModal} onOpenChange={setShowAddCertificationModal}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Certification</DialogTitle>
                <DialogDescription>
                  Add a new certification to {selectedCompany?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="certName" className="text-sm font-medium mb-1 block">Certification Name *</label>
                    <Input
                      id="certName"
                      placeholder="e.g., ISO 27001"
                      value={certificationFormData.name}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="certId" className="text-sm font-medium mb-1 block">Certificate ID *</label>
                    <Input
                      id="certId"
                      placeholder="e.g., ISO-27001-001"
                      value={certificationFormData.certificateId}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, certificateId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="certType" className="text-sm font-medium mb-1 block">Certificate Type *</label>
                    <select
                      id="certType"
                      value={certificationFormData.certificateType}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, certificateType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="ISO">ISO</option>
                      <option value="SOC 2">SOC 2</option>
                      <option value="HIPAA">HIPAA</option>
                      <option value="PCI DSS">PCI DSS</option>
                      <option value="GDPR">GDPR</option>
                      <option value="NIST">NIST</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="issuingBody" className="text-sm font-medium mb-1 block">Issuing Body *</label>
                    <Input
                      id="issuingBody"
                      placeholder="e.g., ISO Certification Body"
                      value={certificationFormData.issuingBody}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, issuingBody: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="issueDate" className="text-sm font-medium mb-1 block">Issue Date *</label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={certificationFormData.issueDate}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, issueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="expiryDate" className="text-sm font-medium mb-1 block">Expiry Date *</label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={certificationFormData.expiryDate}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, expiryDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="validityDays" className="text-sm font-medium mb-1 block">Validity Period (days)</label>
                    <Input
                      id="validityDays"
                      type="number"
                      placeholder="365"
                      value={certificationFormData.validityDays}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, validityDays: parseInt(e.target.value) || 365 })}
                    />
                  </div>
                  <div>
                    <label htmlFor="renewalReminder" className="text-sm font-medium mb-1 block">Renewal Reminder (days before)</label>
                    <Input
                      id="renewalReminder"
                      type="number"
                      placeholder="30"
                      value={certificationFormData.renewalReminderDays}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, renewalReminderDays: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                  <div>
                    <label htmlFor="owner" className="text-sm font-medium mb-1 block">Owner</label>
                    <Input
                      id="owner"
                      placeholder="e.g., John Doe"
                      value={certificationFormData.owner}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, owner: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="text-sm font-medium mb-1 block">Department</label>
                    <Input
                      id="department"
                      placeholder="e.g., IT Security"
                      value={certificationFormData.department}
                      onChange={(e) => setCertificationFormData({ ...certificationFormData, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-full">
                  <label htmlFor="description" className="text-sm font-medium mb-1 block">Description</label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Enter certification description"
                    value={certificationFormData.description}
                    onChange={(e) => setCertificationFormData({ ...certificationFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddCertificationModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCertification}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  );
}
