// User types
export type UserRole = 'SUPER_ADMIN' | 'COMPLIANCE_MANAGER' | 'AUDITOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  status: string;
  organizationId: string;
  createdAt: string;
  mfaEnabled?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface TwoFactorAuthResponse {
  requires2FA: boolean;
  tempToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mfaEnabled: boolean;
  };
}

export interface TwoFactorSetupResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

// Certification types
export type CertificationStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWAL_IN_PROGRESS' | 'SUSPENDED';

export interface Certification {
  id: string;
  name: string;
  certificateId: string;
  certificateType: string;
  issueDate: string;
  expiryDate: string;
  validityDays: number;
  issuingBody: string;
  owner?: string;
  department?: string;
  description?: string;
  status: CertificationStatus;
  logoUrl?: string;
  evidenceUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// Framework types
export interface Framework {
  id: string;
  name: string;
  description?: string;
  type: string;
}

export interface FrameworkAssociation {
  id: string;
  frameworkId: string;
  framework: Framework;
  organizationId: string;
  maturityLevel: number;
  compliancePercentage: number;
  owner?: string;
  reviewSchedule?: string;
}

// Upload types
export interface Upload {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'VIRUS_DETECTED';
  uploadedAt: string;
  recordsImported: number;
}

// Report types
export interface Report {
  id: string;
  name: string;
  reportType: 'EXPIRY_FORECAST' | 'COMPLIANCE_STATUS' | 'RENEWAL_TIMELINE' | 'AUDIT_READINESS' | 'FRAMEWORK_COVERAGE';
  data: any;
  generatedAt: string;
}

// Dashboard types
export interface DashboardMetrics {
  totalCertifications: number;
  activeCertifications: number;
  expiringCertifications: number;
  expiredCertifications: number;
  compliancePercentage: number;
  frameworkCoverage: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  statusCode: number;
}
