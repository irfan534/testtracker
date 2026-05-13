import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { User, Certification, AuthResponse, TwoFactorAuthResponse } from '@/types';

// Auth hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.post<AuthResponse | TwoFactorAuthResponse>('/auth/login', credentials),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      apiClient.post('/auth/register', data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

// 2FA Hooks
export const useSetup2FA = () => {
  return useMutation({
    mutationFn: () => apiClient.post('/auth/2fa/setup'),
  });
};

export const useVerify2FASetup = () => {
  return useMutation({
    mutationFn: (data: { code: string }) => apiClient.post('/auth/2fa/verify-setup', data),
  });
};

export const useVerify2FALogin = () => {
  return useMutation({
    mutationFn: (data: { code: string; tempToken: string; userId: string }) =>
      apiClient.post('/auth/2fa/verify', data),
  });
};

export const useDisable2FA = () => {
  return useMutation({
    mutationFn: (data: { code: string }) => apiClient.post('/auth/2fa/disable', data),
  });
};

export const useGet2FAStatus = () => {
  return useQuery({
    queryKey: ['2fa', 'status'],
    queryFn: () => apiClient.get('/auth/2fa/status').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRegenerateBackupCodes = () => {
  return useMutation({
    mutationFn: (data: { code: string }) => apiClient.post('/auth/2fa/regenerate-backup-codes', data),
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.get<User>('/auth/me').then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Certifications hooks
export const useCertifications = () => {
  return useQuery({
    queryKey: ['certifications'],
    queryFn: () => apiClient.get('/certifications').then((res) => res.data),
  });
};

export const useCertificationMetrics = () => {
  return useQuery({
    queryKey: ['certifications', 'metrics'],
    queryFn: () => apiClient.get('/certifications/metrics').then((res) => res.data),
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });
};

export const useCreateCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/certifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certifications', 'metrics'] });
    },
  });
};

// Frameworks hooks
export const useFrameworks = () => {
  return useQuery({
    queryKey: ['frameworks'],
    queryFn: () => apiClient.get('/frameworks').then((res) => res.data),
  });
};

export const useFrameworkMetrics = () => {
  return useQuery({
    queryKey: ['frameworks', 'metrics'],
    queryFn: () => apiClient.get('/frameworks/metrics').then((res) => res.data),
  });
};

// Reports hooks
export const useExpiryReport = (enabled = false) => {
  return useQuery({
    queryKey: ['reports', 'expiry'],
    queryFn: () => apiClient.get('/reports/expiry-forecast').then((res) => res.data),
    enabled,
    retry: 1,
  });
};

export const useComplianceReport = (enabled = false) => {
  return useQuery({
    queryKey: ['reports', 'compliance'],
    queryFn: () => apiClient.get('/reports/compliance-status').then((res) => res.data),
    enabled,
    retry: 1,
  });
};

// Uploads hooks
export const useUploads = () => {
  return useQuery({
    queryKey: ['uploads'],
    queryFn: () => apiClient.get('/uploads').then((res) => res.data),
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
};

// Companies hooks
export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => apiClient.get('/companies').then((res) => res.data),
  });
};

// Audit logs hooks
export const useAuditLogs = () => {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiClient.get('/audit-logs').then((res) => res.data),
  });
};
