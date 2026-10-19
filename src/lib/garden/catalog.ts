// What can be bought for a garden. Prices assume roughly 8–10 coins a day.

export type Category = 'bitki' | 'dekor' | 'canli'

export interface Stage {
  emoji: string
  name: string
}

export interface CatalogItem {
  type: string
  category: Category
  price: number
  /** Growth stages; an item with a single stage can't be grown. */
  stages: Stage[]
}

export const CATEGORIES: { id: Category; name: string }[] = [
  { id: 'bitki', name: 'Bitkiler' },
  { id: 'dekor', name: 'Dekor' },
  { id: 'canli', name: 'Canlılar' },
]

export const CATALOG: CatalogItem[] = [
  { type: 'fide', category: 'bitki', price: 5, stages: [{ emoji: '🌱', name: 'Fide' }, { emoji: '🌿', name: 'Filiz' }, { emoji: '🪴', name: 'Saksı bitkisi' }] },
  { type: 'lale', category: 'bitki', price: 8, stages: [{ emoji: '🌱', name: 'Lale soğanı' }, { emoji: '🌷', name: 'Lale' }] },
  { type: 'aycicegi', category: 'bitki', price: 10, stages: [{ emoji: '🌱', name: 'Ayçiçeği filizi' }, { emoji: '🌻', name: 'Ayçiçeği' }] },
  { type: 'gul', category: 'bitki', price: 15, stages: [{ emoji: '🌱', name: 'Gül fidanı' }, { emoji: '🥀', name: 'Gül goncası' }, { emoji: '🌹', name: 'Gül' }] },
  { type: 'agac', category: 'bitki', price: 20, stages: [{ emoji: '🌱', name: 'Fidan' }, { emoji: '🌳', name: 'Ağaç' }, { emoji: '🌲', name: 'Ulu çam' }] },
  { type: 'kiraz', category: 'bitki', price: 40, stages: [{ emoji: '🌱', name: 'Kiraz fidanı' }, { emoji: '🌳', name: 'Genç kiraz' }, { emoji: '🌸', name: 'Çiçekli kiraz' }] },
  { type: 'kaktus', category: 'bitki', price: 12, stages: [{ emoji: '🌵', name: 'Kaktüs' }] },
  { type: 'tas', category: 'dekor', price: 4, stages: [{ emoji: '🪨', name: 'Taş' }] },
  { type: 'kutuk', category: 'dekor', price: 6, stages: [{ emoji: '🪵', name: 'Kütük' }] },
  { type: 'fener', category: 'dekor', price: 18, stages: [{ emoji: '🏮', name: 'Fener' }] },
  { type: 'bank', category: 'dekor', price: 25, stages: [{ emoji: '🪑', name: 'Bank' }] },
  { type: 'havuz', category: 'dekor', price: 80, stages: [{ emoji: '⛲', name: 'Süs havuzu' }] },
  { type: 'kulube', category: 'dekor', price: 150, stages: [{ emoji: '🛖', name: 'Kulübe' }, { emoji: '🏡', name: 'Bahçe evi' }] },
  { type: 'ari', category: 'canli', price: 15, stages: [{ emoji: '🐝', name: 'Arı' }] },
  { type: 'kelebek', category: 'canli', price: 15, stages: [{ emoji: '🦋', name: 'Kelebek' }] },
  { type: 'kus', category: 'canli', price: 30, stages: [{ emoji: '🐣', name: 'Yavru kuş' }, { emoji: '🐦', name: 'Kuş' }] },
  { type: 'kirpi', category: 'canli', price: 45, stages: [{ emoji: '🦔', name: 'Kirpi' }] },
  { type: 'kedi', category: 'canli', price: 100, stages: [{ emoji: '🐈', name: 'Kedi' }] },
]

export const itemOf = (type: string) => CATALOG.find((c) => c.type === type)

/** The stage shown for an item at a given level (levels start at 1). */
export const stageOf = (type: string, level: number): Stage => {
  const stages = itemOf(type)?.stages ?? [{ emoji: '❔', name: 'Bilinmeyen' }]
  return stages[Math.min(level, stages.length) - 1]
}

/** Cost to grow from `level` to the next stage; null when fully grown. */
export function growCost(type: string, level: number) {
  const item = itemOf(type)
  if (!item || level >= item.stages.length) return null
  return item.price * level
}

/** Plot sizes, smallest first, and what it costs to reach each one after the first. */
export const LAND_SIZES = [4, 5, 6, 7]
export const LAND_COSTS = [0, 100, 200, 400]
export const landSize = (level: number) => LAND_SIZES[Math.min(Math.max(level, 1), LAND_SIZES.length) - 1]
export const expandCost = (level: number) => (level < LAND_SIZES.length ? LAND_COSTS[level] : null)
