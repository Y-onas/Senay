// Agelgil pricing editor — minify into st-hq bundle as function D5
function D5({ item: item, onSaved: onSaved, onDelete: onDelete }) {
  const normalizeMenus = (raw) => {
    if (!raw || typeof raw !== 'object') return {}
    if (raw['fasting-regular'] || raw['fasting-special']) return raw
    const out = {}
    for (const meal of ['fasting', 'non-fasting']) {
      const group = raw[meal]
      if (!group || typeof group !== 'object') continue
      for (const kind of ['regular', 'special']) {
        const entry = group[kind]
        if (entry && typeof entry === 'object') {
          out[`${meal}-${kind}`] = {
            label: typeof entry.label === 'string' ? entry.label : '',
            dishes: Array.isArray(entry.dishes) ? entry.dishes : [],
          }
        }
      }
    }
    return out
  }

  const [row, setRow] = x.useState(() => {
    const meta = item.metadata ?? {}
    return {
      ...item,
      metadata: {
        ...meta,
        priceTable: meta.priceTable ?? {},
        menus: normalizeMenus(meta.menus ?? {}),
      },
    }
  })
  const [saving, setSaving] = x.useState(false)
  const meta = row.metadata ?? {}
  const priceTable = meta.priceTable ?? {}
  const menus = meta.menus ?? {}

  x.useEffect(() => {
    const nextMeta = item.metadata ?? {}
    setRow({
      ...item,
      metadata: {
        ...nextMeta,
        priceTable: nextMeta.priceTable ?? {},
        menus: normalizeMenus(nextMeta.menus ?? {}),
      },
    })
  }, [item])

  const readPrice = (mealType, kind, size) => {
    const key = `${mealType}-${kind}`
    const sizeKey = '' + size
    return dt(priceTable[key]?.[sizeKey])
  }

  const setPrice = (mealType, kind, size, value) => {
    const key = `${mealType}-${kind}`
    const sizeKey = '' + size
    const nextTable = {
      ...priceTable,
      [key]: { ...(priceTable[key] ?? {}), [sizeKey]: value },
    }
    setRow((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, priceTable: nextTable },
    }))
  }

  const menuKey = (mealType, kind) => `${mealType}-${kind}`

  const readLabel = (mealType, kind, fallback) =>
    String(menus[menuKey(mealType, kind)]?.label ?? fallback)

  const readDishes = (mealType, kind) =>
    (menus[menuKey(mealType, kind)]?.dishes ?? []).join('\n')

  const setMenu = (mealType, kind, label, dishesText) => {
    const key = menuKey(mealType, kind)
    const dishes = dishesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const nextMenus = {
      ...menus,
      [key]: { label, dishes },
    }
    setRow((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, menus: nextMenus },
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await An.update(row.id, {
        name: row.name,
        description: row.description,
        available: row.available,
        sortOrder: row.sortOrder,
        metadata: row.metadata,
      })
      we.success('Agelgil pricing saved')
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const sizes = [10, 15, 20, 30]
  const packages = [
    { label: 'Fasting Regular', mealType: 'fasting', kind: 'regular' },
    { label: 'Fasting Special', mealType: 'fasting', kind: 'special' },
    { label: 'Non-fasting Regular', mealType: 'non-fasting', kind: 'regular' },
    { label: 'Non-fasting Special', mealType: 'non-fasting', kind: 'special' },
  ]

  return i.jsxs('div', {
    className: 'space-y-4',
    children: [
      i.jsxs('div', {
        className: 'grid grid-cols-1 md:grid-cols-3 gap-3',
        children: [
          i.jsxs('div', {
            children: [
              i.jsx(me, { children: 'Config name' }),
              i.jsx(J, { value: row.name, onChange: (e) => setRow({ ...row, name: e.target.value }) }),
            ],
          }),
          i.jsxs('div', {
            className: 'md:col-span-2',
            children: [
              i.jsx(me, { children: 'Description' }),
              i.jsx(J, {
                value: row.description,
                onChange: (e) => setRow({ ...row, description: e.target.value }),
              }),
            ],
          }),
        ],
      }),
      i.jsx('div', {
        className: 'rounded-lg border overflow-x-auto',
        children: i.jsxs('table', {
          className: 'w-full text-sm',
          children: [
            i.jsx('thead', {
              className: 'bg-muted/40',
              children: i.jsxs('tr', {
                children: [
                  i.jsx('th', { className: 'text-left p-3', children: 'Package type' }),
                  sizes.map((size) =>
                    i.jsxs('th', { className: 'text-left p-3', children: [size, ' people'] }, size),
                  ),
                ],
              }),
            }),
            i.jsx('tbody', {
              children: packages.map((pkg) =>
                i.jsxs(
                  'tr',
                  {
                    className: 'border-t',
                    children: [
                      i.jsx('td', { className: 'p-3 font-medium', children: pkg.label }),
                      sizes.map((size) =>
                        i.jsx(
                          'td',
                          {
                            className: 'p-2',
                            children: i.jsx(J, {
                              type: 'number',
                              value: readPrice(pkg.mealType, pkg.kind, size),
                              onChange: (e) =>
                                setPrice(pkg.mealType, pkg.kind, size, dt(e.target.value)),
                            }),
                          },
                          `${pkg.label}-${size}`,
                        ),
                      ),
                    ],
                  },
                  `${pkg.mealType}-${pkg.kind}`,
                ),
              ),
            }),
          ],
        }),
      }),
      i.jsxs('div', {
        className: 'rounded-lg border p-4 space-y-4',
        children: [
          i.jsx('p', { className: 'font-medium', children: 'Agelgil Menu Dishes' }),
          i.jsx('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
            children: packages.map((pkg) => {
              const label = readLabel(pkg.mealType, pkg.kind, pkg.label)
              const dishes = readDishes(pkg.mealType, pkg.kind)
              return i.jsxs(
                'div',
                {
                  className: 'space-y-2',
                  children: [
                    i.jsxs(me, { children: [pkg.label, ' label'] }),
                    i.jsx(J, {
                      value: label,
                      onChange: (e) => setMenu(pkg.mealType, pkg.kind, e.target.value, dishes),
                    }),
                    i.jsxs(me, { children: [pkg.label, ' dishes (one per line)'] }),
                    i.jsx(Vn, {
                      rows: 5,
                      value: dishes,
                      onChange: (e) => setMenu(pkg.mealType, pkg.kind, label, e.target.value),
                    }),
                  ],
                },
                `menu-${pkg.label}`,
              )
            }),
          }),
        ],
      }),
      i.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          i.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              i.jsx(rn, {
                checked: row.available,
                onCheckedChange: (next) => setRow({ ...row, available: next }),
              }),
              i.jsx('span', { className: 'text-sm', children: 'Available' }),
            ],
          }),
          i.jsxs('div', {
            className: 'flex gap-2',
            children: [
              i.jsx(re, { onClick: save, disabled: saving, children: saving ? 'Saving...' : 'Save Agelgil pricing' }),
              i.jsx(re, { variant: 'destructive', onClick: () => onDelete(row.id), children: 'Delete config' }),
            ],
          }),
        ],
      }),
    ],
  })
}
