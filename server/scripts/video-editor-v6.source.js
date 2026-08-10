// Validated source for video banner editor — minify into admin bundle as function v6
function v6({ section: n, onSave: l }) {
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
      url: typeof raw.url === 'string' ? raw.url : '/images/chef-video.mp4',
      title: normalizeField(raw.title),
      subtitle: normalizeField(raw.subtitle),
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
      url: u.url || '/images/chef-video.mp4',
      title: ensureLocalized(u.title),
      subtitle: ensureLocalized(u.subtitle),
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
                i.jsx(Mt, { className: 'text-base', children: 'Video Banner' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'Upload a video file and edit the overlay text.',
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
          i.jsx(j6, {
            label: 'Video file',
            value: u.url || '',
            onChange: (value) =>
              f((prev) => ({ ...prev, url: value || '/images/chef-video.mp4' })),
            hint: 'Upload MP4, WEBM or MOV (max 100MB). The current chef video stays until you upload a new one.',
          }),
          localeInputPair(
            'Overlay title',
            readLocale(u.title, 'en'),
            readLocale(u.title, 'am'),
            (text) => setField('title', 'en', text),
            (text) => setField('title', 'am', text),
            'Cooked with care',
            'በጥንቃቄ የተቀመመ',
          ),
          i.jsxs('div', {
            className: 'space-y-2',
            children: [
              i.jsx(me, { children: 'Overlay subtitle' }),
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
                        value: readLocale(u.subtitle, 'en'),
                        placeholder: 'Every dish, the traditional way.',
                        onChange: (event) =>
                          setField('subtitle', 'en', event.target.value),
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
                        value: readLocale(u.subtitle, 'am'),
                        placeholder: 'እያንዳንዱ ምግብ፣ በባህላዊ መንገድ።',
                        onChange: (event) =>
                          setField('subtitle', 'am', event.target.value),
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
    ],
  })
}
