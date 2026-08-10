export type Branch = {
  id: string
  name: string
  area: string
  image?: string
  mapUrl: string
}

export const branches: Branch[] = [
  {
    id: 'lebu',
    name: 'Lebu Muzika Sefer',
    area: 'Lebu · Addis Ababa',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Lebu+Muzika+Sefer+Addis+Ababa',
  },
  {
    id: 'figa',
    name: 'Figa Mebrat Summit Road',
    area: 'Summit · Addis Ababa',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Figa+Mebrat+Summit+Road+Addis+Ababa',
  },
  {
    id: 'jemo',
    name: 'Jemo 1 Condominium',
    area: 'Jemo · Addis Ababa',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Jemo+1+Condominium+Addis+Ababa',
  },
]
