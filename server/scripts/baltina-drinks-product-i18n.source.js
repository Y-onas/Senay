// Baltina product editor — minify into st-hq bundle as function k5
function k5({ item: item, onDelete: onDelete, onSaved: onSaved, embedded: embedded = false }) {
  const [product, setProduct] = x.useState(item)
  const meta = product.metadata ?? {}
  const [category, setCategory] = x.useState(meta.category || 'flours')
  const [unit, setUnit] = x.useState(String(meta.unit ?? 'kg'))
  const [minQty, setMinQty] = x.useState(String(meta.minQty ?? 0.5))
  const [step, setStep] = x.useState(String(meta.step ?? 0.5))
  const [saving, setSaving] = x.useState(false)

  const readI18n = (row, field, lang) => {
    const map = row?.[`${field}I18n`]
    if (map && typeof map === 'object' && typeof map[lang] === 'string' && map[lang]) return map[lang]
    return lang === 'en' ? row?.[field] || '' : ''
  }

  const [nameEn, setNameEn] = x.useState(() => readI18n(item, 'name', 'en'))
  const [nameAm, setNameAm] = x.useState(() => readI18n(item, 'name', 'am'))
  const [descEn, setDescEn] = x.useState(() => readI18n(item, 'description', 'en'))
  const [descAm, setDescAm] = x.useState(() => readI18n(item, 'description', 'am'))

  x.useEffect(() => {
    setProduct(item)
    const nextMeta = item.metadata ?? {}
    setCategory(nextMeta.category || 'flours')
    setUnit(String(nextMeta.unit ?? 'kg'))
    setMinQty(String(nextMeta.minQty ?? 0.5))
    setStep(String(nextMeta.step ?? 0.5))
    setNameEn(readI18n(item, 'name', 'en'))
    setNameAm(readI18n(item, 'name', 'am'))
    setDescEn(readI18n(item, 'description', 'en'))
    setDescAm(readI18n(item, 'description', 'am'))
  }, [item])

  const localePair = (label, enValue, amValue, onEn, onAm, enPlaceholder, amPlaceholder) =>
    i.jsxs('div', {
      className: 'space-y-2 md:col-span-2',
      children: [
        i.jsx(me, { children: label }),
        i.jsxs('div', {
          className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
          children: [
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'EN',
                }),
                i.jsx(J, { value: enValue, placeholder: enPlaceholder, onChange: (e) => onEn(e.target.value) }),
              ],
            }),
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'AM',
                }),
                i.jsx(J, { value: amValue, placeholder: amPlaceholder, onChange: (e) => onAm(e.target.value) }),
              ],
            }),
          ],
        }),
      ],
    })

  const save = async () => {
    setSaving(true)
    try {
      await An.update(product.id, {
        name: nameEn.trim() || product.name,
        nameI18n: { en: nameEn.trim(), am: nameAm.trim() },
        description: descEn.trim(),
        descriptionI18n: { en: descEn.trim(), am: descAm.trim() },
        image: product.image,
        available: product.available,
        sortOrder: product.sortOrder,
        price: product.price,
        metadata: {
          ...meta,
          category,
          unit: unit.trim() || 'kg',
          minQty: dt(minQty),
          step: dt(step),
        },
      })
      we.success(`${nameEn.trim() || product.name} saved`)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const form = i.jsxs('div', {
    className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
    children: [
      localePair('Name', nameEn, nameAm, setNameEn, setNameAm, 'Shiro', 'ሽሮ'),
      i.jsxs('div', {
        className: 'space-y-2 md:col-span-2',
        children: [
          i.jsx(me, { children: 'Description' }),
          i.jsxs('div', {
            className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
            children: [
              i.jsxs('div', {
                className: 'space-y-1',
                children: [
                  i.jsx('p', {
                    className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                    children: 'EN',
                  }),
                  i.jsx(Vn, {
                    rows: 2,
                    value: descEn,
                    placeholder: 'Stone-ground chickpea flour blend…',
                    onChange: (e) => setDescEn(e.target.value),
                  }),
                ],
              }),
              i.jsxs('div', {
                className: 'space-y-1',
                children: [
                  i.jsx('p', {
                    className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                    children: 'AM',
                  }),
                  i.jsx(Vn, {
                    rows: 2,
                    value: descAm,
                    placeholder: 'የሽንኩርት አዳቦ ዱቄት…',
                    onChange: (e) => setDescAm(e.target.value),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      i.jsx(ge, {
        label: 'Slug',
        children: i.jsx(J, { value: product.slug, disabled: true }),
      }),
      i.jsx(ge, {
        label: 'Price',
        children: i.jsx(J, {
          type: 'number',
          value: product.price ?? '',
          onChange: (e) => setProduct({ ...product, price: e.target.value ? Number(e.target.value) : 0 }),
        }),
      }),
      i.jsx(ge, {
        label: 'Category',
        children: i.jsxs(Tt, {
          value: category,
          onValueChange: setCategory,
          children: [
            i.jsx(_t, { children: i.jsx(Rt, {}) }),
            i.jsx(kt, {
              children: c0.map((row) => i.jsx(ke, { value: row.value, children: row.label }, row.value)),
            }),
          ],
        }),
      }),
      i.jsx(ge, {
        label: 'Unit',
        children: i.jsx(J, { value: unit, onChange: (e) => setUnit(e.target.value) }),
      }),
      i.jsx(ge, {
        label: 'Minimum quantity',
        children: i.jsx(J, { type: 'number', step: '0.1', value: minQty, onChange: (e) => setMinQty(e.target.value) }),
      }),
      i.jsx(ge, {
        label: 'Step quantity',
        children: i.jsx(J, { type: 'number', step: '0.1', value: step, onChange: (e) => setStep(e.target.value) }),
      }),
      i.jsx('div', {
        className: 'md:col-span-2',
        children: i.jsx(Fn, {
          label: 'Product image',
          value: product.image,
          onChange: (next) => setProduct({ ...product, image: next }),
        }),
      }),
      i.jsxs('div', {
        className: 'md:col-span-2 flex items-center justify-between border-t border-border/60 pt-4',
        children: [
          i.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              i.jsx(rn, {
                checked: product.available,
                onCheckedChange: (next) => setProduct({ ...product, available: next }),
              }),
              i.jsx('span', { className: 'text-sm', children: 'Available' }),
            ],
          }),
          i.jsxs('div', {
            className: 'flex gap-2',
            children: [
              i.jsx(re, { onClick: save, disabled: saving, children: saving ? 'Saving...' : 'Save product' }),
              i.jsxs(re, {
                variant: 'destructive',
                onClick: () => onDelete(product.id),
                className: 'gap-2',
                children: [i.jsx(Zt, { className: 'h-4 w-4' }), 'Delete'],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  return embedded
    ? form
    : i.jsxs(Ke, {
        children: [
          i.jsx(Ot, {
            children: i.jsxs(Mt, {
              className: 'text-base',
              children: [
                nameEn || product.name,
                ' ',
                i.jsx('span', { className: 'text-xs text-muted-foreground', children: '(Baltina Product)' }),
              ],
            }),
          }),
          i.jsx(xt, { children: form }),
        ],
      })
}

// Drinks product editor — minify into st-hq bundle as function O5
function O5({ item: item, onDelete: onDelete, onSaved: onSaved, embedded: embedded = false }) {
  const [product, setProduct] = x.useState(item)
  const meta = product.metadata ?? {}
  const [unit, setUnit] = x.useState(String(meta.unit ?? 'L'))
  const [minQty, setMinQty] = x.useState(String(meta.minQty ?? 1))
  const [step, setStep] = x.useState(String(meta.step ?? 0.5))
  const [saving, setSaving] = x.useState(false)

  const readI18n = (row, field, lang) => {
    const map = row?.[`${field}I18n`]
    if (map && typeof map === 'object' && typeof map[lang] === 'string' && map[lang]) return map[lang]
    return lang === 'en' ? row?.[field] || '' : ''
  }

  const [nameEn, setNameEn] = x.useState(() => readI18n(item, 'name', 'en'))
  const [nameAm, setNameAm] = x.useState(() => readI18n(item, 'name', 'am'))
  const [descEn, setDescEn] = x.useState(() => readI18n(item, 'description', 'en'))
  const [descAm, setDescAm] = x.useState(() => readI18n(item, 'description', 'am'))

  x.useEffect(() => {
    setProduct(item)
    const nextMeta = item.metadata ?? {}
    setUnit(String(nextMeta.unit ?? 'L'))
    setMinQty(String(nextMeta.minQty ?? 1))
    setStep(String(nextMeta.step ?? 0.5))
    setNameEn(readI18n(item, 'name', 'en'))
    setNameAm(readI18n(item, 'name', 'am'))
    setDescEn(readI18n(item, 'description', 'en'))
    setDescAm(readI18n(item, 'description', 'am'))
  }, [item])

  const localePair = (label, enValue, amValue, onEn, onAm, enPlaceholder, amPlaceholder) =>
    i.jsxs('div', {
      className: 'space-y-2 md:col-span-2',
      children: [
        i.jsx(me, { children: label }),
        i.jsxs('div', {
          className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
          children: [
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'EN',
                }),
                i.jsx(J, { value: enValue, placeholder: enPlaceholder, onChange: (e) => onEn(e.target.value) }),
              ],
            }),
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'AM',
                }),
                i.jsx(J, { value: amValue, placeholder: amPlaceholder, onChange: (e) => onAm(e.target.value) }),
              ],
            }),
          ],
        }),
      ],
    })

  const save = async () => {
    setSaving(true)
    try {
      await An.update(product.id, {
        name: nameEn.trim() || product.name,
        nameI18n: { en: nameEn.trim(), am: nameAm.trim() },
        description: descEn.trim(),
        descriptionI18n: { en: descEn.trim(), am: descAm.trim() },
        image: product.image,
        available: product.available,
        sortOrder: product.sortOrder,
        price: product.price,
        metadata: {
          ...meta,
          category: 'drinks',
          unit: unit.trim() || 'L',
          minQty: dt(minQty),
          step: dt(step),
        },
      })
      we.success(`${nameEn.trim() || product.name} saved`)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const form = i.jsxs('div', {
    className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
    children: [
      localePair('Name', nameEn, nameAm, setNameEn, setNameAm, 'Tela', 'ተላ'),
      i.jsxs('div', {
        className: 'space-y-2 md:col-span-2',
        children: [
          i.jsx(me, { children: 'Description' }),
          i.jsxs('div', {
            className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
            children: [
              i.jsxs('div', {
                className: 'space-y-1',
                children: [
                  i.jsx('p', {
                    className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                    children: 'EN',
                  }),
                  i.jsx(Vn, {
                    rows: 2,
                    value: descEn,
                    placeholder: 'Traditional honey wine…',
                    onChange: (e) => setDescEn(e.target.value),
                  }),
                ],
              }),
              i.jsxs('div', {
                className: 'space-y-1',
                children: [
                  i.jsx('p', {
                    className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                    children: 'AM',
                  }),
                  i.jsx(Vn, {
                    rows: 2,
                    value: descAm,
                    placeholder: 'ባሕባሕ የማር ጠጅ…',
                    onChange: (e) => setDescAm(e.target.value),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      i.jsx(ge, {
        label: 'Slug',
        children: i.jsx(J, { value: product.slug, disabled: true }),
      }),
      i.jsx(ge, {
        label: 'Price',
        children: i.jsx(J, {
          type: 'number',
          value: product.price ?? '',
          onChange: (e) => setProduct({ ...product, price: e.target.value ? Number(e.target.value) : 0 }),
        }),
      }),
      i.jsx(ge, {
        label: 'Unit',
        children: i.jsx(J, { value: unit, onChange: (e) => setUnit(e.target.value) }),
      }),
      i.jsx(ge, {
        label: 'Minimum quantity',
        children: i.jsx(J, { type: 'number', step: '0.1', value: minQty, onChange: (e) => setMinQty(e.target.value) }),
      }),
      i.jsx(ge, {
        label: 'Step quantity',
        children: i.jsx(J, { type: 'number', step: '0.1', value: step, onChange: (e) => setStep(e.target.value) }),
      }),
      i.jsx('div', {
        className: 'md:col-span-2',
        children: i.jsx(Fn, {
          label: 'Product image',
          value: product.image,
          onChange: (next) => setProduct({ ...product, image: next }),
        }),
      }),
      i.jsxs('div', {
        className: 'md:col-span-2 flex items-center justify-between border-t border-border/60 pt-4',
        children: [
          i.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              i.jsx(rn, {
                checked: product.available,
                onCheckedChange: (next) => setProduct({ ...product, available: next }),
              }),
              i.jsx('span', { className: 'text-sm', children: 'Available' }),
            ],
          }),
          i.jsxs('div', {
            className: 'flex gap-2',
            children: [
              i.jsx(re, { onClick: save, disabled: saving, children: saving ? 'Saving...' : 'Save product' }),
              i.jsxs(re, {
                variant: 'destructive',
                onClick: () => onDelete(product.id),
                className: 'gap-2',
                children: [i.jsx(Zt, { className: 'h-4 w-4' }), 'Delete'],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  return embedded
    ? form
    : i.jsxs(Ke, {
        children: [
          i.jsx(Ot, {
            children: i.jsxs(Mt, {
              className: 'text-base',
              children: [
                nameEn || product.name,
                ' ',
                i.jsx('span', { className: 'text-xs text-muted-foreground', children: '(Drinks Product)' }),
              ],
            }),
          }),
          i.jsx(xt, { children: form }),
        ],
      })
}
