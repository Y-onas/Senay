// Validated source for why choose us editor — minify into admin bundle as function w7
function w7({ section: n, onSave: l }) {
  const [r, o] = x.useState(n)

  const isLocalized = (value) =>
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('en' in value || 'am' in value)

  const normalizeField = (value) => {
    if (isLocalized(value)) return { en: value.en ?? '', am: value.am ?? '' }
    if (typeof value === 'string') return { en: value, am: '' }
    return { en: '', am: '' }
  }

  const emptyFeature = () => ({
    title: { en: '', am: '' },
    description: { en: '', am: '' },
  })

  const normalizeFeature = (feature) => ({
    ...emptyFeature(),
    ...feature,
    title: normalizeField(feature?.title),
    description: normalizeField(feature?.description),
  })

  const normalizeContent = (content) => {
    const raw = content ?? {}
    const list = Array.isArray(raw.features) ? raw.features : []
    return {
      ...raw,
      eyebrow: normalizeField(raw.eyebrow),
      title: normalizeField(raw.title),
      description: normalizeField(raw.description),
      features: Array.from({ length: 4 }, (_, index) => normalizeFeature(list[index] ?? {})),
    }
  }

  const [u, f] = x.useState(() => normalizeContent(n.content))

  x.useEffect(() => {
    o(n)
    f(normalizeContent(n.content))
  }, [n])

  const readLocale = (value, lang) => {
    if (typeof value === 'string') return lang === 'en' ? value : ''
    if (!isLocalized(value)) return ''
    return typeof value[lang] === 'string' ? value[lang] : ''
  }

  const writeLocale = (value, lang, text) => {
    const base = normalizeField(value)
    return { ...base, [lang]: text }
  }

  const ensureLocalized = (value) => ({
    en: readLocale(value, 'en'),
    am: readLocale(value, 'am'),
  })

  const features = Array.isArray(u.features) ? u.features : []

  const setField = (key, lang, text) => {
    f((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setFeatureField = (index, key, lang, text) => {
    f((prev) => {
      const list = Array.isArray(prev.features) ? [...prev.features] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, features: list }
    })
  }

  const save = () => {
    const next = {
      ...u,
      eyebrow: ensureLocalized(u.eyebrow),
      title: ensureLocalized(u.title),
      description: ensureLocalized(u.description),
      features: (Array.isArray(u.features) ? u.features : []).map((feature) => ({
        ...feature,
        title: ensureLocalized(feature.title),
        description: ensureLocalized(feature.description),
      })),
    }
    f(next)
    l(r, next)
  }

  const localeInputPair = (label, valueEn, valueAm, onEn, onAm, placeholderEn, placeholderAm) =>
    i.jsxs('div', {
      className: 'space-y-2',
      children: [
        i.jsx(me, { children: label }),
        i.jsxs('div', {
          className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
          children: [
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className:
                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'EN',
                }),
                i.jsx(J, {
                  value: valueEn,
                  placeholder: placeholderEn,
                  onChange: (event) => onEn(event.target.value),
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className:
                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'AM',
                }),
                i.jsx(J, {
                  value: valueAm,
                  placeholder: placeholderAm,
                  onChange: (event) => onAm(event.target.value),
                }),
              ],
            }),
          ],
        }),
      ],
    })

  return i.jsxs(Ke, {
    children: [
      i.jsx(Ot, {
        children: i.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            i.jsxs('div', {
              children: [
                i.jsx(Mt, { className: 'text-base', children: 'Why Choose Us' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'Section heading and four feature cards.',
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                i.jsx(rn, {
                  checked: r.enabled,
                  onCheckedChange: (value) => o((prev) => ({ ...prev, enabled: value })),
                }),
                i.jsxs(re, {
                  size: 'sm',
                  onClick: save,
                  children: [i.jsx(ha, { className: 'w-4 h-4 mr-2' }), 'Save section'],
                }),
              ],
            }),
          ],
        }),
      }),
      i.jsxs(xt, {
        className: 'space-y-6',
        children: [
          i.jsxs('div', {
            className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
            children: [
              localeInputPair(
                'Eyebrow',
                readLocale(u.eyebrow, 'en'),
                readLocale(u.eyebrow, 'am'),
                (text) => setField('eyebrow', 'en', text),
                (text) => setField('eyebrow', 'am', text),
                'Why Choose Us',
                'ለምን እኛን',
              ),
              localeInputPair(
                'Title',
                readLocale(u.title, 'en'),
                readLocale(u.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                'Experience the Difference',
                'ልዩነቱን ይሞክሩ',
              ),
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
                            className:
                              'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'EN',
                          }),
                          i.jsx(Vn, {
                            value: readLocale(u.description, 'en'),
                            placeholder:
                              'We combine traditional recipes, house-brewed drinks and warm hospitality to deliver an unforgettable Ethiopian dining experience.',
                            onChange: (event) =>
                              setField('description', 'en', event.target.value),
                            rows: 3,
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          i.jsx('p', {
                            className:
                              'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'AM',
                          }),
                          i.jsx(Vn, {
                            value: readLocale(u.description, 'am'),
                            placeholder:
                              'ባህላዊ рецепቶችን፣ በቤት የተጠመቁ መጠጦችን እና ሞቅ ያለ አገልግሎትን በማዋሀድ ማይረሱ የሚቀር የኢትዮጵያ መመገቢያ تجربት እናቀርባለን።',
                            onChange: (event) =>
                              setField('description', 'am', event.target.value),
                            rows: 3,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          i.jsx(me, { className: 'text-base', children: 'Feature cards' }),
          features.map((feature, index) =>
            i.jsx(
              Ke,
              {
                className: 'p-4',
                children: i.jsxs('div', {
                  className: 'space-y-3',
                  children: [
                    i.jsxs(Mt, {
                      className: 'text-sm',
                      children: ['Card ', index + 1],
                    }),
                    localeInputPair(
                      'Title',
                      readLocale(feature.title, 'en'),
                      readLocale(feature.title, 'am'),
                      (text) => setFeatureField(index, 'title', 'en', text),
                      (text) => setFeatureField(index, 'title', 'am', text),
                      index === 0
                        ? 'In-House Brewing'
                        : index === 1
                          ? 'Fresh Ingredients'
                          : index === 2
                            ? 'Generous Hospitality'
                            : 'Vegan Friendly',
                      index === 0
                        ? 'በቤት ውስጥ መጠመር'
                        : index === 1
                          ? 'Fresh Ingredients'
                          : index === 2
                            ? 'Generous Hospitality'
                            : 'Vegan Friendly',
                    ),
                    i.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        i.jsx(me, { children: 'Description' }),
                        i.jsxs('div', {
                          className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
                          children: [
                            i.jsxs('div', {
                              className: 'space-y-1',
                              children: [
                                i.jsx('p', {
                                  className:
                                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                                  children: 'EN',
                                }),
                                i.jsx(Vn, {
                                  value: readLocale(feature.description, 'en'),
                                  placeholder:
                                    index === 0
                                      ? 'Tela and tej fermented in clay pots by our own brewers.'
                                      : index === 1
                                        ? 'Stone-ground spices and produce sourced daily.'
                                        : index === 2
                                          ? 'You are welcomed as family, every single visit.'
                                          : 'Full fasting and vegan options available year-round.',
                                  onChange: (event) =>
                                    setFeatureField(
                                      index,
                                      'description',
                                      'en',
                                      event.target.value,
                                    ),
                                  rows: 2,
                                }),
                              ],
                            }),
                            i.jsxs('div', {
                              className: 'space-y-1',
                              children: [
                                i.jsx('p', {
                                  className:
                                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                                  children: 'AM',
                                }),
                                i.jsx(Vn, {
                                  value: readLocale(feature.description, 'am'),
                                  placeholder: '',
                                  onChange: (event) =>
                                    setFeatureField(
                                      index,
                                      'description',
                                      'am',
                                      event.target.value,
                                    ),
                                  rows: 2,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              },
              index,
            ),
          ),
        ],
      }),
    ],
  })
}
