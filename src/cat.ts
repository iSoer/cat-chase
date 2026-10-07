import { Critter } from './critter';
import { spawnSpark } from './effects';
import { between, dist, nearest, weightedPick, type Vec } from './vec';
import type { World } from './world';

export type CatState = 'running' | 'tumbling' | 'cuddling' | 'rising';

export interface CatPalette {
  name: string;
  fur: string;
  belly: string;
  ear: string;
  line: string;
  iris: string;
  tabby?: boolean;
}

export const PALETTES: CatPalette[] = [
  { name: 'cream', fur: '#fff0d6', belly: '#fffaf1', ear: '#ffc2cf', line: '#cfa784', iris: '#f2a33a' },
  { name: 'ginger', fur: '#ffbe6f', belly: '#ffeedb', ear: '#ffb0bd', line: '#c7843f', iris: '#5fb35a', tabby: true },
  { name: 'grey', fur: '#cdd3e6', belly: '#f1f3fb', ear: '#ffc4d2', line: '#8f98b8', iris: '#f0b232', tabby: true },
  { name: 'cocoa', fur: '#a57b6a', belly: '#ecd6c8', ear: '#ffb7c5', line: '#6b4a3c', iris: '#8fd3f4' },
  { name: 'sakura', fur: '#ffd9e1', belly: '#fff5f7', ear: '#ff9fb6', line: '#d98fa2', iris: '#7fc2ff' },
  { name: 'lilac', fur: '#dccbf5', belly: '#f6f0ff', ear: '#ffb9cc', line: '#a187cf', iris: '#ffa54a' },
];

/** Durations must match the CSS keyframes in style.css. */
const TUMBLE_S = 0.7;
const RISE_S = 0.4;
/** How close to its spot a cat must get before it flops over. */
const CATCH_DIST = 12;
/** How far the spot must move before a cuddling cat bothers to get up. */
const WAKE_DIST = 70;
/** A running cat spots a treat this close and detours for it. */
const NOTICE_RUNNING = 240;
/** A cuddling cat only gets up for a treat this close. */
const NOTICE_CUDDLING = 150;
const GLAD_MS = 700;

/** Every cat gets its own pace: lazy ones amble, sprinters dash. */
interface Pace {
  speed: number;
  accel: number;
  wakeDelay: number;
}

const PACES: Array<{ weight: number; speed: [number, number]; wake: [number, number] }> = [
  { weight: 1, speed: [130, 200], wake: [0.3, 0.8] }, // lazy
  { weight: 2, speed: [230, 340], wake: [0.1, 0.4] }, // ordinary
  { weight: 1, speed: [400, 520], wake: [0, 0.15] }, // sprinter
];

function pickPace(): Pace {
  const tier = weightedPick(PACES);
  const speed = between(tier.speed[0], tier.speed[1]);
  return { speed, accel: speed * 5 + 300, wakeDelay: between(tier.wake[0], tier.wake[1]) };
}

export function catSvg(p: CatPalette): string {
  const blinkDelay = -(Math.random() * 5).toFixed(2);
  const tabby = p.tabby
    ? `<g fill="none" stroke="${p.line}" stroke-width="3" stroke-linecap="round" opacity=".7">
         <path d="M52 20 v9" /><path d="M60 17 v10" /><path d="M68 20 v9" />
       </g>`
    : '';

  return `
<svg viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="tail">
    <path d="M38 92 C 14 94, 8 72, 22 62" fill="none" stroke="${p.line}" stroke-width="12" stroke-linecap="round" opacity=".35" />
    <path d="M38 92 C 14 94, 8 72, 22 62" fill="none" stroke="${p.fur}" stroke-width="9" stroke-linecap="round" />
    <circle cx="22" cy="62" r="5" fill="${p.line}" opacity=".5" />
  </g>
  <g class="legs">
    <ellipse class="leg leg-back" cx="44" cy="102" rx="9" ry="6.5" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
    <ellipse class="leg leg-front" cx="76" cy="102" rx="9" ry="6.5" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
  </g>
  <ellipse cx="60" cy="86" rx="27" ry="18" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
  <ellipse cx="60" cy="90" rx="15" ry="10" fill="${p.belly}" />
  <g class="head">
    <g class="ear ear-l">
      <path d="M30 34 L24 8 L52 22 Z" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M32 30 L28 14 L46 23 Z" fill="${p.ear}" />
    </g>
    <g class="ear ear-r">
      <path d="M90 34 L96 8 L68 22 Z" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M88 30 L92 14 L74 23 Z" fill="${p.ear}" />
    </g>
    <circle cx="60" cy="50" r="34" fill="${p.fur}" stroke="${p.line}" stroke-width="1.5" />
    ${tabby}
    <ellipse cx="34" cy="60" rx="8" ry="4.5" fill="#ff9fb8" opacity=".55" />
    <ellipse cx="86" cy="60" rx="8" ry="4.5" fill="#ff9fb8" opacity=".55" />
    <g class="eyes-open" style="animation-delay:${blinkDelay}s">
      <ellipse cx="45" cy="52" rx="8" ry="10.5" fill="#2e1f33" />
      <ellipse cx="45" cy="54" rx="5.5" ry="7.5" fill="${p.iris}" />
      <ellipse cx="45" cy="57" rx="3" ry="3.5" fill="#2e1f33" />
      <circle cx="48.5" cy="47.5" r="3.2" fill="#fff" />
      <circle cx="42" cy="57" r="1.5" fill="#fff" opacity=".9" />
      <ellipse cx="75" cy="52" rx="8" ry="10.5" fill="#2e1f33" />
      <ellipse cx="75" cy="54" rx="5.5" ry="7.5" fill="${p.iris}" />
      <ellipse cx="75" cy="57" rx="3" ry="3.5" fill="#2e1f33" />
      <circle cx="78.5" cy="47.5" r="3.2" fill="#fff" />
      <circle cx="72" cy="57" r="1.5" fill="#fff" opacity=".9" />
    </g>
    <g class="eyes-happy" fill="none" stroke="#2e1f33" stroke-width="3.2" stroke-linecap="round">
      <path d="M37 54 q8 -10 16 0" />
      <path d="M67 54 q8 -10 16 0" />
    </g>
    <path d="M56.5 62 h7 l-3.5 4.5 z" fill="#ff8fa8" />
    <path d="M53 66 q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke="#2e1f33" stroke-width="1.8" stroke-linecap="round" />
    <g stroke="${p.line}" stroke-width="1.4" stroke-linecap="round" opacity=".8">
      <path d="M22 60 h-12" /><path d="M23 66 l-11 3" />
      <path d="M98 60 h12" /><path d="M97 66 l11 3" />
    </g>
  </g>
</svg>`;
}

export class Cat extends Critter {
  state: CatState = 'running';

  private readonly wakeDelay: number;
  private stateT = 0;
  private wakeT = 0;
  private heartT = 0;
  private offset: Vec = { x: 0, y: 0 };
  private gladTimer: number | undefined;

  constructor(palette: CatPalette, start: Vec, stage: HTMLElement) {
    const pace = pickPace();
    super(stage, 'cat', catSvg(palette), start, pace.speed, pace.accel);
    this.wakeDelay = pace.wakeDelay;
    this.pickSpot();
  }

  update(dt: number, world: World): void {
    this.stateT += dt;
    const spot = { x: world.cursor.x + this.offset.x, y: world.cursor.y + this.offset.y };

    switch (this.state) {
      case 'running': {
        const treat = nearest(world.items, this.pos, NOTICE_RUNNING);
        if (treat) {
          // Dash for the treat; the pickup itself happens in the world loop when we step on it.
          this.steer(treat.pos.x, treat.pos.y, dt, false);
          break;
        }
        if (dist(spot, this.pos) < CATCH_DIST) {
          this.setState('tumbling');
          break;
        }
        this.steer(spot.x, spot.y, dt, true);
        break;
      }

      case 'tumbling':
        this.coast(dt, 0.002);
        if (this.stateT >= TUMBLE_S) this.setState('cuddling');
        break;

      case 'cuddling': {
        this.heartT -= dt;
        if (this.heartT <= 0) {
          spawnSpark(this.stage, this.pos.x + (Math.random() - 0.5) * 44, this.pos.y - 18);
          this.heartT = 0.45 + Math.random() * 0.7;
        }
        const treatNearby = nearest(world.items, this.pos, NOTICE_CUDDLING) !== null;
        const spotMoved = dist(spot, this.pos) > WAKE_DIST;
        if (treatNearby || spotMoved) {
          this.wakeT += dt;
          if (treatNearby || this.wakeT >= this.wakeDelay) this.setState('rising');
        } else {
          this.wakeT = 0;
        }
        break;
      }

      case 'rising':
        if (this.stateT >= RISE_S) this.setState('running');
        break;
    }

    this.render();
  }

  /** Called when this cat picks up a treat: happy eyes and a burst of hearts. */
  cheer(): void {
    this.el.classList.add('is-glad');
    window.clearTimeout(this.gladTimer);
    this.gladTimer = window.setTimeout(() => this.el.classList.remove('is-glad'), GLAD_MS);
    for (let i = 0; i < 3; i++) {
      spawnSpark(this.stage, this.pos.x + (Math.random() - 0.5) * 48, this.pos.y - 24);
    }
  }

  private setState(next: CatState): void {
    this.el.classList.remove(`is-${this.state}`);
    this.state = next;
    this.stateT = 0;
    this.el.classList.add(`is-${next}`);
    if (next === 'cuddling') {
      this.stop();
      this.wakeT = 0;
      this.heartT = 0.15;
    }
    if (next === 'rising') this.pickSpot();
  }

  /** Each cat settles on its own spot around the cursor so they pile up instead of stacking. */
  private pickSpot(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 26 + Math.random() * 40;
    this.offset = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.8 };
  }
}
