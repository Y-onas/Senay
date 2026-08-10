// Validated source for special offers editor — minify into admin bundle as function o6
function o6({ section: n, onSave: l }) {
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

  const normalizeContent = (content) => {
    const raw = content ?? {}
    return {
      ...raw,
      eyebrow: normalizeField(raw.eyebrow),
      title: normalizeField(raw.title),
      description: normalizeField(raw.description),
      cards: (Array.isArray(raw.cards) ? raw.cards : []).map((card) => ({
        ...card,
        label: normalizeField(card.label),
        title: normalizeField(card.title),
        subtitle: normalizeField(card.subtitle),
        linkText: normalizeField(card.linkText),
      })),
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

  const cards = Array.isArray(u.cards) ? u.cards : []

  const setField = (key, lang, text) => {
    f((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setCardField = (index, key, lang, text) => {
    f((prev) => {
      const list = Array.isArray(prev.cards) ? [...prev.cards] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, cards: list }
    })
  }

  const setCardPatch = (index, patch) => {
    f((prev) => {
      const list = Array.isArray(prev.cards) ? [...prev.cards] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, ...patch }
      return { ...prev, cards: list }
    })
  }

  const addCard = () => {
    f((prev) => ({
      ...prev,
      cards: [
        ...(Array.isArray(prev.cards) ? prev.cards : []),
        {
          id: `offer-${Date.now()}`,
          label: { en: '', am: '' },
          title: { en: 'New offer', am: '' },
          subtitle: { en: '', am: '' },
          image: '',
          link: '/',
          linkText: { en: 'Order Now', am: '' },
          variant: 'yellow',
          tall: false,
        },
      ],
    }))
  }

  const removeCard = (index) => {
    f((prev) => ({
      ...prev,
      cards: (Array.isArray(prev.cards) ? prev.cards : []).filter((_, i) => i !== index),
    }))
  }

  const save = () => {
    const next = {
      ...u,
      eyebrow: ensureLocalized(u.eyebrow),
      title: ensureLocalized(u.title),
      description: ensureLocalized(u.description),
      cards: (Array.isArray(u.cards) ? u.cards : []).map((card) => ({
        ...card,
        label: ensureLocalized(card.label),
        title: ensureLocalized(card.title),
        subtitle: ensureLocalized(card.subtitle),
        linkText: ensureLocalized(card.linkText),
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
                i.jsx(Mt, { className: 'text-base', children: 'Special Offers' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'Three promo cards with images, button text and links.',
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
                'Special Offers',
                'ልዩ ቅናሾች',
              ),
              localeInputPair(
                'Title',
                readLocale(u.title, 'en'),
                readLocale(u.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                "Traditional Deals You Can't Miss",
                'አያመልጡም የሚገኙ ባህላዊ ቅናሾች',
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
                              'Enjoy your favourite Ethiopian dishes and house-brewed drinks at unbeatable prices.',
                            onChange: (event) =>
                              setField('description', 'en', event.target.value),
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
                            value: readLocale(u.description, 'am'),
                            placeholder:
                              'የሚወዷቸውን የኢትዮጵያ ምግቦች እና ቤት ውስጥ የተጠመቁ መጠጦች በማይተካ ዋጋ ይደሰቱ።',
                            onChange: (event) =>
                              setField('description', 'am', event.target.value),
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
          i.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              i.jsx(me, { className: 'text-base', children: 'Offer cards' }),
              i.jsxs(re, {
                size: 'sm',
                variant: 'outline',
                onClick: addCard,
                children: [i.jsx(Qt, { className: 'w-4 h-4 mr-1' }), 'Add card'],
              }),
            ],
          }),
          cards.map((card, index) =>
            i.jsx(
              Ke,
              {
                className: 'p-4',
                children: i.jsxs('div', {
                  className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                  children: [
                    i.jsxs('div', {
                      className: 'space-y-3',
                      children: [
                        localeInputPair(
                          'Label (optional)',
                          readLocale(card.label, 'en'),
                          readLocale(card.label, 'am'),
                          (text) => setCardField(index, 'label', 'en', text),
                          (text) => setCardField(index, 'label', 'am', text),
                          'House Brew',
                          'ቤት መጠጥ',
                        ),
                        localeInputPair(
                          'Title',
                          readLocale(card.title, 'en'),
                          readLocale(card.title, 'am'),
                          (text) => setCardField(index, 'title', 'en', text),
                          (text) => setCardField(index, 'title', 'am', text),
                          'Brewed Tela & Tej',
                          'የተጠመቁ ቴላ እና ጠጅ',
                        ),
                        localeInputPair(
                          'Subtitle (optional)',
                          readLocale(card.subtitle, 'en'),
                          readLocale(card.subtitle, 'am'),
                          (text) => setCardField(index, 'subtitle', 'en', text),
                          (text) => setCardField(index, 'subtitle', 'am', text),
                          'Shared. Generous. Joyful.',
                          'የሚጋራ። ለጋስ። ደስተኛ።',
                        ),
                        localeInputPair(
                          'Button text',
                          readLocale(card.linkText, 'en'),
                          readLocale(card.linkText, 'am'),
                          (text) => setCardField(index, 'linkText', 'en', text),
                          (text) => setCardField(index, 'linkText', 'am', text),
                          'Order Now',
                          'አሁን ይዘዙ',
                        ),
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsx(me, { children: 'Button link' }),
                            i.jsx(J, {
                              value: card.link || '',
                              placeholder: '/traditional-drinks',
                              onChange: (event) =>
                                setCardPatch(index, { link: event.target.value }),
                            }),
                          ],
                        }),
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsx(me, {
                              children: 'Style (yellow, green, burgundy)',
                            }),
                            i.jsx(J, {
                              value: card.variant || 'yellow',
                              onChange: (event) =>
                                setCardPatch(index, { variant: event.target.value }),
                            }),
                          ],
                        }),
                        i.jsxs('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            i.jsx(rn, {
                              checked: !!card.tall,
                              onCheckedChange: (value) => setCardPatch(index, { tall: value }),
                            }),
                            i.jsx(me, { children: 'Tall card (right column)' }),
                          ],
                        }),
                        i.jsx(re, {
                          size: 'sm',
                          variant: 'ghost',
                          onClick: () => removeCard(index),
                          children: i.jsx(Zt, { className: 'w-4 h-4 text-destructive' }),
                        }),
                      ],
                    }),
                    i.jsx(Fn, {
                      label: 'Background image',
                      value: card.image || '',
                      onChange: (value) => setCardPatch(index, { image: value }),
                      aspect: card.tall ? 'video' : 'wide',
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
