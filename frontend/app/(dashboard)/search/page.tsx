'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import Cookies from 'js-cookie';
import {
  Search,
  Building2,
  Award,
  Shield,
  ArrowLeft,
  Filter,
  X,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface SearchResult {
  type: 'company' | 'certification' | 'framework';
  id: string;
  name: string;
  description?: string;
  industry?: string;
  issuingBody?: string;
  status?: string;
  expiryDate?: string;
  createdAt?: string;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'companies' | 'certifications' | 'frameworks'>('all');

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Search all data concurrently to improve speed and reliability
      const [companiesResponse, certificationsResponse, frameworksResponse] = await Promise.all([
        apiClient.get('/companies'),
        apiClient.get('/certifications'),
        apiClient.get('/frameworks')
      ]);

      const companies = companiesResponse.data.companies || [];
      const certifications = certificationsResponse.data.certifications || [];
      const frameworks = frameworksResponse.data.frameworks || [];
      
      // Filter results based on search query
      const filteredCompanies = companies.filter((company: any) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const filteredCertifications = certifications.filter((cert: any) =>
        cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.issuingBody?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const filteredFrameworks = frameworks.filter((framework: any) =>
        framework.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        framework.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Combine all results
      const results: SearchResult[] = [
        ...filteredCompanies.map((company: any) => ({
          type: 'company' as const,
          id: company.id,
          name: company.name,
          description: company.description,
          industry: company.industry,
          status: company.status,
          createdAt: company.createdAt
        })),
        ...filteredCertifications.map((cert: any) => ({
          type: 'certification' as const,
          id: cert.id,
          name: cert.name,
          description: cert.description,
          issuingBody: cert.issuingBody,
          status: cert.status,
          expiryDate: cert.expiryDate
        })),
        ...filteredFrameworks.map((framework: any) => ({
          type: 'framework' as const,
          id: framework.id,
          name: framework.name,
          description: framework.description
        }))
      ];
      
      setSearchResults(results);
    } catch (error: any) {
      console.error('Search failed:', error);
      const message = error.response?.data?.message || error.message || 'Search failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = searchResults.filter(result => {
    if (activeFilter === 'all') return true;
    return result.type === activeFilter.slice(0, -1); // Remove 's' from plural
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company': return Building2;
      case 'certification': return Award;
      case 'framework': return Shield;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return 'text-blue-600 bg-blue-50';
      case 'certification': return 'text-green-600 bg-green-50';
      case 'framework': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '';
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'EXPIRING_SOON': return 'text-yellow-600 bg-yellow-50';
      case 'EXPIRED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'company':
        router.push(`/companies/${result.id}`);
        break;
      case 'certification':
        // Navigate to certifications page with filter
        router.push(`/certifications?cert=${result.id}`);
        break;
      case 'framework':
        // Navigate to frameworks page with filter
        router.push(`/frameworks?framework=${result.id}`);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Search Results</h1>
              <p className="text-gray-600">Showing results for "{query}"</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All ({searchResults.length})
            </Button>
            <Button
              variant={activeFilter === 'companies' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('companies')}
            >
              Companies ({searchResults.filter(r => r.type === 'company').length})
            </Button>
            <Button
              variant={activeFilter === 'certifications' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('certifications')}
            >
              Certifications ({searchResults.filter(r => r.type === 'certification').length})
            </Button>
            <Button
              variant={activeFilter === 'frameworks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('frameworks')}
            >
              Frameworks ({searchResults.filter(r => r.type === 'framework').length})
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-8 text-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => performSearch(query)}>Try Again</Button>
            </Card>
          )}

          {/* No Results */}
          {!loading && !error && filteredResults.length === 0 && (
            <Card className="p-8 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h2>
              <p className="text-gray-600">No results found for "{query}"</p>
            </Card>
          )}

          {/* Search Results */}
          {!loading && !error && filteredResults.length > 0 && (
            <div className="space-y-4">
              {filteredResults.map((result, index) => {
                const Icon = getTypeIcon(result.type);
                return (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <Card className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{result.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                              {result.type}
                            </span>
                            {result.status && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                                {result.status}
                              </span>
                            )}
                          </div>
                          
                          {result.description && (
                            <p className="text-gray-600 mb-2">{result.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {result.industry && (
                              <span>Industry: {result.industry}</span>
                            )}
                            {result.issuingBody && (
                              <span>Issuing Body: {result.issuingBody}</span>
                            )}
                            {result.expiryDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>Expires: {new Date(result.expiryDate).toLocaleDateString('en-GB')}</span>
                              </div>
                            )}
                            {result.createdAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Created: {new Date(result.createdAt).toLocaleDateString('en-GB')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      </Card>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
