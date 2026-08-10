// Validated source for about preview editor — minify into admin bundle as function s6
function s6({ section: n, onSave: l }) {
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
      buttonText: normalizeField(raw.buttonText),
      buttonLink: typeof raw.buttonLink === 'string' ? raw.buttonLink : '/about',
      image: typeof raw.image === 'string' ? raw.image : '',
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

  const setField = (key, lang, text) => {
    f((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const save = () => {
    const next = {
      ...u,
      eyebrow: ensureLocalized(u.eyebrow),
      title: ensureLocalized(u.title),
      description: ensureLocalized(u.description),
      buttonText: ensureLocalized(u.buttonText),
      buttonLink: u.buttonLink || '/about',
      image: u.image || '',
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
                i.jsx(Mt, { className: 'text-base', children: 'About Preview' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'Homepage about block — image, title and description.',
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
                'Our Story',
                'ታሪካችን',
              ),
              localeInputPair(
                'Title',
                readLocale(u.title, 'en'),
                readLocale(u.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                'A kitchen built on tradition',
                'በባህል የተገነባ ወጥ ቤት',
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
                            placeholder: 'The story of Senay Tela.',
                            onChange: (event) =>
                              setField('description', 'en', event.target.value),
                            rows: 4,
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
                            placeholder: 'የሰናይ ቴላ ታሪክ።',
                            onChange: (event) =>
                              setField('description', 'am', event.target.value),
                            rows: 4,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              localeInputPair(
                'Button text',
                readLocale(u.buttonText, 'en'),
                readLocale(u.buttonText, 'am'),
                (text) => setField('buttonText', 'en', text),
                (text) => setField('buttonText', 'am', text),
                'More About Us',
                'ተጨማሪ ስለ እኛ',
              ),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'Button link' }),
                  i.jsx(J, {
                    value: u.buttonLink || '',
                    placeholder: '/about',
                    onChange: (event) =>
                      f((prev) => ({ ...prev, buttonLink: event.target.value })),
                  }),
                ],
              }),
            ],
          }),
          i.jsx(Fn, {
            label: 'Preview image',
            value: u.image || '',
            onChange: (value) => f((prev) => ({ ...prev, image: value })),
            aspect: 'video',
            hint: 'Shown in the arch frame on the homepage.',
          }),
        ],
      }),
    ],
  })
}
