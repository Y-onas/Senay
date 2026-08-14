import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  cmsApi,
  type CmsBotHealth,
  type CmsBotMenu,
  type CmsBotMessage,
  type CmsBotStats,
} from '@/services/cmsApi'
import { CMS_BASE } from '@/config/cms'
import { Field, inputClass } from './pages/shared'
import { Hint, SectionPanel, StickySaveBar } from './pages/cms-ui'

type TelegramSettings = {
  enabled: boolean
  botToken: string
  webhookUrl: string
  webAppBaseUrl: string
  websiteBaseUrl: string
  notificationsEnabled: boolean
  notifyOnNewRequest: boolean
  defaultLanguage: 'en' | 'am'
  supportedLanguages: Array<'en' | 'am'>
  integrationNotes?: string
}

const BOT_ACTIONS: CmsBotMenu['action'][] = [
  'submenu',
  'services',
  'webapp',
  'faq',
  'contact',
  'about',
  'location',
  'callback',
]

function localizedValue(
  values: Partial<Record<string, string>> | undefined,
  fallback: string,
  language: 'en' | 'am',
) {
  return values?.[language] ?? (language === 'en' ? fallback : '')
}

const DEFAULT: TelegramSettings = {
  enabled: true,
  botToken: '',
  webhookUrl: '',
  webAppBaseUrl: '',
  websiteBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  notificationsEnabled: true,
  notifyOnNewRequest: true,
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'am'],
  integrationNotes: '',
}

function statusColor(status: CmsBotHealth['status']) {
  if (status === 'online') return 'bg-green-100 text-green-800'
  if (status === 'degraded') return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

export default function CmsTelegramPage() {
  const [saved, setSaved] = useState<TelegramSettings>(DEFAULT)
  const [draft, setDraft] = useState<TelegramSettings>(DEFAULT)
  const [admins, setAdmins] = useState<Array<Record<string, unknown>>>([])
  const [botMenus, setBotMenus] = useState<CmsBotMenu[]>([])
  const [botMessages, setBotMessages] = useState<CmsBotMessage[]>([])
  const [health, setHealth] = useState<CmsBotHealth | null>(null)
  const [stats, setStats] = useState<CmsBotStats | null>(null)
  const [botSaving, setBotSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const rootMenus = useMemo(
    () => botMenus.filter((item) => !item.parentKey).sort((a, b) => a.sortOrder - b.sortOrder),
    [botMenus],
  )

  const loadDashboard = () =>
    Promise.all([
      cmsApi.settings(),
      cmsApi.admins(),
      cmsApi.botMenus(),
      cmsApi.botMessages(),
      cmsApi.botHealth(),
      cmsApi.botStats(),
    ]).then(([settings, team, menus, messages, healthData, statsData]) => {
      const raw = settings.telegram as TelegramSettings | undefined
      const merged: TelegramSettings = {
        ...DEFAULT,
        ...(raw ?? {}),
        defaultLanguage: raw?.defaultLanguage === 'am' ? 'am' : 'en',
        supportedLanguages: Array.isArray(raw?.supportedLanguages)
          ? raw.supportedLanguages.filter((lang): lang is 'en' | 'am' => lang === 'en' || lang === 'am')
          : DEFAULT.supportedLanguages,
      }
      setSaved(merged)
      setDraft(merged)
      setAdmins(team as Array<Record<string, unknown>>)
      setBotMenus(menus)
      setBotMessages(messages)
      setHealth(healthData)
      setStats(statsData)
    })

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await cmsApi.putSetting('telegram', draft)
      setSaved(draft)
      setMsg('Telegram settings saved')
      const healthData = await cmsApi.botHealth()
      setHealth(healthData)
      setTimeout(() => setMsg(''), 4000)
    } finally {
      setSaving(false)
    }
  }

  const updateMenu = (id: string, update: Partial<CmsBotMenu>) => {
    setBotMenus((items) => items.map((item) => (item.id === id ? { ...item, ...update } : item)))
  }

  const updateMenuLabel = (id: string, language: 'en' | 'am', value: string) => {
    setBotMenus((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              label: language === 'en' ? value : item.label,
              labelI18n: { ...item.labelI18n, [language]: value },
            }
          : item,
      ),
    )
  }

  const saveMenu = async (item: CmsBotMenu) => {
    setBotSaving(true)
    try {
      await cmsApi.patchBotMenu(item.id, {
        parentKey: item.parentKey || null,
        label: item.label,
        labelI18n: item.labelI18n,
        action: item.action,
        actionData: item.actionData || null,
        icon: item.icon || null,
        enabled: item.enabled,
        sortOrder: Number(item.sortOrder),
      })
      setMsg(`Saved ${item.label}`)
    } finally {
      setBotSaving(false)
    }
  }

  const reorderRootMenu = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= rootMenus.length) return
    const reordered = [...rootMenus]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, moved)
    const otherMenus = botMenus.filter((item) => item.parentKey)
    const nextMenus = [...reordered, ...otherMenus]
    setBotMenus(nextMenus)
    await cmsApi.reorderBotMenus(reordered.map((item) => item.id))
  }

  const addMenu = async () => {
    setBotSaving(true)
    try {
      const key = `menu_${Date.now().toString().slice(-8)}`
      const created = await cmsApi.createBotMenu({
        key,
        parentKey: null,
        label: 'New menu item',
        labelI18n: { en: 'New menu item', am: '' },
        action: 'submenu',
        actionData: null,
        icon: null,
        enabled: true,
        sortOrder: Math.max(0, ...botMenus.map((item) => item.sortOrder)) + 1,
      })
      setBotMenus((items) => [...items, created])
      setMsg('New bot menu item added.')
    } finally {
      setBotSaving(false)
    }
  }

  const removeMenu = async (id: string) => {
    setBotSaving(true)
    try {
      await cmsApi.deleteBotMenu(id)
      setBotMenus((items) => items.filter((item) => item.id !== id))
      setMsg('Bot menu item deleted')
    } finally {
      setBotSaving(false)
    }
  }

  const updateMessage = (key: string, language: 'en' | 'am', value: string) => {
    setBotMessages((items) =>
      items.map((item) =>
        item.key === key
          ? {
              ...item,
              text: language === 'en' ? value : item.text,
              textI18n: { ...item.textI18n, [language]: value },
            }
          : item,
      ),
    )
  }

  const saveMessage = async (item: CmsBotMessage) => {
    setBotSaving(true)
    try {
      await cmsApi.putBotMessage(item.key, { text: item.text, textI18n: item.textI18n })
      setMsg(`Saved ${item.key}`)
    } finally {
      setBotSaving(false)
    }
  }

  const toggleSupportedLanguage = (lang: 'en' | 'am') => {
    setDraft((current) => {
      const has = current.supportedLanguages.includes(lang)
      const supportedLanguages = has
        ? current.supportedLanguages.filter((entry) => entry !== lang)
        : [...current.supportedLanguages, lang]
      return {
        ...current,
        supportedLanguages: supportedLanguages.length ? supportedLanguages : [lang],
      }
    })
  }

  if (loading) return <p className="text-gray-500">Loading Telegram settings…</p>

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-burgundy/60">Integration</p>
          <h1 className="font-display text-3xl uppercase">Telegram Bot</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Control center for the bot — connection, menus, messages, notifications, and analytics.
            The bot reads everything from the backend; no code changes needed.
          </p>
        </div>
        <Link to={`${CMS_BASE}/telegram/users`} className="text-sm font-medium text-burgundy">
          Telegram users →
        </Link>
      </div>

      {health ? (
        <div className="rounded-2xl border border-burgundy/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Bot status</p>
              <p className="mt-1 font-display text-2xl uppercase">
                {health.botUsername ? `@${health.botUsername}` : 'Not connected'}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusColor(health.status)}`}>
              {health.status}
            </span>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p>Enabled: {health.enabled ? 'Yes' : 'No'}</p>
            <p>Token valid: {health.tokenValid ? 'Yes' : 'No'}</p>
            <p>Process online: {health.processOnline ? 'Yes' : 'No'}</p>
            <p>Mode: {health.mode}</p>
            <p>Webhook: {String(health.webhook?.url ?? 'Not set')}</p>
            <p>Last heartbeat: {health.lastHeartbeat ? new Date(health.lastHeartbeat).toLocaleString() : '—'}</p>
            <p>WebApp URL: {health.webAppBaseUrl ?? '—'}</p>
            {health.apiError ? <p className="text-red-600 sm:col-span-2">{health.apiError}</p> : null}
          </div>
        </div>
      ) : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: 'Total users', value: stats.totalUsers },
            { label: 'New today', value: stats.newUsersToday },
            { label: 'New this week', value: stats.newUsersThisWeek },
            { label: 'Active (7d)', value: stats.activeUsersLast7Days },
            { label: 'Telegram requests', value: stats.telegramRequests },
            { label: 'Menu items', value: stats.totalMenuItems },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-burgundy/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
              <p className="mt-2 font-display text-3xl text-burgundy">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {stats?.topServices?.length ? (
        <SectionPanel title="Most requested via Telegram" defaultOpen={false}>
          <ul className="space-y-2 text-sm">
            {stats.topServices.map((entry) => (
              <li key={entry.serviceId} className="flex justify-between gap-4">
                <span>{entry.serviceName}</span>
                <span className="font-medium text-burgundy">{entry.count}</span>
              </li>
            ))}
          </ul>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Bot connection" description="Token, webhook, WebApp and language defaults" defaultOpen>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
          />
          Bot enabled
        </label>
        <Field label="Bot token (keep secret)">
          <input
            type="password"
            className={inputClass()}
            value={draft.botToken}
            onChange={(e) => setDraft({ ...draft, botToken: e.target.value })}
            placeholder="123456:ABC-DEF…"
          />
        </Field>
        <Field label="Webhook URL">
          <input
            className={inputClass()}
            value={draft.webhookUrl}
            onChange={(e) => setDraft({ ...draft, webhookUrl: e.target.value })}
            placeholder="https://api.yoursite.com/api/telegram/webhook"
          />
        </Field>
        <Field label="Website base URL (Web App origin)">
          <input
            className={inputClass()}
            value={draft.websiteBaseUrl}
            onChange={(e) => setDraft({ ...draft, websiteBaseUrl: e.target.value })}
          />
        </Field>
        <Field label="Web App base path (optional override)">
          <input
            className={inputClass()}
            value={draft.webAppBaseUrl}
            onChange={(e) => setDraft({ ...draft, webAppBaseUrl: e.target.value })}
            placeholder="Leave empty to use service webAppPath values"
          />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Default language">
            <select
              className={inputClass()}
              value={draft.defaultLanguage}
              onChange={(e) =>
                setDraft({ ...draft, defaultLanguage: e.target.value === 'am' ? 'am' : 'en' })
              }
            >
              <option value="en">English</option>
              <option value="am">Amharic</option>
            </select>
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Supported languages</p>
            <div className="flex gap-4 text-sm">
              {(['en', 'am'] as const).map((lang) => (
                <label key={lang} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.supportedLanguages.includes(lang)}
                    onChange={() => toggleSupportedLanguage(lang)}
                  />
                  {lang === 'en' ? 'English' : 'Amharic'}
                </label>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Bot messages"
        description="Customer-facing copy in English and Amharic. Changes apply immediately."
        defaultOpen
      >
        <div className="space-y-4">
          {botMessages.map((message) => (
            <div key={message.key} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <code className="text-xs text-gray-500">{message.key}</code>
                <button
                  type="button"
                  onClick={() => saveMessage(message)}
                  disabled={botSaving}
                  className="rounded-full bg-burgundy px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Save message
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="English">
                  <textarea
                    className={inputClass()}
                    rows={4}
                    value={localizedValue(message.textI18n, message.text, 'en')}
                    onChange={(e) => updateMessage(message.key, 'en', e.target.value)}
                  />
                </Field>
                <Field label="Amharic">
                  <textarea
                    className={inputClass()}
                    rows={4}
                    value={localizedValue(message.textI18n, message.text, 'am')}
                    onChange={(e) => updateMessage(message.key, 'am', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Bot menu"
        description="Button labels, actions, visibility, hierarchy, and order. Services always come from the CMS."
        defaultOpen
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={addMenu}
            disabled={botSaving}
            className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Add menu item
          </button>
        </div>
        <div className="space-y-4">
          {botMenus.map((item) => {
            const rootIndex = rootMenus.findIndex((entry) => entry.id === item.id)
            return (
              <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <code className="text-xs text-gray-500">key: {item.key}</code>
                    <p className="text-xs text-gray-400">
                      {item.parentKey ? `Submenu of ${item.parentKey}` : 'Main menu button'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.parentKey && rootIndex >= 0 ? (
                      <>
                        <button
                          type="button"
                          disabled={rootIndex === 0 || botSaving}
                          onClick={() => reorderRootMenu(rootIndex, -1)}
                          className="rounded-full border px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          disabled={rootIndex === rootMenus.length - 1 || botSaving}
                          onClick={() => reorderRootMenu(rootIndex, 1)}
                          className="rounded-full border px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Down
                        </button>
                      </>
                    ) : null}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => updateMenu(item.id, { enabled: e.target.checked })}
                      />
                      Visible
                    </label>
                    <button
                      type="button"
                      onClick={() => saveMenu(item)}
                      disabled={botSaving}
                      className="rounded-full bg-burgundy px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMenu(item.id)}
                      disabled={botSaving}
                      className="text-xs font-medium text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="English label">
                    <input
                      className={inputClass()}
                      value={localizedValue(item.labelI18n, item.label, 'en')}
                      onChange={(e) => updateMenuLabel(item.id, 'en', e.target.value)}
                    />
                  </Field>
                  <Field label="Amharic label">
                    <input
                      className={inputClass()}
                      value={localizedValue(item.labelI18n, item.label, 'am')}
                      onChange={(e) => updateMenuLabel(item.id, 'am', e.target.value)}
                    />
                  </Field>
                  <Field label="Action">
                    <select
                      className={inputClass()}
                      value={item.action}
                      onChange={(e) => updateMenu(item.id, { action: e.target.value as CmsBotMenu['action'] })}
                    >
                      {BOT_ACTIONS.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Icon (optional)">
                    <input
                      className={inputClass()}
                      value={item.icon ?? ''}
                      onChange={(e) => updateMenu(item.id, { icon: e.target.value || null })}
                    />
                  </Field>
                  <Field label="Parent key (blank = main menu)">
                    <input
                      className={inputClass()}
                      value={item.parentKey ?? ''}
                      onChange={(e) => updateMenu(item.id, { parentKey: e.target.value || null })}
                    />
                  </Field>
                  <Field label="Order">
                    <input
                      type="number"
                      className={inputClass()}
                      value={item.sortOrder}
                      onChange={(e) => updateMenu(item.id, { sortOrder: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Action data (URL path / callback)">
                    <input
                      className={inputClass()}
                      value={item.actionData ?? ''}
                      onChange={(e) => updateMenu(item.id, { actionData: e.target.value || null })}
                    />
                  </Field>
                </div>
              </div>
            )
          })}
        </div>
      </SectionPanel>

      <SectionPanel title="Order notifications" defaultOpen>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.notificationsEnabled}
            onChange={(e) => setDraft({ ...draft, notificationsEnabled: e.target.checked })}
          />
          Send Telegram notifications to admins
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.notifyOnNewRequest}
            onChange={(e) => setDraft({ ...draft, notifyOnNewRequest: e.target.checked })}
          />
          Notify on every new order
        </label>
        <Hint>
          Set each admin&apos;s Telegram chat ID on the Team page. They receive private messages when
          orders arrive from the website or Telegram WebApp.
        </Hint>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-gray-400">
                <th className="py-2 pr-4">Admin</th>
                <th className="py-2">Telegram chat ID</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={String(a.id)} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{String(a.name)}</td>
                  <td className="py-2 font-mono text-xs">{String(a.telegramChatId ?? '— not set —')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <StickySaveBar label="Save Telegram settings" saving={saving} dirty={dirty} onSave={save} msg={msg} />
    </div>
  )
}
