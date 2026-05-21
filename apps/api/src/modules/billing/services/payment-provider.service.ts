import { Injectable } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import type { PaymentProviderAdapter } from '../interfaces/billing.interfaces';

class ManualAdapter implements PaymentProviderAdapter {
  async createPayment(): Promise<{ reference: string; status: 'PENDING' | 'SUCCESS' | 'FAILED' }> {
    return { reference: `manual-${String(Date.now())}`, status: 'SUCCESS' };
  }
}

class StripeAdapter implements PaymentProviderAdapter {
  async createPayment(): Promise<{ reference: string; status: 'PENDING' | 'SUCCESS' | 'FAILED' }> {
    return { reference: `stripe-${String(Date.now())}`, status: 'PENDING' };
  }
}

class RazorpayAdapter implements PaymentProviderAdapter {
  async createPayment(): Promise<{ reference: string; status: 'PENDING' | 'SUCCESS' | 'FAILED' }> {
    return { reference: `razorpay-${String(Date.now())}`, status: 'PENDING' };
  }
}

class PaypalAdapter implements PaymentProviderAdapter {
  async createPayment(): Promise<{ reference: string; status: 'PENDING' | 'SUCCESS' | 'FAILED' }> {
    return { reference: `paypal-${String(Date.now())}`, status: 'PENDING' };
  }
}

@Injectable()
export class PaymentProviderService {
  getAdapter(provider: PaymentProvider): PaymentProviderAdapter {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return new StripeAdapter();
      case PaymentProvider.RAZORPAY:
        return new RazorpayAdapter();
      case PaymentProvider.PAYPAL:
        return new PaypalAdapter();
      default:
        return new ManualAdapter();
    }
  }
}
