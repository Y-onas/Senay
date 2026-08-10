import { apiRequest, USE_MOCK, mockResolve, makeReference, unwrapData } from './apiClient'

export type ServiceSlug =
  | 'catering'
  | 'baltina'
  | 'agelgil'
  | 'drinks'
  | 'festival'

export interface SubmitServiceRequestInput {
  serviceSlug: ServiceSlug
  customerName: string
  phone: string
  email?: string
  telegram?: string
  deliveryMethod?: 'PICKUP' | 'DELIVERY'
  location?: string
  preferredDate?: string
  preferredTime?: string
  notes?: string
  guests?: number
  packageSummary?: string
  totalAmount?: number
  payload: Record<string, unknown>
}

export interface SubmittedRequest {
  id: string
  reference: string
  status: string
  createdAt: string
}

type TelegramWebAppWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string
    }
  }
}

/** Single intake for website and Telegram WebApps. */
export async function submitServiceRequest(
  input: SubmitServiceRequestInput,
): Promise<SubmittedRequest> {
  if (USE_MOCK) {
    const prefixes: Record<ServiceSlug, string> = {
      catering: 'CAT',
      baltina: 'BAL',
      agelgil: 'AGL',
      drinks: 'DRK',
      festival: 'FST',
    }
    return mockResolve(
      {
        id: crypto.randomUUID(),
        reference: makeReference(prefixes[input.serviceSlug]),
        status: 'NEW',
        createdAt: new Date().toISOString(),
      },
      600,
    )
  }

  const initData =
    typeof window === 'undefined'
      ? ''
      : (window as TelegramWebAppWindow).Telegram?.WebApp?.initData?.trim() ?? ''

  const res = await apiRequest<{ data: SubmittedRequest }>('/requests', {
    method: 'POST',
    json: {
      ...input,
      source: initData ? 'TELEGRAM' : 'WEBSITE',
      ...(initData ? { telegramInitData: initData } : {}),
    },
  })
  return unwrapData(res)
}

export function toApiDelivery(
  method: 'pickup' | 'delivery',
): 'PICKUP' | 'DELIVERY' {
  return method === 'pickup' ? 'PICKUP' : 'DELIVERY'
}
