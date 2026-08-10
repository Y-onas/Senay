import type { BlogPost } from '@/types'

/**
 * Blog content. Shaped like a Blog API response; the detail page looks posts
 * up by `slug`.
 */
export const blogPosts: BlogPost[] = [
  {
    id: 'blog-tela',
    slug: 'the-craft-of-tela',
    title: 'The Craft of Tela: Ethiopia in a Clay Pot',
    excerpt:
      'How our brewers turn roasted barley, gesho and patience into the smoky, refreshing drink at the heart of every Ethiopian celebration.',
    content: [
      'Tela is more than a drink — it is a ritual. For generations, Ethiopian households have brewed this gently fermented barley beverage to mark weddings, holidays and the simple joy of gathering.',
      'At Senay Tela, we honour the old method. Barley and corn are roasted until smoky, then layered with gesho, a native buckthorn that lends tela its signature bitterness and natural fermentation.',
      'The mixture rests in clay pots for days, breathing slowly. Clay matters: it keeps the brew cool and lets it develop the earthy depth you simply cannot get from steel or glass.',
      'When you pour a glass of our house tela, you are tasting a process that refuses to be hurried — and that is exactly the point.',
    ],
    author: 'Senay Tela Kitchen',
    date: 'Jun 10, 2026',
    readTime: '5 min',
    tags: ['Tradition', 'Drinks'],
  },
  {
    id: 'blog-berbere',
    slug: 'berbere-the-soul-of-the-stew',
    title: 'Berbere: The Soul of Every Ethiopian Stew',
    excerpt:
      'A look inside the twelve-spice blend that gives doro wat its fire and our kitchen its identity.',
    content: [
      'Ask any Ethiopian cook for the secret to a great wat and the answer is always the same: the berbere.',
      'Our blend begins with sun-dried chillies, slowly toasted to coax out sweetness before the heat. To these we add cardamom, fenugreek, coriander, cloves and a handful of spices we keep to ourselves.',
      'Berbere is not just about heat — it is about balance. Layered, aromatic and deeply red, it transforms humble lentils and chicken into something unforgettable.',
      'We grind ours in small batches every week so that what reaches your plate — or your pantry — is always at its most vivid.',
    ],
    author: 'Chef Almaz',
    date: 'May 28, 2026',
    readTime: '4 min',
    tags: ['Spices', 'Cooking'],
  },
  {
    id: 'blog-coffee',
    slug: 'inside-the-coffee-ceremony',
    title: 'Inside the Ethiopian Coffee Ceremony',
    excerpt:
      'Three rounds, fresh roasted beans and a whole lot of meaning — why buna is the original slow ritual.',
    content: [
      'Coffee was born in Ethiopia, and nowhere is it treated with more reverence than in the traditional ceremony.',
      'Green beans are roasted over coals in front of guests, their aroma carried through the room. They are ground by hand and brewed in a jebena, a rounded clay pot poured from a height into small handleless cups.',
      'The ceremony unfolds over three rounds — abol, tona and baraka — each one a little lighter, each one an invitation to stay a while longer.',
      'When you visit Senay Tela, ask for the ceremony. It is the warmest welcome we know how to give.',
    ],
    author: 'Senay Tela Kitchen',
    date: 'May 12, 2026',
    readTime: '6 min',
    tags: ['Coffee', 'Culture'],
  },
]
