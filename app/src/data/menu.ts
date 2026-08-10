import type { MenuItem } from '@/types'

/**
 * Digital menu catalogue. Structured exactly like a Menu API response so it
 * can be swapped for a live fetch later (see `src/services/menuService.ts`).
 */
export const menuItems: MenuItem[] = [
  // ----- Traditional Dishes -----
  {
    id: 'doro-wat',
    name: 'Doro Wat',
    description:
      'Slow-simmered chicken in a rich berbere sauce with hard-boiled egg, served on injera.',
    price: 380,
    category: 'food',
    tags: ['Signature', 'Spicy'],
    spicy: true,
    featured: true,
  },
  {
    id: 'beyaynetu',
    name: 'Beyaynetu',
    description:
      'A colourful fasting platter of lentils, split peas, greens and vegetables — fully vegan.',
    price: 320,
    category: 'food',
    tags: ['Vegan', 'Fasting'],
    vegetarian: true,
    featured: true,
  },
  {
    id: 'tibs',
    name: 'Tibs',
    description:
      'Sautéed beef tossed with onion, rosemary, jalapeño and clarified niter kibbeh butter.',
    price: 420,
    category: 'food',
    tags: ['Grill'],
  },
  {
    id: 'kitfo',
    name: 'Kitfo',
    description:
      'Minced lean beef seasoned with mitmita and herbed butter, served warm (leb leb) or raw.',
    price: 450,
    category: 'food',
    tags: ['Signature'],
    spicy: true,
  },
  {
    id: 'shiro-wat',
    name: 'Shiro Wat',
    description:
      'Creamy stone-ground chickpea stew gently spiced with garlic and berbere.',
    price: 220,
    category: 'food',
    tags: ['Vegan', 'Comfort'],
    vegetarian: true,
  },
  {
    id: 'gomen-besiga',
    name: 'Gomen Besiga',
    description: 'Tender collard greens braised with seasoned beef and warm spices.',
    price: 360,
    category: 'food',
  },

  // ----- Tela & Tej -----
  {
    id: 'tela-house',
    name: 'House Tela',
    description:
      'Our traditional fermented barley brew, smoky and refreshing, served from the clay pot.',
    image: '/images/senay-tela.png',
    price: 120,
    category: 'drinks',
    tags: ['House Brew'],
    featured: true,
  },
  {
    id: 'tej-classic',
    name: 'Classic Tej',
    description:
      'Golden honey wine aged with gesho — smooth, floral and lightly sparkling.',
    image: '/images/senay-tej.png',
    price: 180,
    category: 'drinks',
    tags: ['Honey Wine'],
    featured: true,
  },
  {
    id: 'tej-dry',
    name: 'Dry Tej',
    description: 'A less-sweet, more robust honey wine for the seasoned palate.',
    image: '/images/senay-tej.png',
    price: 190,
    category: 'drinks',
  },
  {
    id: 'spiced-coffee',
    name: 'Buna (Ceremony Coffee)',
    description:
      'Freshly roasted and brewed in a jebena, served with the full coffee ceremony.',
    image: '/images/senay-tela.png',
    price: 90,
    category: 'drinks',
    tags: ['Ceremony'],
  },

  // ----- Take-Home Products -----
  {
    id: 'shiro-powder',
    name: 'Shiro Powder',
    description: 'Stone-ground chickpea & spice blend, ready to simmer at home.',
    image: '/images/senay-shiro.png',
    price: 350,
    category: 'products',
    tags: ['Pantry'],
  },
  {
    id: 'berbere-blend',
    name: 'Berbere Spice',
    description: 'Our house berbere — sun-dried chillies hand-blended with 12 spices.',
    image: '/images/senay-berbere.png',
    price: 400,
    category: 'products',
    tags: ['Pantry', 'Spicy'],
    spicy: true,
  },
]
