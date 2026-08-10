import { apiRequest, mockResolve, unwrapData, USE_MOCK } from './apiClient'
export interface CmsPageBlock {
  id: string
  key: string
  content: Record<string, unknown>
}

export interface CmsPage {
  id: string
  slug: string
  title: string
  description?: string | null
  blocks: CmsPageBlock[]
}

export interface ContactInput {
  name: string
  email: string
  phone?: string
  message: string
}

export async function getPage(slug: string): Promise<CmsPage | null> {
  if (USE_MOCK) return mockResolve(null)

  try {
    const res = await apiRequest<{ data: CmsPage }>(`/pages/${slug}`)
    return unwrapData(res)  } catch {
    return null
  }
}

/**
 * Submit contact form → saved as ContactMessage for admin inbox.
 */
export async function submitContact(input: ContactInput): Promise<void> {
  if (USE_MOCK) {
    await mockResolve({ ok: true }, 500)
    return
  }

  const candidates = ['/contact', '/contact/messages', '/contact-messages']
  let lastError: unknown = null

  for (const endpoint of candidates) {
    try {
      await apiRequest<unknown>(endpoint, {
        method: 'POST',
        json: input,
      })
      return
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error('Failed to send message')
}
