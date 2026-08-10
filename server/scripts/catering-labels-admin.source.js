// Catering occasion & beverage label CRUD — minify into st-hq bundle as function Cl7
function Cl7({
  role: role,
  title: title,
  description: description,
  addLabel: addLabel,
  emptyLabel: emptyLabel,
  items: items,
  serviceId: serviceId,
  onRefresh: onRefresh,
  onDelete: onDelete,
}) {
  const isOcc = role === 'occasion'
  const [open, setOpen] = x.useState(false)
  const [editing, setEditing] = x.useState(null)
  const [saving, setSaving] = x.useState(false)
  const [slug, setSlug] = x.useState('')
  const [nameEn, setNameEn] = x.useState('')
  const [nameAm, setNameAm] = x.useState('')
  const [emoji, setEmoji] = x.useState('✨')
  const [bevValue, setBevValue] = x.useState('')
  const [available, setAvailable] = x.useState(true)

  const readI18n = (item, lang) => {
    const map = item?.nameI18n
    if (map && typeof map === 'object' && typeof map[lang] === 'string' && map[lang]) return map[lang]
    return lang === 'en' ? item?.name || '' : ''
  }

  const reset = () => {
    setSlug('')
    setNameEn('')
    setNameAm('')
    setEmoji('✨')
    setBevValue('')
    setAvailable(true)
    setEditing(null)
  }

  const openAdd = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setSlug(item.slug || '')
    setNameEn(readI18n(item, 'en'))
    setNameAm(readI18n(item, 'am'))
    setEmoji(String(item.metadata?.emoji || '✨'))
    setBevValue(String(item.metadata?.value || item.slug || ''))
    setAvailable(item.available !== false)
    setOpen(true)
  }

  const save = async () => {
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!cleanSlug || !nameEn.trim()) {
      we.error('Slug and English label are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        kind: 'CONFIG',
        slug: cleanSlug,
        name: nameEn.trim(),
        nameI18n: { en: nameEn.trim(), am: nameAm.trim() },
        description: '',
        available,
        metadata: {
          catalogRole: role,
          ...(isOcc
            ? { emoji: emoji.trim() || '✨' }
            : { value: (bevValue.trim() || cleanSlug).toLowerCase().replace(/\s+/g, '-') }),
        },
      }
      if (editing) await An.update(editing.id, payload)
      else
        await An.create({
          serviceId,
          ...payload,
          sortOrder: items.length + 1,
        })
      we.success(isOcc ? 'Occasion saved' : 'Beverage option saved')
      setOpen(false)
      reset()
      await onRefresh()
    } finally {
      setSaving(false)
    }
  }

  const sheetTitle = editing
    ? `Edit ${nameEn || editing.name}`
    : isOcc
      ? 'Add occasion'
      : 'Add beverage option'

  return i.jsxs(i.Fragment, {
    children: [
      i.jsx(Ua, {
        title,
        description,
        addLabel,
        items,
        emptyLabel,
        onAdd: openAdd,
        onEdit: openEdit,
        onDelete,
        getSubtitle: (item) => {
          const am = readI18n(item, 'am')
          return `${am || '—'} · ${item.slug}`
        },
      }),
      i.jsx(yb, {
        open,
        onOpenChange: (next) => {
          if (!next) {
            setOpen(false)
            reset()
          }
        },
        children: i.jsxs(bb, {
          side: 'right',
          className: 'flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl',
          children: [
            i.jsxs(AE, {
              className: 'border-b border-border/70 bg-cream/50 px-5 py-4 text-left',
              children: [
                i.jsx(TE, { className: 'font-display text-xl text-burgundy', children: sheetTitle }),
                i.jsx(RE, {
                  children: editing
                    ? 'Update English and Amharic labels, then save.'
                    : 'Add a label shown on the catering order form.',
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'flex-1 space-y-4 overflow-y-auto px-5 py-5',
              children: [
                i.jsx(ge, {
                  label: 'Label (English)',
                  children: i.jsx(J, {
                    value: nameEn,
                    placeholder: isOcc ? 'Wedding' : 'Food Only',
                    onChange: (e) => setNameEn(e.target.value),
                  }),
                }),
                i.jsx(ge, {
                  label: 'Label (Amharic)',
                  children: i.jsx(J, {
                    value: nameAm,
                    placeholder: isOcc ? 'ሠርግ' : 'ምግብ ብቻ',
                    onChange: (e) => setNameAm(e.target.value),
                  }),
                }),
                i.jsx(ge, {
                  label: 'Slug',
                  children: i.jsx(J, {
                    value: slug,
                    disabled: !!editing,
                    placeholder: isOcc ? 'wedding' : 'food-only',
                    onChange: (e) => {
                      const next = e.target.value
                      setSlug(next)
                      if (!isOcc && !editing) {
                        setBevValue(next.trim().toLowerCase().replace(/\s+/g, '-'))
                      }
                    },
                  }),
                }),
                isOcc
                  ? i.jsx(ge, {
                      label: 'Emoji',
                      children: i.jsx(J, {
                        value: emoji,
                        onChange: (e) => setEmoji(e.target.value),
                      }),
                    })
                  : i.jsx(ge, {
                      label: 'Pricing key',
                      children: i.jsx(J, {
                        value: bevValue,
                        placeholder: 'food-only',
                        onChange: (e) =>
                          setBevValue(e.target.value.trim().toLowerCase().replace(/\s+/g, '-')),
                      }),
                    }),
                i.jsxs('label', {
                  className: 'flex items-center gap-2 text-sm',
                  children: [
                    i.jsx(rn, { checked: available, onCheckedChange: setAvailable }),
                    'Visible on website',
                  ],
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'flex justify-end gap-2 border-t border-border/70 px-5 py-4',
              children: [
                i.jsx(re, {
                  variant: 'outline',
                  onClick: () => {
                    setOpen(false)
                    reset()
                  },
                  children: 'Cancel',
                }),
                i.jsxs(re, {
                  disabled: saving,
                  onClick: save,
                  className: 'gap-2',
                  children: [i.jsx(ha, { className: 'h-4 w-4' }), saving ? 'Saving…' : 'Save'],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
