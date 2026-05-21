import { apiClient, type AuthUser } from '@/lib/api-client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  planType: string;
  isEnterprise: boolean;
  createdAt: string;
}

export interface TenantApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  items: Array<{
    id: string;
    tenantId: string;
    userId: string | null;
    action: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    user?: { id: string; email: string } | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  priceMonthly: string;
  priceYearly: string;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  dueDate: string;
  issuedAt: string;
}

export interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentPeriodEnd: string | null;
  plan: Plan;
}

export interface DashboardStats {
  users: number;
  tenants: number;
  activeApiKeys: number;
  timestamp: string;
}

export interface FeatureFlag {
  key: string;
  value: boolean;
  tenantId: string | null;
  updatedAt: string;
}

export interface DatasetHealth {
  datasets: Array<{
    key: string;
    stale: boolean;
    source: string;
    lastUpdatedAt: string | null;
    lastSuccessfulDownloadAt: string | null;
    recordCount: number | null;
  }>;
  generatedAt: string;
}

export const adminService = {
  currentUser: (): Promise<AuthUser> => apiClient<AuthUser>('/api/v1/auth/me'),
  systemStats: (): Promise<DashboardStats> => apiClient<DashboardStats>('/api/v1/system/stats'),
  tenants: (): Promise<Tenant[]> => apiClient<Tenant[]>('/api/v1/tenants'),
  createTenant: (payload: { name: string; slug: string; planType?: string }): Promise<Tenant> =>
    apiClient<Tenant>('/api/v1/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  tenantApiKeys: (tenantId: string): Promise<TenantApiKey[]> =>
    apiClient<TenantApiKey[]>(`/api/v1/tenants/${tenantId}/api-keys`),
  createTenantApiKey: (
    tenantId: string,
    payload: { name: string; expiresAt?: string; requestLimitPerMinute?: number },
  ): Promise<{ key: string; keyData: TenantApiKey }> =>
    apiClient<{ key: string; keyData: TenantApiKey }>(`/api/v1/tenants/${tenantId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  revokeTenantApiKey: (tenantId: string, keyId: string): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(`/api/v1/tenants/${tenantId}/api-keys/${keyId}`, {
      method: 'DELETE',
    }),
  plans: (): Promise<Plan[]> => apiClient<Plan[]>('/api/v1/billing/plans'),
  subscriptions: (tenantId: string): Promise<Subscription[]> =>
    apiClient<Subscription[]>(`/api/v1/billing/subscriptions/${tenantId}`),
  invoices: (tenantId: string): Promise<Invoice[]> =>
    apiClient<Invoice[]>(`/api/v1/billing/invoices/${tenantId}`),
  featureFlags: (): Promise<FeatureFlag[]> => apiClient<FeatureFlag[]>('/api/v1/feature-flags'),
  datasetHealth: (): Promise<DatasetHealth> => apiClient<DatasetHealth>('/internal/dataset/health'),
  auditLogs: (params: URLSearchParams): Promise<PaginatedAuditLogs> =>
    apiClient<PaginatedAuditLogs>(`/api/v1/audit-logs?${params.toString()}`),
};
