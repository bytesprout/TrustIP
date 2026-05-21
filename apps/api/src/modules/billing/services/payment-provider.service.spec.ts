import { PaymentProvider } from '@prisma/client';
import { PaymentProviderService } from './payment-provider.service';

describe('PaymentProviderService', () => {
  const service = new PaymentProviderService();

  it('returns provider adapter for Stripe', async () => {
    const adapter = service.getAdapter(PaymentProvider.STRIPE);
    const result = await adapter.createPayment({ tenantId: 't1', amount: 10, currency: 'USD' });
    expect(result.reference.startsWith('stripe-')).toBe(true);
  });

  it('defaults to manual adapter', async () => {
    const adapter = service.getAdapter(PaymentProvider.MANUAL);
    const result = await adapter.createPayment({ tenantId: 't1', amount: 10, currency: 'USD' });
    expect(result.status).toBe('SUCCESS');
  });
});
