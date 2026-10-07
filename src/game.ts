import { Cat, PALETTES } from './cat';
import { Dog } from './dog';
import { spawnSpark } from './effects';
import { Item, randomKind } from './items';
import { rollChoices, type Perk, type PerkInfo } from './perks';
import { scale } from './scale';
import { between, dist, nearest, type Vec } from './vec';
import type { World } from './world';

export type Phase = 'menu' | 'playing' | 'pick' | 'over';

export interface GameStats {
  score: number;
  /** Treats eaten by cats. */
  treats: number;
  /** Treats carried off by dogs. */
  stolen: number;
  maxCats: number;
  /** Seconds survived. */
  time: number;
  /** Goes up every time the level's treat quota is met. */
  level: number;
  /** Longest run of quick treats without a dog stealing one. */
  bestStreak: number;
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

/** Treats to eat before a level is done: 6, 8, 10, ... */
export const levelNeed = (level: number): number => 4 + 2 * level;
/** Finishing this level is the goal of a run; after that the game goes on for score. */
export const WIN_LEVEL = 5;
/** Treats it takes to win: the quotas of levels 1..WIN_LEVEL added up. */
export const WIN_TREATS = Array.from({ length: WIN_LEVEL }, (_, i) => levelNeed(i + 1)).reduce((a, b) => a + b, 0);

const TREAT_POINTS = 10;
const GOLD_POINTS = 100;
/** Points per treat grow with the streak, up to this multiplier. */
const MAX_COMBO = 5;
/** Seconds between treats that keep a streak alive. */
const COMBO_WINDOW = 6;
export const LEVEL_BONUS = 50;
export const WIN_BONUS = 300;
/** Dogs get this much faster with every level, up to the cap. */
const DOG_SPEEDUP = 0.08;
const DOG_SPEED_CAP = 1.6;

/* Perk strengths; src/perks.ts says what each cat does. */
const GUARD_RADIUS = 110;
const MAGNET_RADIUS = 170;
/** px/s at scale 1 */
const MAGNET_PULL = 140;
const CHUBBY_SAVING = 0.8;
const LUCKY_HASTE = 0.8;
const ROYAL_BONUS = 0.5;

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
  stats: GameStats = freshStats();
  /** Treats eaten in the current level. */
  progress = 0;
  /** Cats offered when a level ends; meaningful while the phase is 'pick'. */
  choices: PerkInfo[] = [];
  onGameOver?: (stats: GameStats) => void;
  /** A cat just ate a treat. */
  onTreat?: () => void;
  /** A level's quota is met; `won` on the level that completes the run. Pick from `choices` to go on. */
  onLevelComplete?: (level: number, won: boolean) => void;

  private readonly stage: HTMLElement;
  private readonly keepClear: HTMLElement;
  private readonly world: World;
  private itemTimer = 0;
  /** Every treat summons a dog after a short head start for the cats; seconds until each one arrives. */
  private dogQueue: number[] = [];
  private paletteCursor = 0;
  private won = false;
  /** Quick treats in a row; a dog stealing or a long pause breaks it. */
  private streak = 0;
  private sinceEat = Infinity;
  private goldSpawned = false;

  /** `keepClear` is the HUD: treats never spawn under it. */
  constructor(stage: HTMLElement, keepClear: HTMLElement) {
    this.stage = stage;
    this.keepClear = keepClear;
    this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.world = { cursor: this.cursor, items: this.items };
  }

  /** Treats needed to finish the current level. */
  get need(): number {
    return levelNeed(this.stats.level);
  }

  /** Menu: a few cats chase the cursor, no treats, no dogs, no hunger. */
  showMenu(): void {
    this.phase = 'menu';
    this.stage.classList.remove('is-paused');
    this.clearField();
    this.setCats(MENU_CATS);
  }

  start(hungerLimit: number): void {
    this.phase = 'playing';
    this.stage.classList.remove('is-paused');
    this.hungerLimit = hungerLimit;
    this.hunger = hungerLimit;
    this.stats = freshStats();
    this.progress = 0;
    this.won = false;
    this.streak = 0;
    this.sinceEat = Infinity;
    this.goldSpawned = false;
    this.clearField();
    this.setCats(START_CATS);
    this.itemTimer = between(1, 2);
  }

  /** The player picked a cat: it runs in from the edge and the game goes on. */
  choose(info: PerkInfo): void {
    if (this.phase !== 'pick') return;
    this.cats.push(new Cat(info.palette, randomEdgePoint(), this.stage, info.perk));
    this.stats.maxCats = Math.max(this.stats.maxCats, this.cats.length);
    this.choices = [];
    this.phase = 'playing';
    this.stage.classList.remove('is-paused');
  }

  update(dt: number): void {
    if (this.phase === 'pick') return; // the field waits while a cat is being chosen
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
      this.applyPerks(dt);
      this.resolvePickups();
      this.expireGold(dt);
      this.stats.time += dt;
      this.sinceEat += dt;
      this.starve(dt);
    }
  }

  private count(perk: Perk): number {
    let n = 0;
    for (const cat of this.cats) if (cat.perk === perk) n++;
    return n;
  }

  private spawnThings(dt: number): void {
    this.itemTimer -= dt;
    if (this.itemTimer <= 0) {
      this.itemTimer = between(2.5, 4.5) * LUCKY_HASTE ** this.count('lucky');
      if (this.items.length < MAX_ITEMS) {
        const p = this.randomItemSpot();
        if (p) {
          this.items.push(new Item(this.stage, randomKind(), p));
          this.dogQueue.push(between(0.8, 2.2));
        }
      }
    }

    // Halfway through a level the golden fish shows up, and two dogs come running for it.
    if (!this.goldSpawned && this.progress >= Math.floor(this.need / 2)) {
      this.goldSpawned = true;
      const p = this.randomItemSpot();
      if (p) {
        this.items.push(new Item(this.stage, 'gold', p));
        spawnSpark(this.stage, p.x, p.y - 28 * scale, 'золотая рыбка!', { cls: 'score-cat', size: 15 });
        this.dogQueue.push(0.4, 1);
      }
    }

    for (let i = this.dogQueue.length - 1; i >= 0; i--) {
      this.dogQueue[i] -= dt;
      if (this.dogQueue[i] > 0) continue;
      this.dogQueue.splice(i, 1);
      if (this.items.length > 0 && this.dogs.length < MAX_DOGS) {
        this.dogs.push(new Dog(this.stage, randomEdgePoint(), this.dogSpeed()));
      }
    }
  }

  private dogSpeed(): number {
    return Math.min(DOG_SPEED_CAP, 1 + DOG_SPEEDUP * (this.stats.level - 1));
  }

  /** Special cats at work: guards scare dogs away, magnets pull treats closer. */
  private applyPerks(dt: number): void {
    const guards = this.cats.filter((c) => c.perk === 'guard');
    if (guards.length > 0) {
      for (const dog of this.dogs) {
        if (dog.state === 'hunting' && nearest(guards, dog.pos, GUARD_RADIUS * scale)) dog.scare();
      }
    }
    const magnets = this.cats.filter((c) => c.perk === 'magnet');
    if (magnets.length > 0) {
      for (const item of this.items) {
        const magnet = nearest(magnets, item.pos, MAGNET_RADIUS * scale);
        if (magnet) item.moveToward(magnet.pos, MAGNET_PULL * scale * dt);
      }
    }
  }

  /** Whoever steps on a treat first takes it: cats are checked before dogs on the same frame. */
  private resolvePickups(): void {
    const hunting = this.dogs.filter((d) => d.state === 'hunting');
    for (const item of [...this.items]) {
      const cat = nearest(this.cats, item.pos, CAT_PICK * scale);
      if (cat) {
        this.eat(cat, item);
        continue;
      }
      const dog = nearest(hunting, item.pos, DOG_PICK * scale);
      if (dog) {
        this.removeItem(item);
        this.stats.stolen++;
        this.streak = 0;
        dog.grab(item.kind);
        spawnSpark(this.stage, item.pos.x, item.pos.y - 10 * scale, 'утащила!', { cls: 'score-dog', size: 15 });
      }
    }
  }

  /** A cat stepped on a treat: points with a streak bonus, a new cat, and maybe the end of the level. */
  private eat(cat: Cat, item: Item): void {
    this.removeItem(item);
    this.streak = this.sinceEat < COMBO_WINDOW ? this.streak + 1 : 1;
    this.sinceEat = 0;
    this.stats.bestStreak = Math.max(this.stats.bestStreak, this.streak);
    const combo = Math.min(MAX_COMBO, this.streak);
    const base = item.gold ? GOLD_POINTS : TREAT_POINTS * combo;
    const points = Math.round(base * (1 + ROYAL_BONUS * this.count('royal')));
    this.stats.score += points;
    this.stats.treats++;
    this.progress++;
    this.hunger = this.hungerLimit;
    this.onTreat?.();
    cat.cheer();
    if (this.cats.length < MAX_CATS) this.addCat();
    const label = combo > 1 && !item.gold ? `+${points} ×${combo}` : `+${points}`;
    spawnSpark(this.stage, item.pos.x, item.pos.y - 10 * scale, label, { cls: 'score-cat', size: item.gold ? 20 : 16 });
    if (this.progress >= this.need) this.completeLevel();
  }

  /** Quota met: bonus points, freeze the field and offer three cats to choose from. */
  private completeLevel(): void {
    const level = this.stats.level;
    const won = !this.won && level === WIN_LEVEL;
    this.won ||= won;
    this.stats.score += won ? WIN_BONUS : LEVEL_BONUS * level;
    this.stats.level = level + 1;
    this.progress = 0;
    this.goldSpawned = false;
    this.choices = rollChoices();
    this.phase = 'pick';
    this.stage.classList.add('is-paused');
    this.onLevelComplete?.(level, won);
  }

  /** Golden fish don't wait around. */
  private expireGold(dt: number): void {
    for (const item of [...this.items]) {
      if (!item.gold) continue;
      item.ttl -= dt;
      if (item.ttl < 2.5) item.el.classList.add('is-fading');
      if (item.ttl <= 0) {
        this.removeItem(item);
        spawnSpark(this.stage, item.pos.x, item.pos.y - 10 * scale, 'уплыла…', { cls: 'sad', size: 14 });
      }
    }
  }

  /** The hunger clock: when it runs out a cat wanders off, and the clock restarts. */
  private starve(dt: number): void {
    this.hunger -= dt * CHUBBY_SAVING ** this.count('chubby');
    if (this.hunger > 0) return;
    this.hunger = this.hungerLimit;
    this.loseCat();
    if (this.cats.length === 0) this.endGame();
  }

  /** Ordinary cats wander off first; the special ones stay as long as they can. */
  private loseCat(): void {
    const ordinary = this.cats.filter((c) => !c.perk);
    const pool = ordinary.length > 0 ? ordinary : this.cats;
    const cat = pool[Math.floor(Math.random() * pool.length)];
    this.cats.splice(this.cats.indexOf(cat), 1);
    spawnSpark(this.stage, cat.pos.x, cat.pos.y - 34 * scale, 'мяу…', { cls: 'sad', size: 14 });
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

  /** Keep `n` ordinary cats on the field: specials and extras leave, missing ones run in. */
  private setCats(n: number): void {
    for (let i = this.cats.length - 1; i >= 0; i--) {
      if (this.cats[i].perk || i >= n) this.cats.splice(i, 1)[0].dispose();
    }
    while (this.cats.length < n) this.addCat();
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
    const m = 60 * scale;
    const pad = 40 * scale;
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 12; i++) {
      const p = { x: between(m, w - m), y: between(m, h - m) };
      if (p.y < rect.bottom + pad && p.x > rect.left - pad && p.x < rect.right + pad) continue;
      if (this.cats.some((c) => dist(c.pos, p) < 90 * scale)) continue;
      if (this.items.some((it) => dist(it.pos, p) < 70 * scale)) continue;
      return p;
    }
    return null;
  }
}

function freshStats(): GameStats {
  return { score: 0, treats: 0, stolen: 0, maxCats: START_CATS, time: 0, level: 1, bestStreak: 0 };
}

function randomEdgePoint(): Vec {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const m = 60 * scale;
  switch (Math.floor(Math.random() * 4)) {
    case 0: return { x: Math.random() * w, y: -m };
    case 1: return { x: w + m, y: Math.random() * h };
    case 2: return { x: Math.random() * w, y: h + m };
    default: return { x: -m, y: Math.random() * h };
  }
}
