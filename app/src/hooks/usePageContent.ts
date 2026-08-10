import { useEffect, useState } from 'react'
import {
  getPageContent,
  type PageHeroContent,
} from '@/services/contentService'
import { getPage } from '@/services/dynamicContentService'
import { useLanguage } from '@/hooks/useLanguage'

const defaults: Record<string, PageHeroContent> = {
  agelgil: {
    eyebrow: 'Agelgil',
    title: 'Traditional Agelgil Sets',
    description:
      'Beautiful woven baskets filled with slow-cooked stews, fresh injera, and sides.',
  },
  baltina: {
    eyebrow: 'Baltina',
    title: 'House-made pantry essentials',
    description:
      'Browse our stone-ground flours, spice blends, and traditional mixes.',
  },
  festival: {
    eyebrow: 'Festival',
    title: 'Celebration packages for every feast',
    description:
      'Predefined holiday packages — from Grand to Basic — so you can compare what’s included and order with confidence.',
  },
  drinks: {
    eyebrow: 'Traditional Drinks',
    title: 'House-brewed tela & tej',
    description:
      'Order our traditional drinks brewed in-house the authentic way.',
  },
  catering: {
    eyebrow: 'Catering',
    title: 'Catering for every celebration',
    description:
      'Fasting and non-fasting packages with beverage options — priced per guest.',
  },
  blog: {
    eyebrow: 'Blog',
    title: 'Stories from the kitchen',
    description: 'Tradition, brewing, and the food that brings us together.',
  },
  about: {
    eyebrow: 'About Us',
    title: 'The story of Senay Tela',
    description:
      'A family kitchen keeping Ethiopian tradition alive — one stew, one ceremony, one celebration at a time.',
  },
  contact: {
    eyebrow: 'Contact',
    title: "We'd love to hear from you",
    description:
      'Questions, reservations or feedback — reach out and our team will get back to you.',
  },
}

export function usePageContent(page: string) {
  const { locale } = useLanguage()
  const pageDefaults = locale === 'am' ? {} : (defaults[page] ?? {})
  const [content, setContent] = useState<PageHeroContent>(pageDefaults)

  useEffect(() => {
    Promise.all([getPageContent(page), getPage(page)])
      .then(([siteSettingPage, cmsPage]) => {
        const cmsBlocks = cmsPage?.blocks ?? []
        const blockContent = cmsBlocks.reduce((acc, block) => {
          return { ...acc, ...block.content }
        }, {})
        const fallback = locale === 'am' ? undefined : defaults[page]
        setContent({
          ...pageDefaults,
          ...siteSettingPage,
          ...blockContent,
          title: cmsPage?.title || siteSettingPage.title || fallback?.title,
          description:
            cmsPage?.description || siteSettingPage.description || fallback?.description,
          eyebrow: siteSettingPage.eyebrow || fallback?.eyebrow,
        })
      })
      .catch(() => {
        getPageContent(page).then((data) => {
          setContent({ ...pageDefaults, ...data })
        })
      })
  }, [page, locale])

  return content
}
