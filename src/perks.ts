import type { CatPalette } from './cat';

/** Talents of the special cats offered between levels. */
export type Perk = 'guard' | 'sprinter' | 'magnet' | 'chubby' | 'lucky' | 'royal';

export interface PerkInfo {
  perk: Perk;
  name: string;
  /** One line for the pick card. */
  desc: string;
  palette: CatPalette;
  /** Extra SVG drawn inside the cat's head group so the cat is recognisable on the field. */
  accessory: string;
}

/* Palettes live here rather than in cat.ts so this module never imports cat.ts at runtime. */
export const PERKS: Record<Perk, PerkInfo> = {
  guard: {
    perk: 'guard',
    name: 'Сторож',
    desc: 'Собачки рядом с ним пугаются и убегают без добычи.',
    palette: { name: 'guard', fur: '#a57b6a', belly: '#ecd6c8', ear: '#ffb7c5', line: '#6b4a3c', iris: '#8fd3f4' },
    accessory: `<path d="M42 74 q18 12 36 0 l-8 14 q-10 5 -20 0 z" fill="#e5536f" stroke="#b83a52" stroke-width="1.2" stroke-linejoin="round" />`,
  },
  sprinter: {
    perk: 'sprinter',
    name: 'Спринтер',
    desc: 'Быстрее всех и замечает угощения вдвое дальше.',
    palette: { name: 'sprinter', fur: '#cdd3e6', belly: '#f1f3fb', ear: '#ffc4d2', line: '#8f98b8', iris: '#f0b232', tabby: true },
    accessory: `<path d="M28 38 q32 -14 64 0" fill="none" stroke="#4f8fd1" stroke-width="6" stroke-linecap="round" />`,
  },
  magnet: {
    perk: 'magnet',
    name: 'Магнитик',
    desc: 'Угощения неподалёку сами подкатываются к нему.',
    palette: { name: 'magnet', fur: '#dccbf5', belly: '#f6f0ff', ear: '#ffb9cc', line: '#a187cf', iris: '#ffa54a' },
    accessory: `<path d="M50 76 v8 a10 10 0 0 0 20 0 v-8" fill="none" stroke="#e5536f" stroke-width="5.5" stroke-linecap="round" />
    <path d="M50 76 v3.5 M70 76 v3.5" fill="none" stroke="#4f8fd1" stroke-width="5.5" stroke-linecap="round" />`,
  },
  chubby: {
    perk: 'chubby',
    name: 'Пухлик',
    desc: 'Пока он на поле, котики голодают на 20% медленнее.',
    palette: { name: 'chubby', fur: '#fff0d6', belly: '#fffaf1', ear: '#ffc2cf', line: '#cfa784', iris: '#f2a33a' },
    accessory: `<path d="M47 72 q13 9 26 0 q7 14 -13 21 q-20 -7 -13 -21 z" fill="#ffffff" stroke="#f4c3d2" stroke-width="1.5" stroke-linejoin="round" />
    <circle cx="60" cy="84" r="2.2" fill="#ff9fb8" />`,
  },
  lucky: {
    perk: 'lucky',
    name: 'Счастливчик',
    desc: 'Угощения появляются на 20% чаще.',
    palette: { name: 'lucky', fur: '#ffbe6f', belly: '#ffeedb', ear: '#ffb0bd', line: '#c7843f', iris: '#5fb35a', tabby: true },
    accessory: `<path d="M41 74 q19 12 38 0" fill="none" stroke="#e5536f" stroke-width="4" stroke-linecap="round" />
    <circle cx="60" cy="82" r="5.5" fill="#ffd54f" stroke="#d99a2b" stroke-width="1.2" />
    <circle cx="60" cy="84.5" r="1.2" fill="#8a5a10" />`,
  },
  royal: {
    perk: 'royal',
    name: 'Принцесса',
    desc: 'Каждое угощение приносит на 50% больше очков.',
    palette: { name: 'royal', fur: '#ffd9e1', belly: '#fff5f7', ear: '#ff9fb6', line: '#d98fa2', iris: '#7fc2ff' },
    accessory: `<path d="M44 27 l5 -13 l11 8 l11 -8 l5 13 z" fill="#ffd54f" stroke="#d99a2b" stroke-width="1.5" stroke-linejoin="round" />
    <circle cx="49" cy="14" r="2" fill="#ff6f9c" /><circle cx="60" cy="22" r="2" fill="#8fd3f4" /><circle cx="71" cy="14" r="2" fill="#ff6f9c" />`,
  },
};

export const PERK_LIST: PerkInfo[] = Object.values(PERKS);

/** `count` different cats to choose from. */
export function rollChoices(count = 3): PerkInfo[] {
  const pool = [...PERK_LIST];
  const out: PerkInfo[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}
