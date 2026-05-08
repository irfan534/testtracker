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
import { Database, Search, Plus, Building2, Users, Calendar, Mail, Phone, Edit, Trash2, Eye, X, TrendingUp, Globe, Award, Target, Zap, ArrowRight, Activity, CheckCircle, AlertCircle } from 'lucide-react';

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
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    website: '',
    certificateName: '',
    region: '',
    selectedCertifications: [] as string[],
  });
  const [availableCertifications, setAvailableCertifications] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const [deletedCompanyInfo, setDeletedCompanyInfo] = useState<Company | null>(null);
  const [deletedCompanies, setDeletedCompanies] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchCompanies();
    fetchCertifications();
  }, []);

  const fetchCompanies = async () => {
    try {
      setFetchError(false);
      const response = await apiClient.get('/companies');
      setCompanies(response.data.companies || []);
    } catch (error: any) {
      console.error('Failed to fetch companies:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCertifications = async () => {
    try {
      const response = await apiClient.get('/certifications');
      setAvailableCertifications(response.data.certifications || []);
    } catch (error: any) {
      console.error('Failed to fetch certifications:', error);
    }
  };

  const handleAddCompany = async () => {
    console.log('handleAddCompany called', formData);

    if (!formData.name) {
      alert('Please enter a company name');
      return;
    }

    try {
      console.log('Sending JSON request');
      const response = await apiClient.post('/companies', {
        name: formData.name,
        industry: formData.industry,
        description: formData.description,
        website: formData.website,
        certificateName: formData.certificateName,
        region: formData.region,
        certificationIds: formData.selectedCertifications,
      });

      console.log('Company added successfully', response.data);

      setShowAddModal(false);
      setFormData({
        name: '',
        industry: '',
        description: '',
        website: '',
        certificateName: '',
        region: '',
        selectedCertifications: [],
      });
      fetchCompanies(); // Refresh the list
      alert('Company added successfully!');
    } catch (error: any) {
      console.error('Failed to add company:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Failed to add company: ${error.response.data.message || error.message}`);
      } else {
        alert(`Failed to add company: ${error.message}`);
      }
    }
  };

  const handleCompanyClick = async (company: Company) => {
    try {
      const response = await apiClient.get(`/companies/${company.id}`);
      setSelectedCompany(response.data);
      setShowCompanyDetail(true);
    } catch (error) {
      console.error('Failed to fetch company details:', error);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowEditModal(true);
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;
    
    try {
      const response = await apiClient.put(`/companies/${editingCompany.id}`, {
        name: editingCompany.name,
        industry: editingCompany.industry,
        description: editingCompany.description,
        website: editingCompany.website,
      });

      console.log('Company updated successfully:', response.data);
      setShowEditModal(false);
      setEditingCompany(null);
      fetchCompanies(); // Refresh the list
      alert('Company updated successfully!');
    } catch (error: any) {
      console.error('Failed to update company:', error);
      if (error.response) {
        alert(`Failed to update company: ${error.response.data.message || error.message}`);
      } else {
        alert(`Failed to update company: ${error.message}`);
      }
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
          <p className="text-gray-600 mb-6">Unable to fetch company data. Please try again.</p>
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
                        handleCompanyClick(company);
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

          {/* Add Company Modal */}
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company organization to track compliance data
                </DialogDescription>
              </DialogHeader>
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
                    <label htmlFor="certificateName" className="text-sm font-medium mb-1 block">Certificate Name</label>
                    <Input
                      id="certificateName"
                      placeholder="Enter certificate name"
                      value={formData.certificateName}
                      onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
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
                  <div>
                    <label className="text-sm font-medium mb-1 block">Select Certifications</label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                      {availableCertifications.length === 0 ? (
                        <p className="text-sm text-gray-500">No certifications available. Create certifications first.</p>
                      ) : (
                        availableCertifications.map((cert) => (
                          <label key={cert.id} className="flex items-center gap-2 py-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.selectedCertifications.includes(cert.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    selectedCertifications: [...formData.selectedCertifications, cert.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    selectedCertifications: formData.selectedCertifications.filter(id => id !== cert.id),
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{cert.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCompany}>
                  Add Company
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
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Company Details</DialogTitle>
                <DialogDescription>
                  View compliance status and manage certifications
                </DialogDescription>
              </DialogHeader>
              {selectedCompany && (
                <div className="space-y-6">
                  {/* Company Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{selectedCompany.name}</h3>
                        <p className="text-gray-600">{selectedCompany.industry}</p>
                      </div>
                    </div>
                    {selectedCompany.description && (
                      <p className="text-sm text-gray-600">{selectedCompany.description}</p>
                    )}
                    {selectedCompany.website && (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                        <Globe className="w-4 h-4 mr-1" />
                        {selectedCompany.website}
                      </a>
                    )}
                  </div>

                  {/* Compliance Status */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Compliance Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Active Certifications</p>
                        <p className="text-2xl font-bold text-green-900">{selectedCompany.certificationCount}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Users</p>
                        <p className="text-2xl font-bold text-blue-900">{selectedCompany.userCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Certifications List */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Certifications</h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // TODO: Implement add certification functionality
                          alert('Add certification functionality coming soon!');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Certification
                      </Button>
                    </div>
                    {selectedCompany.certifications && selectedCompany.certifications.length > 0 ? (
                      <div className="space-y-4">
                        {selectedCompany.certifications.map((cert: any) => {
                          const expiryDate = new Date(cert.expiryDate);
                          const today = new Date();
                          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                          const isExpired = daysUntilExpiry <= 0;

                          return (
                            <div key={cert.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-semibold text-gray-900">{cert.name}</h5>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isExpired ? 'text-red-600 bg-red-50' :
                                      isExpiringSoon ? 'text-yellow-600 bg-yellow-50' :
                                      getStatusColor(cert.status)
                                    }`}>
                                      {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : cert.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{cert.certificateType}</p>
                                  {cert.description && (
                                    <p className="text-sm text-gray-500 mb-3">{cert.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium text-gray-700">Certificate ID:</span>
                                    <span className="ml-2 text-gray-600">{cert.certificateId}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Issuing Body:</span>
                                    <span className="ml-2 text-gray-600">{cert.issuingBody}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Owner:</span>
                                    <span className="ml-2 text-gray-600">{cert.owner || 'Not assigned'}</span>
                                  </div>
                                  {cert.department && (
                                    <div>
                                      <span className="font-medium text-gray-700">Department:</span>
                                      <span className="ml-2 text-gray-600">{cert.department}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium text-gray-700">Issue Date:</span>
                                    <span className="ml-2 text-gray-600">{new Date(cert.issueDate).toLocaleDateString()}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Expiry Date:</span>
                                    <span className={`ml-2 ${isExpired ? 'text-red-600 font-semibold' : isExpiringSoon ? 'text-yellow-600 font-semibold' : 'text-gray-600'}`}>
                                      {expiryDate.toLocaleDateString()}
                                      {isExpired && ' (Expired)'}
                                      {isExpiringSoon && ` (${daysUntilExpiry} days)`}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Validity Period:</span>
                                    <span className="ml-2 text-gray-600">{cert.validityDays} days</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Renewal Reminder:</span>
                                    <span className="ml-2 text-gray-600">{cert.renewalReminderDays} days before</span>
                                  </div>
                                </div>
                              </div>

                              {cert.user && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <span className="font-medium text-gray-700 text-sm">Assigned to:</span>
                                  <span className="ml-2 text-sm text-gray-600">
                                    {cert.user.firstName} {cert.user.lastName} ({cert.user.email})
                                  </span>
                                </div>
                              )}

                              {cert.evidenceUrls && cert.evidenceUrls.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <span className="font-medium text-gray-700 text-sm">Evidence Documents:</span>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {cert.evidenceUrls.map((url: string, index: number) => (
                                      <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        Document {index + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No certifications assigned</p>
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
        </motion.div>
      </div>
    </div>
  );
}
