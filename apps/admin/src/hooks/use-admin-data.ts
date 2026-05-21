'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';

export function useCurrentUser() {
  return useQuery({ queryKey: ['me'], queryFn: adminService.currentUser });
}

export function useSystemStats(enabled = true) {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: adminService.systemStats,
    enabled,
    refetchInterval: 30_000,
  });
}

export function useTenants() {
  return useQuery({ queryKey: ['tenants'], queryFn: adminService.tenants });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.createTenant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useTenantApiKeys(tenantId?: string) {
  return useQuery({
    queryKey: ['tenant-api-keys', tenantId],
    queryFn: () => adminService.tenantApiKeys(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useCreateTenantApiKey(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; expiresAt?: string; requestLimitPerMinute?: number }) =>
      adminService.createTenantApiKey(tenantId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys', tenantId] });
    },
  });
}

export function useRevokeTenantApiKey(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => adminService.revokeTenantApiKey(tenantId, keyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys', tenantId] });
    },
  });
}

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: adminService.plans });
}

export function useSubscriptions(tenantId?: string) {
  return useQuery({
    queryKey: ['subscriptions', tenantId],
    queryFn: () => adminService.subscriptions(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useInvoices(tenantId?: string) {
  return useQuery({
    queryKey: ['invoices', tenantId],
    queryFn: () => adminService.invoices(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useFeatureFlags() {
  return useQuery({ queryKey: ['feature-flags'], queryFn: adminService.featureFlags });
}

export function useDatasetHealth() {
  return useQuery({
    queryKey: ['dataset-health'],
    queryFn: adminService.datasetHealth,
    refetchInterval: 60_000,
  });
}

export function useAuditLogs(page = 1, limit = 20, action?: string) {
  return useQuery({
    queryKey: ['audit-logs', page, limit, action],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (action) {
        params.set('action', action);
      }
      return adminService.auditLogs(params);
    },
  });
}
