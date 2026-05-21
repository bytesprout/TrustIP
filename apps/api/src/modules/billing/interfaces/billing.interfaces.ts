export interface SubscriptionAccessResult {
  allowed: boolean;
  status: string;
  gracePeriodEndsAt?: Date | null;
  message?: string;
}

export interface PaymentProviderAdapter {
  createPayment(params: {
    tenantId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ reference: string; status: 'PENDING' | 'SUCCESS' | 'FAILED' }>;
}
