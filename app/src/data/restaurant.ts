import type { Category, RestaurantInfo } from '@/types'

export const CURRENCY = 'ETB'

export const restaurant: RestaurantInfo = {
  name: 'Senay Tela',
  tagline: 'Authentic Ethiopian flavors, brewed and served with tradition.',
  phone: '+251 91 234 5678',
  email: 'hello@senaytela.com',
  address: 'Bole Medhanialem, Addis Ababa, Ethiopia',
  mapUrl:
    'https://www.google.com/maps?q=Bole+Medhanialem+Addis+Ababa&output=embed',
  openingHours: [
    { day: 'Monday – Thursday', hours: '11:00 AM – 10:00 PM' },
    { day: 'Friday – Saturday', hours: '11:00 AM – 12:00 AM' },
    { day: 'Sunday', hours: '12:00 PM – 9:00 PM' },
  ],
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'TikTok', href: 'https://tiktok.com' },
    { label: 'YouTube', href: 'https://youtube.com' },
  ],
  bankAccount: {
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    accountName: 'Senay Tela Restaurant PLC',
    accountNumber: '1000 1234 5678 90',
  },
}

export const categories: Category[] = [
  {
    slug: 'food',
    name: 'Traditional Dishes',
    description: 'Slow-cooked stews and injera served the Ethiopian way.',
  },
  {
    slug: 'drinks',
    name: 'Tela & Tej',
    description: 'House-brewed tela and golden honey wine, made in clay.',
  },
  {
    slug: 'products',
    name: 'Take-Home Products',
    description: 'Stone-ground shiro and hand-blended berbere by the kilo.',
  },
]
