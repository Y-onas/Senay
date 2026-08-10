export const primaryNavLinks = [
  { label: 'Home', to: '/' },
  { label: 'Agelgil', to: '/agelgil' },
  { label: 'Baltina', to: '/baltina' },
  { label: 'Festival', to: '/festival-package' },
  { label: 'Drinks', to: '/traditional-drinks' },
  { label: 'Catering', to: '/catering' },
  { label: 'Blog', to: '/blog' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
] as const

export type OfferingSlug = 'agelgil' | 'baltina' | 'festival-package' | 'traditional-drinks'

export const offeringPages: Record<
  OfferingSlug,
  { eyebrow: string; title: string; description: string; body: string }
> = {
  agelgil: {
    eyebrow: 'Agelgil',
    title: 'Traditional Agelgil Sets',
    description:
      'Beautiful woven baskets filled with slow-cooked stews, fresh injera, and sides — ready to share at home or at your table.',
    body:
      'Our agelgil sets bring the full mesob experience to your door. Choose from family sizes with doro wat, tibs, shiro, and seasonal vegetable sides — all packed fresh and served the traditional way.',
  },
  baltina: {
    eyebrow: 'Baltina',
    title: 'House-Made Baltina',
    description:
      'Stone-ground spices and pantry essentials crafted in small batches for authentic Ethiopian cooking at home.',
    body:
      'From berbere and shiro to specialty blends, our baltina line is prepared with the same care as our kitchen — perfect for home cooks who want true Ethiopian flavour.',
  },
  'festival-package': {
    eyebrow: 'Festival',
    title: 'Festival & Celebration Packages',
    description:
      'Curated feasts for holidays, weddings, and gatherings — mesob spreads, drinks, and coffee ceremony add-ons.',
    body:
      'Tell us your guest count and occasion. We assemble a generous festival package with injera, stews, drinks, and optional live coffee service so your celebration feels complete.',
  },
  'traditional-drinks': {
    eyebrow: 'Drinks',
    title: 'Clay-Brewed Tela & Tej',
    description:
      'House-fermented tela and tej, brewed by our team and served from the clay pot — smoky, golden, and unmistakably Ethiopian.',
    body:
      'Order by the bottle or berele for pickup and delivery across Addis Ababa. Every batch is brewed in-house — never bought, always fresh.',
  },
}
