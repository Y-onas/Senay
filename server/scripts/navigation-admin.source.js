// Navigation admin page — minify into st-hq bundle as a5
function a5() {
  const readLocale = (base, i18n, lang) => {
    if (i18n && typeof i18n === 'object' && typeof i18n[lang] === 'string' && i18n[lang]) return i18n[lang]
    return lang === 'en' ? base || '' : ''
  }

  const [items, setItems] = x.useState([])
  const [loading, setLoading] = x.useState(true)
  const [busy, setBusy] = x.useState(false)

  x.useEffect(() => {
    vt.navigation.list().then(setItems).finally(() => setLoading(false))
  }, [])

  const saveItem = async (item) => {
    setBusy(true)
    try {
      const enLabel = readLocale(item.label, item.labelI18n, 'en')
      const updated = await vt.navigation.update(item.id, {
        location: item.location,
        label: enLabel,
        labelI18n: item.labelI18n,
        href: item.href,
        order: Number(item.order),
        enabled: item.enabled,
      })
      setItems((rows) => rows.map((row) => (row.id === updated.id ? updated : row)))
      we.success('Navigation updated')
    } finally {
      setBusy(false)
    }
  }

  const addItem = async () => {
    const created = await vt.navigation.create({
      location: 'PRIMARY',
      label: 'New link',
      labelI18n: { en: 'New link', am: '' },
      href: '/',
      order: items.length + 1,
      enabled: true,
    })
    setItems((rows) => [...rows, created])
  }

  const deleteItem = async (id) => {
    if (!await adminConfirm({title:'Delete navigation link?',description:'This menu link will be removed from the site header.',confirmLabel:'Delete link'})) return
    await vt.navigation.delete(id)
    setItems((rows) => rows.filter((row) => row.id !== id))
    we.success('Deleted')
  }

  if (loading) return i.jsx(ht, { className: 'h-96' })

  return i.jsxs('div', {
    className: 'space-y-6 animate-fade-in pb-24',
    children: [
      i.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          i.jsxs('div', {
            children: [
              i.jsx('h1', {
                className: 'font-display text-3xl font-bold text-burgundy',
                children: 'Navigation',
              }),
              i.jsx('p', {
                className: 'text-brown-muted',
                children: 'Primary nav labels in English and Amharic — shown on the website header.',
              }),
            ],
          }),
          i.jsxs(re, { onClick: addItem, children: [i.jsx(Qt, { className: 'w-4 h-4 mr-2' }), 'Add link'] }),
        ],
      }),
      i.jsx('div', {
        className: 'space-y-3',
        children: items.map((item) =>
          i.jsx(
            Ke,
            {
              className: 'p-4',
              children: i.jsxs('div', {
                className: 'space-y-4',
                children: [
                  i.jsxs('div', {
                    className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                    children: [
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'English label' }),
                          i.jsx(J, {
                            value: readLocale(item.label, item.labelI18n, 'en'),
                            onChange: (e) =>
                              setItems((rows) =>
                                rows.map((row) =>
                                  row.id === item.id
                                    ? {
                                        ...row,
                                        label: e.target.value,
                                        labelI18n: { ...row.labelI18n, en: e.target.value },
                                      }
                                    : row,
                                ),
                              ),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'Amharic label' }),
                          i.jsx(J, {
                            value: readLocale(item.label, item.labelI18n, 'am'),
                            onChange: (e) =>
                              setItems((rows) =>
                                rows.map((row) =>
                                  row.id === item.id
                                    ? { ...row, labelI18n: { ...row.labelI18n, am: e.target.value } }
                                    : row,
                                ),
                              ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  i.jsxs('div', {
                    className: 'grid grid-cols-1 gap-4 md:grid-cols-6 items-end',
                    children: [
                      i.jsxs('div', {
                        className: 'space-y-2 md:col-span-2',
                        children: [
                          i.jsx(me, { children: 'URL' }),
                          i.jsx(J, {
                            value: item.href,
                            onChange: (e) =>
                              setItems((rows) =>
                                rows.map((row) => (row.id === item.id ? { ...row, href: e.target.value } : row)),
                              ),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'Location' }),
                          i.jsxs(Tt, {
                            value: item.location,
                            onValueChange: (v) =>
                              setItems((rows) =>
                                rows.map((row) => (row.id === item.id ? { ...row, location: v } : row)),
                              ),
                            children: [
                              i.jsx(_t, { children: i.jsx(Rt, {}) }),
                              i.jsxs(kt, {
                                children: [
                                  i.jsx(ke, { value: 'PRIMARY', children: 'Primary' }),
                                  i.jsx(ke, { value: 'FOOTER', children: 'Footer' }),
                                  i.jsx(ke, { value: 'MOBILE', children: 'Mobile' }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'Order' }),
                          i.jsx(J, {
                            type: 'number',
                            value: item.order,
                            onChange: (e) =>
                              setItems((rows) =>
                                rows.map((row) =>
                                  row.id === item.id ? { ...row, order: Number(e.target.value) } : row,
                                ),
                              ),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'flex items-center gap-2 pb-2',
                        children: [
                          i.jsx(rn, {
                            checked: item.enabled,
                            onCheckedChange: async (checked) => {
                              const next = { ...item, enabled: checked }
                              setItems((rows) => rows.map((row) => (row.id === item.id ? next : row)))
                              await saveItem(next)
                            },
                          }),
                          i.jsx(me, { className: 'mb-0', children: 'Visible on site' }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          i.jsxs(re, {
                            size: 'sm',
                            disabled: busy,
                            onClick: () => saveItem(item),
                            children: [i.jsx(ha, { className: 'w-4 h-4 mr-1' }), ' Save'],
                          }),
                          i.jsx(re, {
                            size: 'sm',
                            variant: 'ghost',
                            onClick: () => deleteItem(item.id),
                            children: i.jsx(Zt, { className: 'w-4 h-4 text-destructive' }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            },
            item.id,
          ),
        ),
      }),
    ],
  })
}
