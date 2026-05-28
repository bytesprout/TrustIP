import { apiClient, type AuthUser } from '@/lib/api-client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  mode: string;
  isActive: boolean;
  analyticsEnabled: boolean;
  analyticsRetentionDays: number | null;
  rateLimitEnabled: boolean;
  quotaEnabled: boolean;
  monthlyRequestLimit: number | null;
  rateLimitPerMinute: number;
  createdAt: string;
}

export interface TenantApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  status?: string;
  scopes?: string[];
  requestLimit?: number | null;
  expiresAt: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface CreatedTenantApiKey {
  id: string;
  prefix: string;
  plainKey: string;
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
  slug: string;
  monthlyPrice: string;
  annualPrice: string;
  currency: string;
  requestLimitMonthly: number | null;
  requestsPerMinute: number;
  analyticsRetentionDays: number | null;
  features: Record<string, unknown>;
  status: string;
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
}

export interface DatasetHealth {
  status: string;
  latencyMs: number;
  message?: string;
}

export const adminService = {
  currentUser: (): Promise<AuthUser> => apiClient<AuthUser>('/api/v1/auth/me'),
  systemStats: (): Promise<DashboardStats> => apiClient<DashboardStats>('/api/v1/system/stats'),
  tenants: (): Promise<Tenant[]> => apiClient<Tenant[]>('/api/v1/tenants'),
  createTenant: (payload: { name: string; companyName?: string }): Promise<Tenant> =>
    apiClient<Tenant>('/api/v1/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  tenantApiKeys: (tenantId: string): Promise<TenantApiKey[]> =>
    apiClient<TenantApiKey[]>(`/api/v1/tenants/${tenantId}/api-keys`),
  createTenantApiKey: (
    tenantId: string,
    payload: { name: string; scopes: string[]; expiresAt?: string; requestLimit?: number },
  ): Promise<CreatedTenantApiKey> =>
    apiClient<CreatedTenantApiKey>(`/api/v1/tenants/${tenantId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  revokeTenantApiKey: (tenantId: string, keyId: string): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(`/api/v1/tenants/${tenantId}/api-keys/${keyId}`, {
      method: 'DELETE',
    }),
  plans: (): Promise<Plan[]> => apiClient<Plan[]>('/api/v1/billing/plans'),
  allPlans: (): Promise<Plan[]> => apiClient<Plan[]>('/api/v1/billing/plans/all'),
  createPlan: (payload: {
    name: string;
    slug: string;
    monthlyPrice: number;
    annualPrice: number;
    currency: string;
    requestLimitMonthly?: number;
    requestsPerMinute: number;
    analyticsRetentionDays?: number;
    features: Record<string, unknown>;
  }): Promise<Plan> =>
    apiClient<Plan>('/api/v1/billing/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  subscriptions: (tenantId: string): Promise<Subscription[]> =>
    apiClient<Subscription[]>(`/api/v1/billing/subscriptions/${tenantId}`),
  invoices: (tenantId: string): Promise<Invoice[]> =>
    apiClient<Invoice[]>(`/api/v1/billing/invoices/${tenantId}`),
  featureFlags: (): Promise<FeatureFlag[]> => apiClient<FeatureFlag[]>('/api/v1/feature-flags'),
  updateFeatureFlag: (key: string, value: boolean): Promise<FeatureFlag> =>
    apiClient<FeatureFlag>(`/api/v1/feature-flags/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
  updateTenant: (
    tenantId: string,
    payload: {
      analyticsEnabled?: boolean;
      quotaEnabled?: boolean;
      rateLimitEnabled?: boolean;
      monthlyRequestLimit?: number;
      analyticsRetentionDays?: number;
    },
  ): Promise<Tenant> =>
    apiClient<Tenant>(`/api/v1/tenants/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  datasetHealth: (): Promise<DatasetHealth> => apiClient<DatasetHealth>('/api/v1/health/datasets'),
  auditLogs: (params: URLSearchParams): Promise<PaginatedAuditLogs> =>
    apiClient<PaginatedAuditLogs>(`/api/v1/audit-logs?${params.toString()}`),
};
