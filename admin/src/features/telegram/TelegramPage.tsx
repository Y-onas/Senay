import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Save, Bot } from 'lucide-react'
import { toast } from 'sonner'
import {
  botApi,
  settingsApi,
  type BotAdminNotify,
  type BotHealth,
  type BotMenuItem,
  type BotMessageItem,
  type BotServiceItem,
  type BotStats,
  type TelegramSettings,
} from '@/lib/api'
import { readLocale } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const DEFAULTS: TelegramSettings = {
  enabled: true,
  webAppBaseUrl: '',
  notificationsEnabled: true,
  notifyOnNewRequest: true,
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'am'],
}

function mergeSettings(raw: unknown): TelegramSettings {
  const telegram = (raw ?? {}) as Partial<TelegramSettings>
  const merged: TelegramSettings = {
    ...DEFAULTS,
    ...telegram,
    defaultLanguage: telegram.defaultLanguage === 'am' ? 'am' : 'en',
    supportedLanguages: Array.isArray(telegram.supportedLanguages)
      ? telegram.supportedLanguages.filter((lang): lang is 'en' | 'am' => lang === 'en' || lang === 'am')
      : DEFAULTS.supportedLanguages,
  }
  return merged
}

export function TelegramPage() {
  const [saved, setSaved] = useState<TelegramSettings>(DEFAULTS)
  const [draft, setDraft] = useState<TelegramSettings>(DEFAULTS)
  const [menus, setMenus] = useState<BotMenuItem[]>([])
  const [messages, setMessages] = useState<BotMessageItem[]>([])
  const [services, setServices] = useState<BotServiceItem[]>([])
  const [health, setHealth] = useState<BotHealth | null>(null)
  const [stats, setStats] = useState<BotStats | null>(null)
  const [admins, setAdmins] = useState<BotAdminNotify[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const rootMenus = useMemo(
    () => menus.filter((item) => !item.parentKey).sort((a, b) => a.sortOrder - b.sortOrder),
    [menus],
  )

  const reload = async () => {
    const [telegram, menuRows, messageRows, serviceRows, healthRow, statsRow, adminRows] =
      await Promise.all([
        settingsApi.get('telegram'),
        botApi.menus(),
        botApi.messages(),
        botApi.services(),
        botApi.health(),
        botApi.stats(),
        botApi.admins(),
      ])
    const merged = mergeSettings(telegram)
    setSaved(merged)
    setDraft(merged)
    setMenus(menuRows ?? [])
    setMessages(messageRows ?? [])
    setServices(serviceRows ?? [])
    setHealth(healthRow ?? null)
    setStats(statsRow ?? null)
    setAdmins(adminRows ?? [])
  }

  useEffect(() => {
    reload()
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load bot settings'))
      .finally(() => setLoading(false))
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await settingsApi.put('telegram', draft)
      setSaved(draft)
      setHealth(await botApi.health())
      toast.success('Telegram settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const saveMenu = async (item: BotMenuItem) => {
    setBusy(true)
    try {
      await botApi.patchMenu(item.id, {
        parentKey: item.parentKey || null,
        label: item.label,
        labelI18n: item.labelI18n,
        action: item.action,
        actionData: item.actionData || null,
        icon: item.icon || null,
        enabled: item.enabled,
        sortOrder: Number(item.sortOrder),
      })
      toast.success('Menu item saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const reorderRoot = async (index: number, direction: number) => {
    const next = index + direction
    if (next < 0 || next >= rootMenus.length) return
    const reordered = [...rootMenus]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(next, 0, moved)
    setMenus([...reordered, ...menus.filter((item) => item.parentKey)])
    try {
      await botApi.reorderMenus(reordered.map((item) => item.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reorder failed')
      await reload()
    }
  }

  const saveMessage = async (item: BotMessageItem) => {
    setBusy(true)
    try {
      await botApi.putMessage(item.key, { text: item.text, textI18n: item.textI18n })
      toast.success('Message saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const saveServiceDescription = async (item: BotServiceItem) => {
    setBusy(true)
    try {
      const enText = readLocale(item.description, item.descriptionI18n, 'en')
      await botApi.patchService(item.id, {
        description: enText,
        descriptionI18n: item.descriptionI18n,
      })
      toast.success('Service description saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  const statusClass =
    health?.status === 'online'
      ? 'bg-emerald-100 text-emerald-800'
      : health?.status === 'degraded'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800'

  return (
    <div className="animate-fade-in space-y-6 pb-24">
      <PageHeader
        title="Telegram Bot"
        description="Connection, menus, messages, and notifications — all from the dashboard."
        icon={<Bot className="h-5 w-5" />}
        actions={
          <Link to="/telegram/users" className="text-sm text-burgundy hover:underline">
            View users
          </Link>
        }
      />

      {health ? (
        <Card className="border-burgundy/10">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-brown/60">Status</p>
              <p className="font-display text-2xl font-bold text-burgundy">
                {health.botUsername ? `@${health.botUsername}` : 'Not connected'}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusClass}`}>
              {health.status || 'offline'}
            </span>
          </div>
          <div className="grid gap-2 px-5 pb-5 text-sm md:grid-cols-2 lg:grid-cols-4">
            <p>Enabled: {draft.enabled ? 'Yes' : 'No'}</p>
            <p>Token valid: {health.tokenValid ? 'Yes' : 'No'}</p>
            <p>Process online: {health.processOnline ? 'Yes' : 'No'}</p>
            <p>Mode: {health.mode || 'polling'}</p>
          </div>
        </Card>
      ) : null}

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['Total users', stats.totalUsers],
              ['New today', stats.newUsersToday],
              ['Active (7d)', stats.activeUsersLast7Days],
              ['Telegram requests', stats.telegramRequests],
            ] as const
          ).map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs uppercase text-brown/60">{label}</p>
              <p className="mt-1 font-display text-3xl text-burgundy">{value}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            />
            Bot enabled
          </label>
          <Card className="border-yellow-brand/30 bg-yellow-brand/5 p-4">
            <div className="space-y-2 text-sm text-brown/65">
              <p className="font-medium text-burgundy">
                Secrets are configured in server/.env (not stored in the database)
              </p>
              <p>
                Bot token:{' '}
                <span className="font-mono text-xs">
                  {health?.env?.botTokenPreview || (health?.tokenConfigured ? 'configured' : 'not set')}
                </span>
              </p>
              <p>
                Webhook URL:{' '}
                <span className="break-all font-mono text-xs">
                  {health?.env?.webhookUrl || health?.configuredWebhookUrl || '—'}
                </span>
              </p>
              <p>
                Website URL:{' '}
                <span className="break-all font-mono text-xs">
                  {health?.env?.websiteBaseUrl || health?.webAppBaseUrl || '—'}
                </span>
              </p>
              <p>
                Admin IDs (ADMIN_IDS):{' '}
                <span className="font-mono text-xs">{(health?.env?.adminIds || []).join(', ') || '—'}</span>
              </p>
              <p>
                Bot mode:{' '}
                <span className="font-mono text-xs">{health?.env?.botMode || health?.mode || 'polling'}</span>
              </p>
            </div>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default language</Label>
              <Select
                value={draft.defaultLanguage}
                onValueChange={(value) =>
                  setDraft({ ...draft, defaultLanguage: value === 'am' ? 'am' : 'en' })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="am">Amharic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={saving || !dirty}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bot messages (EN / AM)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((message) => (
            <div key={message.key} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-brown/60">{message.key}</code>
                <Button size="sm" disabled={busy} onClick={() => saveMessage(message)}>
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>English</Label>
                  <Textarea
                    rows={3}
                    value={readLocale(message.text, message.textI18n, 'en')}
                    onChange={(e) =>
                      setMessages((rows) =>
                        rows.map((row) =>
                          row.key === message.key
                            ? {
                                ...row,
                                text: e.target.value,
                                textI18n: { ...row.textI18n, en: e.target.value },
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amharic</Label>
                  <Textarea
                    rows={3}
                    value={readLocale(message.text, message.textI18n, 'am')}
                    onChange={(e) =>
                      setMessages((rows) =>
                        rows.map((row) =>
                          row.key === message.key
                            ? { ...row, textI18n: { ...row.textI18n, am: e.target.value } }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order service descriptions (EN / AM)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-brown/65">
            Text shown when a user taps Order and picks a service. Write the full message here — include
            package names or prices manually if you want them.
          </p>
          {services.map((service) => (
            <div key={service.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-burgundy">
                    {readLocale(service.name, service.nameI18n, 'en') || service.slug}
                  </p>
                  <code className="text-xs text-brown/60">{service.slug}</code>
                </div>
                <Button size="sm" disabled={busy} onClick={() => saveServiceDescription(service)}>
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>English</Label>
                  <Textarea
                    rows={4}
                    value={readLocale(service.description, service.descriptionI18n, 'en')}
                    onChange={(e) =>
                      setServices((rows) =>
                        rows.map((row) =>
                          row.id === service.id
                            ? {
                                ...row,
                                description: e.target.value,
                                descriptionI18n: { ...row.descriptionI18n, en: e.target.value },
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amharic</Label>
                  <Textarea
                    rows={4}
                    value={readLocale(service.description, service.descriptionI18n, 'am')}
                    onChange={(e) =>
                      setServices((rows) =>
                        rows.map((row) =>
                          row.id === service.id
                            ? { ...row, descriptionI18n: { ...row.descriptionI18n, am: e.target.value } }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bot menu buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {menus.map((item) => {
            const rootIndex = rootMenus.findIndex((entry) => entry.id === item.id)
            return (
              <div key={item.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs">{item.key}</code>
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.parentKey && rootIndex >= 0 ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rootIndex === 0 || busy}
                          onClick={() => reorderRoot(rootIndex, -1)}
                        >
                          Up
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rootIndex === rootMenus.length - 1 || busy}
                          onClick={() => reorderRoot(rootIndex, 1)}
                        >
                          Down
                        </Button>
                      </>
                    ) : null}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) =>
                          setMenus((rows) =>
                            rows.map((row) => (row.id === item.id ? { ...row, enabled: e.target.checked } : row)),
                          )
                        }
                      />
                      Visible
                    </label>
                    <Button size="sm" disabled={busy} onClick={() => saveMenu(item)}>
                      <Save className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>English label</Label>
                    <Input
                      value={readLocale(item.label, item.labelI18n, 'en')}
                      onChange={(e) =>
                        setMenus((rows) =>
                          rows.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  label: e.target.value,
                                  labelI18n: { ...row.labelI18n, en: e.target.value },
                                }
                              : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amharic label</Label>
                    <Input
                      value={readLocale(item.label, item.labelI18n, 'am')}
                      onChange={(e) =>
                        setMenus((rows) =>
                          rows.map((row) =>
                            row.id === item.id
                              ? { ...row, labelI18n: { ...row.labelI18n, am: e.target.value } }
                              : row,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-brown/60">
                  <th className="py-2 pr-4">Admin</th>
                  <th className="py-2">Telegram chat ID</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-border/50">
                    <td className="py-2 pr-4">{admin.name}</td>
                    <td className="py-2 font-mono text-xs">{admin.telegramChatId || '— not set —'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dirty ? (
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save notification settings'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
