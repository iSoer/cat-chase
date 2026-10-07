import { Cat, PALETTES } from './cat';
import { Dog } from './dog';
import { spawnSpark } from './effects';
import { Item, randomKind } from './items';
import { between, dist, nearest, type Vec } from './vec';
import type { World } from './world';

export type Phase = 'menu' | 'playing' | 'over';

export interface GameStats {
  /** Treats eaten by cats. */
  treats: number;
  /** Treats carried off by dogs. */
  stolen: number;
  maxCats: number;
  /** Seconds survived. */
  time: number;
}

/** Cats that wander the menu screen for company. */
const MENU_CATS = 5;
const START_CATS = 5;
const MAX_CATS = 40;
const MAX_ITEMS = 6;
const MAX_DOGS = 6;
/** A cat or dog this close to a treat has stepped on it. */
const CAT_PICK = 26;
const DOG_PICK = 28;

export class Game {
  phase: Phase = 'menu';
  readonly cats: Cat[] = [];
  readonly dogs: Dog[] = [];
  readonly items: Item[] = [];
  readonly cursor: Vec;
  /** Seconds the cats can go without eating before one of them leaves. */
  hungerLimit = 7;
  /** Seconds left until the next cat leaves. */
  hunger = 7;
  stats: GameStats = { treats: 0, stolen: 0, maxCats: 0, time: 0 };
  onGameOver?: (stats: GameStats) => void;

  private readonly stage: HTMLElement;
  private readonly keepClear: HTMLElement;
  private readonly world: World;
  private itemTimer = 0;
  /** Every treat summons a dog after a short head start for the cats; seconds until each one arrives. */
  private dogQueue: number[] = [];
  private paletteCursor = 0;

  /** `keepClear` is the HUD: treats never spawn under it. */
  constructor(stage: HTMLElement, keepClear: HTMLElement) {
    this.stage = stage;
    this.keepClear = keepClear;
    this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.world = { cursor: this.cursor, items: this.items };
  }

  /** Menu: a few cats chase the cursor, no treats, no dogs, no hunger. */
  showMenu(): void {
    this.phase = 'menu';
    this.clearField();
    this.setCats(MENU_CATS);
  }

  start(hungerLimit: number): void {
    this.phase = 'playing';
    this.hungerLimit = hungerLimit;
    this.hunger = hungerLimit;
    this.stats = { treats: 0, stolen: 0, maxCats: START_CATS, time: 0 };
    this.clearField();
    this.setCats(START_CATS);
    this.itemTimer = between(1, 2);
  }

  update(dt: number): void {
    const playing = this.phase === 'playing';
    if (playing) this.spawnThings(dt);

    for (const cat of this.cats) cat.update(dt, this.world);

    for (let i = this.dogs.length - 1; i >= 0; i--) {
      const dog = this.dogs[i];
      dog.update(dt, this.world);
      if (dog.gone) {
        dog.removeNow();
        this.dogs.splice(i, 1);
      }
    }

    if (playing) {
      this.resolvePickups();
      this.stats.time += dt;
      this.starve(dt);
    }
  }

  private spawnThings(dt: number): void {
    this.itemTimer -= dt;
    if (this.itemTimer <= 0) {
      this.itemTimer = between(2.5, 4.5);
      if (this.items.length < MAX_ITEMS) {
        const p = this.randomItemSpot();
        if (p) {
          this.items.push(new Item(this.stage, randomKind(), p));
          this.dogQueue.push(between(0.8, 2.2));
        }
      }
    }

    for (let i = this.dogQueue.length - 1; i >= 0; i--) {
      this.dogQueue[i] -= dt;
      if (this.dogQueue[i] > 0) continue;
      this.dogQueue.splice(i, 1);
      if (this.items.length > 0 && this.dogs.length < MAX_DOGS) {
        this.dogs.push(new Dog(this.stage, randomEdgePoint()));
      }
    }
  }

  /** Whoever steps on a treat first takes it: cats are checked before dogs on the same frame. */
  private resolvePickups(): void {
    const hunting = this.dogs.filter((d) => d.state === 'hunting');
    for (const item of [...this.items]) {
      const cat = nearest(this.cats, item.pos, CAT_PICK);
      if (cat) {
        this.removeItem(item);
        this.stats.treats++;
        this.hunger = this.hungerLimit;
        cat.cheer();
        if (this.cats.length < MAX_CATS) {
          this.addCat();
          spawnSpark(this.stage, item.pos.x, item.pos.y - 10, '+1 котик', { cls: 'score-cat', size: 16 });
        } else {
          spawnSpark(this.stage, item.pos.x, item.pos.y - 10, '+1', { cls: 'score-cat', size: 17 });
        }
        continue;
      }
      const dog = nearest(hunting, item.pos, DOG_PICK);
      if (dog) {
        this.removeItem(item);
        this.stats.stolen++;
        dog.grab(item.kind);
        spawnSpark(this.stage, item.pos.x, item.pos.y - 10, 'утащила!', { cls: 'score-dog', size: 15 });
      }
    }
  }

  /** The hunger clock: when it runs out a cat wanders off, and the clock restarts. */
  private starve(dt: number): void {
    this.hunger -= dt;
    if (this.hunger > 0) return;
    this.hunger = this.hungerLimit;
    this.loseCat();
    if (this.cats.length === 0) this.endGame();
  }

  private loseCat(): void {
    const i = Math.floor(Math.random() * this.cats.length);
    const [cat] = this.cats.splice(i, 1);
    spawnSpark(this.stage, cat.pos.x, cat.pos.y - 34, 'мяу…', { cls: 'sad', size: 14 });
    cat.dispose();
  }

  private endGame(): void {
    this.phase = 'over';
    this.clearField();
    this.onGameOver?.(this.stats);
  }

  private addCat(): void {
    const palette = PALETTES[this.paletteCursor++ % PALETTES.length];
    this.cats.push(new Cat(palette, randomEdgePoint(), this.stage));
    this.stats.maxCats = Math.max(this.stats.maxCats, this.cats.length);
  }

  private setCats(n: number): void {
    while (this.cats.length < n) this.addCat();
    while (this.cats.length > n) this.cats.pop()!.dispose();
  }

  private removeItem(item: Item): void {
    const i = this.items.indexOf(item);
    if (i >= 0) this.items.splice(i, 1);
    item.vanish();
  }

  private clearField(): void {
    for (const item of this.items) item.vanish();
    this.items.length = 0;
    for (const dog of this.dogs) dog.dispose();
    this.dogs.length = 0;
    this.dogQueue = [];
  }

  /** A free spot for a treat: on screen, clear of the HUD, not already under a cat or another treat. */
  private randomItemSpot(): Vec | null {
    const rect = this.keepClear.getBoundingClientRect();
    const m = 60;
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 12; i++) {
      const p = { x: between(m, w - m), y: between(m, h - m) };
      if (p.x < rect.right + 40 && p.y < rect.bottom + 40) continue;
      if (this.cats.some((c) => dist(c.pos, p) < 90)) continue;
      if (this.items.some((it) => dist(it.pos, p) < 70)) continue;
      return p;
    }
    return null;
  }
}

function randomEdgePoint(): Vec {
  const w = window.innerWidth;
  const h = window.innerHeight;
  switch (Math.floor(Math.random() * 4)) {
    case 0: return { x: Math.random() * w, y: -60 };
    case 1: return { x: w + 60, y: Math.random() * h };
    case 2: return { x: Math.random() * w, y: h + 60 };
    default: return { x: -60, y: Math.random() * h };
  }
}
