import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

type AdminRole = { id: string; name: string }

type AdminRow = {
  id: string
  name: string
  email: string
  status: string
  role?: AdminRole
  roleId?: string
  telegramChatId?: string | null
  lastLoginAt?: string | null
}

export function AdminsPage() {
  const { admin: actor } = useAuth()
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', roleId: '' })
  const [query, setQuery] = useState('')

  const load = async () => {
    const delay = setTimeout(() => setLoading(true), 200)
    try {
      const [list, roleList] = await Promise.all([adminsApi.list(), adminsApi.roles()])
      setAdmins(list as AdminRow[])
      const inviteRoles = (roleList as AdminRole[]).filter(
        (role) => role.name === 'Super Admin' || role.name === 'Content Management',
      )
      setRoles(inviteRoles)
      setForm((current) => ({
        ...current,
        roleId:
          current.roleId ||
          inviteRoles.find((role) => role.name === 'Content Management')?.id ||
          inviteRoles[0]?.id ||
          '',
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load admins')
    } finally {
      clearTimeout(delay)
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return admins
    const q = query.toLowerCase()
    return admins.filter(
      (admin) => admin.name.toLowerCase().includes(q) || admin.email.toLowerCase().includes(q),
    )
  }, [admins, query])

  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setCreating(true)
    try {
      const created = (await adminsApi.create({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        roleId: form.roleId || undefined,
        status: 'ACTIVE',
      })) as AdminRow
      setAdmins((rows) => [created, ...rows])
      setForm((current) => ({ name: '', email: '', roleId: current.roleId }))
      toast.success('Admin invited — they can sign in with Google using this email')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create admin')
    } finally {
      setCreating(false)
    }
  }

  const save = async (admin: AdminRow) => {
    try {
      const saved = (await adminsApi.update(admin.id, {
        name: admin.name,
        email: admin.email,
        roleId: admin.role?.id || admin.roleId,
        status: admin.status,
        telegramChatId: admin.telegramChatId ?? null,
      })) as AdminRow
      setAdmins((rows) => rows.map((row) => (row.id === saved.id ? saved : row)))
      toast.success('Admin saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    }
  }

  const toggle = async (admin: AdminRow) => {
    const status = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      const saved = (await adminsApi.update(admin.id, { status })) as AdminRow
      setAdmins((rows) => rows.map((row) => (row.id === saved.id ? saved : row)))
      toast.success(status === 'ACTIVE' ? 'Admin enabled' : 'Admin suspended')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    }
  }

  const remove = async (admin: AdminRow) => {
    if (actor?.id === admin.id) {
      toast.error('You cannot delete your own account')
      return
    }
    if (!(await confirmAdminAction(ADMIN_CONFIRM.removeAdmin(admin.email)))) return
    try {
      await adminsApi.delete(admin.id)
      setAdmins((rows) => rows.filter((row) => row.id !== admin.id))
      toast.success('Admin removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-burgundy/60">System</p>
          <h1 className="font-display text-3xl font-bold text-burgundy">Admins</h1>
          <p className="max-w-2xl text-brown/65">
            Two access levels: Super Admin (everything) or Content Management (site & content only — no
            System, Telegram, or Catalog).
          </p>
        </div>
        <Input
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card className="space-y-4 p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base">Invite admin</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 items-end gap-3 p-0 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1">
            <Label>Email (Google)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="name@gmail.com"
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={form.roleId} onValueChange={(value) => setForm((current) => ({ ...current, roleId: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={create} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            {creating ? 'Saving…' : 'Add admin'}
          </Button>
        </CardContent>
        <p className="text-xs text-brown/60">
          After you add them, they open /st-hq/login and sign in with that Google account.
        </p>
      </Card>

      <div className="space-y-3">
        {filtered.length ? (
          filtered.map((admin) => (
            <Card key={admin.id} className="p-4">
              <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
                <div className="space-y-1 lg:col-span-3">
                  <Label>Name</Label>
                  <Input
                    value={admin.name || ''}
                    onChange={(e) =>
                      setAdmins((rows) =>
                        rows.map((row) => (row.id === admin.id ? { ...row, name: e.target.value } : row)),
                      )
                    }
                  />
                </div>
                <div className="space-y-1 lg:col-span-3">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={admin.email || ''}
                    onChange={(e) =>
                      setAdmins((rows) =>
                        rows.map((row) => (row.id === admin.id ? { ...row, email: e.target.value } : row)),
                      )
                    }
                  />
                </div>
                <div className="space-y-1 lg:col-span-2">
                  <Label>Role</Label>
                  <Select
                    value={admin.role?.id || ''}
                    onValueChange={(value) =>
                      setAdmins((rows) =>
                        rows.map((row) =>
                          row.id === admin.id
                            ? {
                                ...row,
                                role: {
                                  ...(row.role || { name: '' }),
                                  id: value,
                                  name: roles.find((role) => role.id === value)?.name || row.role?.name || '',
                                },
                              }
                            : row,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      admin.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {admin.status}
                  </span>
                  <Button size="sm" onClick={() => save({ ...admin, roleId: admin.role?.id })}>
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggle(admin)}>
                    {admin.status === 'ACTIVE' ? 'Suspend' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(admin)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  {admin.lastLoginAt ? (
                    <span className="text-[11px] text-brown/60">
                      Last login {new Date(admin.lastLoginAt).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[11px] text-brown/60">Never signed in</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-brown/60">No admins yet. Add the first email above.</Card>
        )}
      </div>
    </div>
  )
}
