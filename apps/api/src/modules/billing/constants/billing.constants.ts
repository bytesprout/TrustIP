export const BILLING_MODE = {
  MANUAL: 'MANUAL',
  SUBSCRIPTION: 'SUBSCRIPTION',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  TRIAL: 'TRIAL',
  EXPIRED: 'EXPIRED',
  GRACE_PERIOD: 'GRACE_PERIOD',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
} as const;

export const BILLING_CYCLE = {
  MONTHLY: 'MONTHLY',
  ANNUAL: 'ANNUAL',
  MANUAL: 'MANUAL',
} as const;

export const INVOICE_STATUS = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  VOID: 'VOID',
} as const;

export const PLAN_STATUS = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const DEFAULT_TRIAL_DAYS = 7;
export const DEFAULT_GRACE_DAYS = 7;

export const BILLING_SYSTEM_CONFIG_KEYS = {
  BILLING_MODE: 'billing_mode',
  TRIAL_DAYS: 'billing_trial_days',
  GRACE_DAYS: 'billing_grace_days',
} as const;
