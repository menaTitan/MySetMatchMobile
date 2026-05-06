import api from './client';

export interface PaymentRow {
  paymentId: string;
  tournamentId: string;
  tournamentName?: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Processing' | 'Succeeded' | 'Failed' | 'Canceled' | 'Refunded' | 'PartiallyRefunded';
  refundedAmount?: number;
  refundReason?: string;
  createdAt: string;
  completedAt?: string;
}

export const paymentApi = {
  createCheckout: (data: { tournamentId: string; successUrl?: string; cancelUrl?: string }) =>
    api.post<{ checkoutUrl: string }>('/payment/mobile/checkout', data),
  status: (paymentId: string) =>
    api.get<{ paymentId: string; status: string; amount: number; currency: string }>(
      `/payment/status/${paymentId}`,
    ),
  myPayments: () => api.get<PaymentRow[]>('/payment/mine'),
};
