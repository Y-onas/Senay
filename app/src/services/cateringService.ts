import type {
  CateringPackage,
  CateringRequest,
  CateringRequestDraft,
} from '@/types'
import { cateringPackages } from '@/data/cateringPackages'
import { USE_MOCK, apiRequest, mockResolve, makeReference } from './apiClient'
import { submitServiceRequest, toApiDelivery } from './requestService'
import { getCateringPackagesFromApi } from './catalogApi'

export async function getCateringPackages(): Promise<CateringPackage[]> {
  if (USE_MOCK) return mockResolve(cateringPackages)
  try {
    const pkgs = await getCateringPackagesFromApi()
    return pkgs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      guestRange: [40, 200] as [number, number],
      pricePerGuest: p.fixedPricePerGuest ?? p.beveragePricing?.['food-only'] ?? 0,
      highlights: p.dishes.slice(0, 4),
      image: p.image,
      popular: p.tier === 'gold',
    }))
  } catch {
    return apiRequest<CateringPackage[]>('/catering/packages').catch(
      () => cateringPackages,
    )
  }
}

export async function submitCateringRequest(
  draft: CateringRequestDraft,
): Promise<CateringRequest> {
  if (USE_MOCK) {
    const request: CateringRequest = {
      ...draft,
      id: crypto.randomUUID(),
      reference: makeReference('CAT'),
      status: 'received',
      createdAt: new Date().toISOString(),
    }
    return mockResolve(request, 700)
  }

  const created = await submitServiceRequest({
    serviceSlug: 'catering',
    customerName: draft.contact.name,
    phone: draft.contact.phone,
    email: draft.contact.email,
    deliveryMethod: toApiDelivery(draft.deliveryMethod),
    location: draft.location,
    preferredDate: draft.date,
    preferredTime: draft.time,
    notes: draft.specialInstructions,
    guests: draft.guests,
    packageSummary: `${draft.packageId}${draft.beverageOption ? ` · ${draft.beverageOption}` : ''}`,
    totalAmount: draft.totalPrice,
    payload: { ...draft },
  })

  return {
    ...draft,
    id: created.id,
    reference: created.reference,
    status: 'received',
    createdAt: created.createdAt,
  }
}
