const TOKEN_KEY = 'senay_admin_token'
const AUTH_FAILED_KEY = 'senay_auth_failed'
const API_CANDIDATES = ['/st-hq/api', '/api']

let authRedirectPending = false

export function markAuthFailed() {
  sessionStorage.setItem(AUTH_FAILED_KEY, '1')
}

export function clearAuthFailed() {
  sessionStorage.removeItem(AUTH_FAILED_KEY)
}

function redirectToLogin() {
  if (authRedirectPending) return
  authRedirectPending = true
  clearToken()
  markAuthFailed()
  window.location.replace('/st-hq/login.html')
}

function handleAuthFailure(path: string) {
  if (path === '/admin/auth/me') {
    clearToken()
    markAuthFailed()
    return
  }
  redirectToLogin()
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Match production admin: unwrap `{ data }` unless the payload includes pagination meta. */
function parseApiBody<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in json && !('meta' in json)) {
    return (json as { data: T }).data
  }
  return json as T
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isForm = false,
): Promise<T> {
  let lastError: Error | null = null
  let unauthorized = false

  for (const base of API_CANDIDATES) {
    try {
      const headers: Record<string, string> = {}
      const token = getToken()
      if (token) headers.Authorization = `Bearer ${token}`

      let payload: BodyInit | undefined
      if (body !== undefined) {
        if (isForm) {
          payload = body as BodyInit
        } else {
          headers['Content-Type'] = 'application/json'
          payload = JSON.stringify(body)
        }
      }

      const res = await fetch(`${base}${path}`, { method, headers, body: payload })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        lastError = new ApiError(res.status, json.error || `Request failed (${res.status})`, json)
        if (res.status === 401) unauthorized = true
        continue
      }

      if (res.status === 204) return undefined as T

      const json = await res.json().catch(() => ({}))
      return parseApiBody<T>(json)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error')
    }
  }

  if (unauthorized) handleAuthFailure(path)
  throw lastError || new Error('Unable to reach API')
}

export type AdminProfile = {
  id: string
  email: string
  name: string
  /** Role display name from `/admin/auth/me` (e.g. "Super Admin"). */
  role: string
  permissions: string[]
  status?: string
}

export type OverviewStats = {
  total: number
  newCount: number
  inProgress: number
  completed: number
  cancelled: number
  byService: Array<{ service: string; slug: string; count: number }>
  recent: Record<string, unknown>[]
}

export type Media = {
  id: string
  url: string
  originalName: string
  filename?: string
  mimeType: string
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | string
  sizeBytes?: number
  size?: number
  alt?: string | null
  caption?: string | null
  createdAt: string
}

export type HomeSection = {
  id: string
  key: string
  label: string
  order: number
  enabled: boolean
  content: Record<string, unknown>
  /** @deprecated use label */
  title?: string
  /** @deprecated use order */
  sortOrder?: number
}

export type NavigationItem = {
  id: string
  location: string
  label: string
  labelI18n?: Record<string, string> | null
  href: string
  order: number
  enabled: boolean
}

export type Service = {
  id: string
  slug: string
  name: string
  description?: string | null
  image?: string | null
  enabled: boolean
  sortOrder: number
  _count?: { catalogItems: number; requests: number }
}

export type CatalogItem = {
  id: string
  serviceId: string
  kind?: 'PRODUCT' | 'PACKAGE' | 'CONFIG'
  slug?: string
  name: string
  nameI18n?: Record<string, string> | null
  description?: string | null
  descriptionI18n?: Record<string, string> | null
  price: number | null
  unit?: string | null
  image?: string | null
  available: boolean
  sortOrder?: number
  metadata?: Record<string, unknown> | null
}

export type RequestItem = {
  id: string
  reference?: string
  status: string
  service?: { name: string; slug: string } | null
  serviceSlug?: string | null
  customerName?: string | null
  phone?: string | null
  customerPhone?: string | null
  source?: string | null
  createdAt: string
}

export const authApi = {
  me: () => request<AdminProfile>('GET', '/admin/auth/me'),
}

export const overviewApi = {
  get: () => request<OverviewStats>('GET', '/admin/overview'),
}

function normalizeMediaUploadResult(result: Media | Media[]): Media {
  const item = Array.isArray(result) ? result[0] : result
  if (!item?.url) throw new Error('Upload returned no file')
  return item
}

export const mediaApi = {
  list: async (q?: string) => {
    const result = await request<{ data: Media[]; meta?: { total: number } }>(
      'GET',
      `/admin/media${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    )
    return Array.isArray(result) ? result : result.data
  },
  upload: async (file: File) => {
    const form = new FormData()
    // Match production admin — server returns { data: Media[] }
    form.append('files', file)
    const result = await request<Media | Media[]>('POST', '/admin/media', form, true)
    return normalizeMediaUploadResult(result)
  },
  uploadFiles: async (files: File[]) => {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    const result = await request<Media | Media[]>('POST', '/admin/media', form, true)
    return Array.isArray(result) ? result : [result]
  },
  importPublic: () =>
    request<{ imported: number; updated: number; items?: Media[] }>('POST', '/admin/media/import-public'),
  update: (id: string, data: Partial<Pick<Media, 'alt' | 'caption'>>) =>
    request<Media>('PATCH', `/admin/media/${id}`, data),
  delete: (id: string) => request<void>('DELETE', `/admin/media/${id}`),
}

export type PageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type PageBlock = {
  id: string
  pageId: string
  type: string
  name?: string | null
  order: number
  content: Record<string, unknown>
  mediaId?: string | null
  media?: { id: string; url: string; alt?: string | null } | null
}

export type PageRecord = {
  id: string
  slug: string
  title: string
  titleI18n?: Record<string, string> | null
  description?: string | null
  descriptionI18n?: Record<string, string> | null
  status: PageStatus
  isHome: boolean
  coverMediaId?: string | null
  coverMedia?: { id: string; url: string; alt?: string | null } | null
  blocks?: PageBlock[]
  createdAt?: string
  updatedAt?: string
}

export const pagesApi = {
  list: (params?: { q?: string; status?: PageStatus }) => {
    const qs = new URLSearchParams()
    if (params?.q?.trim()) qs.set('q', params.q.trim())
    if (params?.status) qs.set('status', params.status)
    const query = qs.toString()
    return request<PageRecord[]>('GET', `/admin/content/pages${query ? `?${query}` : ''}`)
  },
  get: (id: string) => request<PageRecord>('GET', `/admin/content/pages/${id}`),
  create: (data: { slug: string; title: string; status?: PageStatus }) =>
    request<PageRecord>('POST', '/admin/content/pages', data),
  update: (id: string, data: Partial<PageRecord>) =>
    request<PageRecord>('PUT', `/admin/content/pages/${id}`, data),
  delete: (id: string) => request<{ id: string }>('DELETE', `/admin/content/pages/${id}`),
  listBlocks: (pageId: string) =>
    request<PageBlock[]>('GET', `/admin/content/pages/${pageId}/blocks`),
  createBlock: (
    pageId: string,
    data: { type: string; name?: string; order?: number; content?: Record<string, unknown>; mediaId?: string | null },
  ) => request<PageBlock>('POST', `/admin/content/pages/${pageId}/blocks`, data),
  updateBlock: (
    id: string,
    data: Partial<Pick<PageBlock, 'type' | 'name' | 'order' | 'content' | 'mediaId'>>,
  ) => request<PageBlock>('PUT', `/admin/content/blocks/${id}`, data),
  deleteBlock: (id: string) => request<{ id: string }>('DELETE', `/admin/content/blocks/${id}`),
}

export const contentApi = {
  homeSections: () => request<HomeSection[]>('GET', '/admin/content/home-sections'),
  updateHomeSection: (
    id: string,
    data: {
      label?: string
      order?: number
      enabled?: boolean
      content?: Record<string, unknown>
    },
  ) => request<HomeSection>('PUT', `/admin/content/home-sections/${id}`, data),
  navigation: () => request<NavigationItem[]>('GET', '/admin/content/navigation'),
  createNavigation: (data: Partial<NavigationItem>) =>
    request<NavigationItem>('POST', '/admin/content/navigation', data),
  updateNavigation: (id: string, data: Partial<NavigationItem>) =>
    request<NavigationItem>('PUT', `/admin/content/navigation/${id}`, data),
  deleteNavigation: (id: string) => request<void>('DELETE', `/admin/content/navigation/${id}`),
  footer: () => request<Record<string, unknown>[]>('GET', '/admin/content/footer'),
  updateFooter: (id: string, data: unknown) =>
    request('PUT', `/admin/content/footer/${id}`, data),
  announcements: () => request<Record<string, unknown>[]>('GET', '/admin/content/announcements'),
  createAnnouncement: (data: unknown) =>
    request('POST', '/admin/content/announcements', data),
  updateAnnouncement: (id: string, data: unknown) =>
    request('PUT', `/admin/content/announcements/${id}`, data),
  deleteAnnouncement: (id: string) => request<void>('DELETE', `/admin/content/announcements/${id}`),
  pages: () => pagesApi.list(),
  page: (id: string) => pagesApi.get(id),
  updatePage: (id: string, data: unknown) => pagesApi.update(id, data as Partial<PageRecord>),
}

export const menuApi = {
  categories: () => request<Record<string, unknown>[]>('GET', '/admin/menu/categories'),
  createCategory: (data: unknown) => request('POST', '/admin/menu/categories', data),
  updateCategory: (id: string, data: unknown) => request('PUT', `/admin/menu/categories/${id}`, data),
  deleteCategory: (id: string) => request<void>('DELETE', `/admin/menu/categories/${id}`),
  items: (categoryId?: string) =>
    request<Record<string, unknown>[]>(
      'GET',
      `/admin/menu/items${categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''}`,
    ),
  createItem: (data: unknown) => request('POST', '/admin/menu/items', data),
  updateItem: (id: string, data: unknown) => request('PUT', `/admin/menu/items/${id}`, data),
  deleteItem: (id: string) => request<void>('DELETE', `/admin/menu/items/${id}`),
}

export const servicesApi = {
  list: () => request<Service[]>('GET', '/admin/services'),
  get: (id: string) => request<Service & { catalogItems?: CatalogItem[] }>('GET', `/admin/services/${id}`),
  create: (data: Partial<Service>) => request<Service>('POST', '/admin/services', data),
  update: (id: string, data: Partial<Service>) => request<Service>('PATCH', `/admin/services/${id}`, data),
  delete: (id: string) => request<{ deleted: boolean }>('DELETE', `/admin/services/${id}`),
  reorder: (ids: string[]) => request('POST', '/admin/services/reorder', { orderedIds: ids }),
}

export const catalogApi = {
  list: (service?: string) =>
    request<CatalogItem[]>('GET', `/admin/catalog${service ? `?service=${encodeURIComponent(service)}` : ''}`),
  create: (data: Partial<CatalogItem>) => request<CatalogItem>('POST', '/admin/catalog', data),
  update: (id: string, data: Partial<CatalogItem>) => request<CatalogItem>('PATCH', `/admin/catalog/${id}`, data),
  delete: (id: string) => request<void>('DELETE', `/admin/catalog/${id}`),
}

export const requestsApi = {
  list: (params?: { q?: string; status?: string; service?: string }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.status) qs.set('status', params.status)
    if (params?.service) qs.set('service', params.service)
    const query = qs.toString()
    return request<RequestItem[]>('GET', `/admin/requests${query ? `?${query}` : ''}`)
  },
  get: (id: string) => request<Record<string, unknown>>('GET', `/admin/requests/${id}`),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    request('PATCH', `/admin/requests/${id}/status`, data),
  updateFollowUp: (id: string, data: { followUpStatus: string; followUpNote?: string }) =>
    request('PATCH', `/admin/requests/${id}/follow-up`, data),
}

export const settingsApi = {
  all: () => request<Record<string, unknown>>('GET', '/admin/settings'),
  get: (key: string) => request<unknown>('GET', `/admin/settings/${key}`),
  put: (key: string, value: unknown) => request('PUT', `/admin/settings/${key}`, { value }),
  update: (key: string, value: unknown) => request('PUT', `/admin/settings/${key}`, { value }),
}

export type SeoSetting = {
  key: string
  value: Record<string, unknown>
}

export const seoApi = {
  list: () => request<SeoSetting[]>('GET', '/admin/content/seo'),
  update: (key: string, value: Record<string, unknown>) =>
    request('PUT', `/admin/content/seo/${key}`, { value }),
}

export const adminsApi = {
  list: () => request<Record<string, unknown>[]>('GET', '/admin/admins'),
  create: (data: unknown) => request('POST', '/admin/admins', data),
  update: (id: string, data: unknown) => request('PATCH', `/admin/admins/${id}`, data),
  delete: (id: string) => request<void>('DELETE', `/admin/admins/${id}`),
  roles: () => request<Record<string, unknown>[]>('GET', '/admin/roles?invite=1'),
}

export const contentModuleApi = {
  faqs: () => request<Record<string, unknown>[]>('GET', '/admin/faqs'),
  createFaq: (data: unknown) => request('POST', '/admin/faqs', data),
  updateFaq: (id: string, data: unknown) => request('PATCH', `/admin/faqs/${id}`, data),
  deleteFaq: (id: string) => request<void>('DELETE', `/admin/faqs/${id}`),
  testimonials: () => request<Record<string, unknown>[]>('GET', '/admin/testimonials'),
  createTestimonial: (data: unknown) => request('POST', '/admin/testimonials', data),
  updateTestimonial: (id: string, data: unknown) => request('PATCH', `/admin/testimonials/${id}`, data),
  deleteTestimonial: (id: string) => request<void>('DELETE', `/admin/testimonials/${id}`),
  blog: () => request<Record<string, unknown>[]>('GET', '/admin/blog'),
  createBlog: (data: unknown) => request('POST', '/admin/blog', data),
  updateBlog: (id: string, data: unknown) => request('PATCH', `/admin/blog/${id}`, data),
  deleteBlog: (id: string) => request<void>('DELETE', `/admin/blog/${id}`),
}

export const contactApi = {
  messages: () => request<Record<string, unknown>[]>('GET', '/contact/admin/messages'),
  markRead: (id: string, read = true) =>
    request('PATCH', `/contact/admin/messages/${id}/read`, { read }),
  delete: (id: string) => request<void>('DELETE', `/contact/admin/messages/${id}`),
}

export type TelegramSettings = {
  enabled: boolean
  webAppBaseUrl?: string
  notificationsEnabled: boolean
  notifyOnNewRequest: boolean
  defaultLanguage: 'en' | 'am'
  supportedLanguages: Array<'en' | 'am'>
}

export type BotMenuItem = {
  id: string
  key: string
  parentKey: string | null
  label: string
  labelI18n?: Record<string, string> | null
  action: string
  actionData?: string | null
  icon?: string | null
  enabled: boolean
  sortOrder: number
}

export type BotMessageItem = {
  key: string
  text: string
  textI18n?: Record<string, string> | null
}

export type BotServiceItem = {
  id: string
  slug: string
  name: string
  nameI18n?: Record<string, string> | null
  description?: string | null
  descriptionI18n?: Record<string, string> | null
  sortOrder: number
}

export type BotHealth = {
  status?: string
  botUsername?: string | null
  tokenValid?: boolean
  processOnline?: boolean
  mode?: string
  enabled?: boolean
  tokenConfigured?: boolean
  configuredWebhookUrl?: string | null
  webAppBaseUrl?: string | null
  env?: {
    botTokenPreview?: string
    webhookUrl?: string
    websiteBaseUrl?: string
    adminIds?: string[]
    botMode?: string
  }
}

export type BotStats = {
  totalUsers: number
  newUsersToday: number
  activeUsersLast7Days: number
  telegramRequests: number
}

export type TelegramUserListItem = {
  id: string
  telegramId: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  languageCode?: string
  firstSeenAt: string
  lastInteractAt: string
  status?: string
  isBlocked?: boolean
  _count?: { requests: number }
}

export type TelegramUserDetail = TelegramUserListItem & {
  requests?: Array<{
    id: string
    reference: string
    status: string
    createdAt: string
    service?: { name: string; slug: string }
  }>
}

export type BotAdminNotify = {
  id: string
  name: string
  telegramChatId?: string | null
}

export type PaginatedResult<T> = {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

async function requestPaginated<T>(path: string): Promise<PaginatedResult<T>> {
  let lastError: Error | null = null
  let unauthorized = false

  for (const base of API_CANDIDATES) {
    try {
      const headers: Record<string, string> = {}
      const token = getToken()
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${base}${path}`, { method: 'GET', headers })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        lastError = new ApiError(res.status, json.error || `Request failed (${res.status})`, json)
        if (res.status === 401) unauthorized = true
        continue
      }

      const data = Array.isArray(json.data) ? json.data : []
      const pagination = json.pagination ?? {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      }
      return { data: data as T[], pagination }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error')
    }
  }

  if (unauthorized) handleAuthFailure(path)
  throw lastError || new Error('Unable to reach API')
}

export const botApi = {
  menus: () => request<BotMenuItem[]>('GET', '/admin/bot/menus'),
  createMenu: (data: unknown) => request('POST', '/admin/bot/menus', data),
  updateMenu: (id: string, data: unknown) => request('PATCH', `/admin/bot/menus/${id}`, data),
  patchMenu: (id: string, data: unknown) => request('PATCH', `/admin/bot/menus/${id}`, data),
  deleteMenu: (id: string) => request<void>('DELETE', `/admin/bot/menus/${id}`),
  reorderMenus: (ids: string[]) => request('POST', '/admin/bot/menus/reorder', { ids }),
  messages: () => request<BotMessageItem[]>('GET', '/admin/bot/messages'),
  updateMessage: (key: string, data: unknown) => request('PUT', `/admin/bot/messages/${key}`, data),
  putMessage: (key: string, data: unknown) => request('PUT', `/admin/bot/messages/${key}`, data),
  services: () => request<BotServiceItem[]>('GET', '/admin/bot/services'),
  patchService: (id: string, data: unknown) => request('PATCH', `/admin/bot/services/${id}`, data),
  users: (params?: { page?: number; search?: string; status?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.search?.trim()) qs.set('search', params.search.trim())
    if (params?.status) qs.set('status', params.status)
    if (params?.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    return requestPaginated<TelegramUserListItem>(`/admin/bot/users${query ? `?${query}` : ''}`)
  },
  user: (id: string) => request<TelegramUserDetail>('GET', `/admin/bot/users/${id}`),
  updateUser: (id: string, data: unknown) =>
    request<TelegramUserDetail>('PATCH', `/admin/bot/users/${id}`, data),
  patchUser: (id: string, data: unknown) =>
    request<TelegramUserDetail>('PATCH', `/admin/bot/users/${id}`, data),
  stats: () => request<BotStats>('GET', '/admin/bot/stats'),
  health: () => request<BotHealth>('GET', '/admin/bot/health'),
  admins: () => request<BotAdminNotify[]>('GET', '/admin/admins'),
}
