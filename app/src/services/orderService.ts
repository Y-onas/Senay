import type { Order, OrderDraft } from '@/types'
import { USE_MOCK, apiRequest, mockResolve, makeReference } from './apiClient'

/** Orders API. `createOrder` is the single entry point used at checkout. */
export async function createOrder(draft: OrderDraft): Promise<Order> {
  if (USE_MOCK) {
    const order: Order = {
      ...draft,
      id: crypto.randomUUID(),
      reference: makeReference('ORD'),
      status: draft.payment === 'bank_transfer' ? 'awaiting_payment' : 'pending',
      paymentStatus:
        draft.payment === 'bank_transfer' ? 'pending_verification' : 'unpaid',
      createdAt: new Date().toISOString(),
    }
    return mockResolve(order, 600)
  }
  return apiRequest<Order>('/orders', { method: 'POST', json: draft })
}
