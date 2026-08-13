/** Customer-facing fulfillment labels. Internal values stay `pickup` / `delivery`. */

export function isPickupMethod(value?: string | null): boolean {
  return (value ?? '').toLowerCase() === 'pickup'
}

export function formatFulfillmentLabel(
  value?: string | null,
  labels?: { pickup?: string; delivery?: string },
): string {
  const method = (value ?? '').toLowerCase()
  if (method === 'pickup') return labels?.pickup || 'Self Pickup'
  if (method === 'delivery') return labels?.delivery || 'Delivery'
  return value?.trim() || ''
}
