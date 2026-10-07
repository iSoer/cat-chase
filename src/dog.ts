import { Critter } from './critter';
import { spawnSpark } from './effects';
import { itemSvg, type Item, type ItemKind } from './items';
import { scale } from './scale';
import { between, dist, nearest, weightedPick, type Vec } from './vec';
import type { World } from './world';

export type DogState = 'hunting' | 'leaving';

export interface DogPalette {
  name: string;
  fur: string;
  belly: string;
  ear: string;
  line: string;
  iris: string;
}

export const DOG_PALETTES: DogPalette[] = [
  { name: 'shiba', fur: '#f0b26b', belly: '#fff3e0', ear: '#d9924f', line: '#b8732f', iris: '#5a3a25' },
  { name: 'husky', fur: '#bcc3d3', belly: '#f3f5fa', ear: '#8e97ad', line: '#6f7891', iris: '#6fb4ff' },
  { name: 'brown', fur: '#b98a63', belly: '#efdcc5', ear: '#8f6241', line: '#6b4a3c', iris: '#3f2a1e' },
];

/** Dogs come in different tempers too: some plod, some are greyhounds. */
const DOG_PACES: Array<{ weight: number; speed: [number, number] }> = [
  { weight: 1, speed: [170, 240] }, // plodder
  { weight: 2, speed: [280, 370] }, // ordinary
  { weight: 1, speed: [420, 500] }, // greyhound
];

/** Past this margin outside the viewport a dog counts as gone. */
const GONE_MARGIN = 100;
const EXIT_MARGIN = 140;

export function dogSvg(p: DogPalette): string {
  const blinkDelay = -(Math.random() * 5).toFixed(2);
  return `
<svg viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="tail">
    <path d="M34 86 C 18 80, 20 58, 38 62" fill="none" stroke="${p.line}" stroke-width="12" stroke-linecap="round" opacity=".35" />
    <path d="M34 86 C 18 80, 20 58, 38 62" fill="none" stroke="${p.fur}" stroke-width="9" stroke-linecap="round" />
  </g>
  <g class="legs">
    <ellipse class="leg leg-back" cx="44" cy="102" rx="9.5" ry="6.5" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
    <ellipse class="leg leg-front" cx="76" cy="102" rx="9.5" ry="6.5" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
  </g>
  <ellipse cx="60" cy="86" rx="28" ry="18" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
  <ellipse cx="60" cy="90" rx="15" ry="10" fill="${p.belly}" />
  <g class="head">
    <g class="ear ear-l">
      <path d="M36 30 C 16 32, 10 66, 24 74 C 34 78, 42 62, 42 42 Z" fill="${p.ear}" stroke="${p.line}" stroke-width="1.5" stroke-linejoin="round" />
    </g>
    <g class="ear ear-r">
      <path d="M84 30 C 104 32, 110 66, 96 74 C 86 78, 78 62, 78 42 Z" fill="${p.ear}" stroke="${p.line}" stroke-width="1.5" stroke-linejoin="round" />
    </g>
    <circle cx="60" cy="50" r="33" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
    <ellipse cx="60" cy="67" rx="15" ry="11" fill="${p.belly}" />
    <ellipse cx="33" cy="58" rx="7" ry="4" fill="#ff9fb8" opacity=".5" />
    <ellipse cx="87" cy="58" rx="7" ry="4" fill="#ff9fb8" opacity=".5" />
    <g class="eyes-open" style="animation-delay:${blinkDelay}s">
      <ellipse cx="44" cy="49" rx="7" ry="9" fill="#2e1f33" />
      <ellipse cx="44" cy="51" rx="4.8" ry="6.5" fill="${p.iris}" />
      <circle cx="47" cy="45" r="2.8" fill="#fff" />
      <circle cx="41.5" cy="54" r="1.3" fill="#fff" opacity=".9" />
      <ellipse cx="76" cy="49" rx="7" ry="9" fill="#2e1f33" />
      <ellipse cx="76" cy="51" rx="4.8" ry="6.5" fill="${p.iris}" />
      <circle cx="79" cy="45" r="2.8" fill="#fff" />
      <circle cx="73.5" cy="54" r="1.3" fill="#fff" opacity=".9" />
    </g>
    <g class="eyes-happy" fill="none" stroke="#2e1f33" stroke-width="3.2" stroke-linecap="round">
      <path d="M37 51 q7 -9 14 0" />
      <path d="M69 51 q7 -9 14 0" />
    </g>
    <ellipse cx="60" cy="62" rx="4.8" ry="3.6" fill="#2e1f33" />
    <circle cx="58.5" cy="61" r="1.2" fill="#fff" opacity=".8" />
    <path d="M60 65 v3 M54 68 q6 5 12 0" fill="none" stroke="#2e1f33" stroke-width="1.8" stroke-linecap="round" />
    <path d="M57.5 70 q2.5 8 5 0 z" fill="#ff8fa8" />
    <path d="M38 78 q22 12 44 0" fill="none" stroke="#e5536f" stroke-width="5" stroke-linecap="round" />
    <circle cx="60" cy="84" r="3.5" fill="#ffd166" stroke="#c99a2e" stroke-width="1" />
  </g>
</svg>`;
}

export class Dog extends Critter {
  state: DogState = 'hunting';

  private target: Item | null = null;
  private exit: Vec | null = null;
  private announced = false;
  private readonly carry: HTMLDivElement;

  constructor(stage: HTMLElement, start: Vec) {
    const tier = weightedPick(DOG_PACES);
    const speed = between(tier.speed[0], tier.speed[1]);
    const palette = DOG_PALETTES[Math.floor(Math.random() * DOG_PALETTES.length)];
    super(stage, 'dog', dogSvg(palette), start, speed, speed * 5 + 300);
    this.carry = document.createElement('div');
    this.carry.className = 'carry';
    this.rig.appendChild(this.carry);
  }

  /** True once the dog has run off the edge of the screen. */
  get gone(): boolean {
    const m = GONE_MARGIN * scale;
    return (
      this.state === 'leaving' &&
      (this.pos.x < -m || this.pos.x > window.innerWidth + m || this.pos.y < -m || this.pos.y > window.innerHeight + m)
    );
  }

  update(dt: number, world: World): void {
    if (!this.announced && this.onScreen()) {
      this.announced = true;
      spawnSpark(this.stage, this.pos.x, this.pos.y - 36 * scale, 'гав!', { cls: 'bark', size: 15 });
    }

    if (this.state === 'hunting') {
      if (!this.target || !world.items.includes(this.target)) {
        this.target = nearest(world.items, this.pos, Infinity);
      }
      if (this.target) {
        this.steer(this.target.pos.x, this.target.pos.y, dt, false);
      } else {
        this.leave();
      }
    }

    if (this.state === 'leaving' && this.exit) {
      this.steer(this.exit.x, this.exit.y, dt, false);
    }

    this.render();
  }

  /** The dog got to a treat first: carry it off in its mouth. */
  grab(kind: ItemKind): void {
    this.carry.innerHTML = itemSvg(kind);
    this.el.classList.add('is-glad');
    this.leave();
  }

  private leave(): void {
    if (this.state === 'leaving') return;
    this.state = 'leaving';
    this.target = null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const m = EXIT_MARGIN * scale;
    const exits: Vec[] = [
      { x: this.pos.x, y: -m },
      { x: w + m, y: this.pos.y },
      { x: this.pos.x, y: h + m },
      { x: -m, y: this.pos.y },
    ];
    this.exit = exits.reduce((a, b) => (dist(a, this.pos) <= dist(b, this.pos) ? a : b));
  }

  private onScreen(): boolean {
    return this.pos.x > 0 && this.pos.x < window.innerWidth && this.pos.y > 0 && this.pos.y < window.innerHeight;
  }
}
