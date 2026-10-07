import './style.css';
import { catSvg, PALETTES } from './cat';
import { DOG_PALETTES, dogSvg } from './dog';
import { Game, type GameStats } from './game';
import { itemSvg } from './items';
import { updateScale } from './scale';
import { cloudGet, cloudSet, haptic, initTelegram, showBackButton } from './telegram';

const MIN_HUNGER = 3;
const MAX_HUNGER = 20;
const DEFAULT_HUNGER = 7;
const HUNGER_KEY = 'cat-chase:hunger';
const BEST_KEY = 'cat-chase:best';
/** On touch screens the yarn floats this far above the finger, so cats and yarn stay visible. */
const TOUCH_LIFT = 48;
/** Telegram cloud storage allows only letters, digits, `_` and `-` in keys. */
const CLOUD_BEST_KEY = 'best';

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!;

const stage = $('#stage');
const yarn = $('#yarn');
const hud = $('#hud');
const menu = $('#menu');
const gameover = $('#gameover');
const hungerInput = $<HTMLInputElement>('#hunger');
const catsCount = $('#cats-count');
const scoreCats = $('#score-cats');
const scoreDogs = $('#score-dogs');
const hungerSec = $('#hunger-sec');
const hungerFill = $('#hunger-fill');
const bestEl = $('#best');

updateScale();
window.addEventListener('resize', updateScale);

const game = new Game(stage, hud);

/* ---------- HUD icons: the game's own sprites, cropped to a portrait ---------- */

const portrait = (svg: string, viewBox: string): string => svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
$('#icon-cat').innerHTML = portrait(catSvg(PALETTES[1]), '22 4 76 76');
$('#icon-dog').innerHTML = portrait(dogSvg(DOG_PALETTES[0]), '8 12 104 76');
$('#icon-fish').innerHTML = itemSvg('fish');

/* ---------- pointer ---------- */

let yarnAngle = 0;

function placeYarn(): void {
  yarn.style.transform = `translate(${game.cursor.x}px, ${game.cursor.y}px) rotate(${yarnAngle.toFixed(0)}deg)`;
}

function onPointer(e: PointerEvent): void {
  const lift = e.pointerType === 'touch' ? TOUCH_LIFT : 0;
  yarnAngle += (e.clientX - game.cursor.x) * 0.6;
  game.cursor.x = e.clientX;
  game.cursor.y = Math.max(0, e.clientY - lift);
  placeYarn();
}

window.addEventListener('pointermove', onPointer, { passive: true });
window.addEventListener('pointerdown', onPointer, { passive: true });

/* ---------- settings & storage ---------- */

function load(key: string): number | null {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && localStorage.getItem(key) !== null ? v : null;
  } catch {
    return null;
  }
}

function save(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage may be unavailable; settings still work for this visit */
  }
}

function clampHunger(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_HUNGER;
  return Math.min(MAX_HUNGER, Math.max(MIN_HUNGER, Math.round(n)));
}

function setHunger(n: number): void {
  const v = clampHunger(n);
  hungerInput.value = String(v);
  save(HUNGER_KEY, v);
}

$('#hunger-minus').addEventListener('click', () => setHunger(Number(hungerInput.value) - 1));
$('#hunger-plus').addEventListener('click', () => setHunger(Number(hungerInput.value) + 1));
hungerInput.addEventListener('change', () => setHunger(Number(hungerInput.value)));

function showBest(): void {
  const best = load(BEST_KEY);
  bestEl.hidden = best === null || best <= 0;
  if (best !== null) bestEl.textContent = `Рекорд: ${best} ${plural(best, 'угощение', 'угощения', 'угощений')}`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/* ---------- screens ---------- */

function startGame(): void {
  menu.hidden = true;
  gameover.hidden = true;
  hud.hidden = false;
  showBackButton(true);
  game.start(clampHunger(Number(hungerInput.value)));
  renderHud(true);
}

function showMenu(): void {
  gameover.hidden = true;
  hud.hidden = true;
  showBackButton(false);
  showBest();
  menu.hidden = false;
  game.showMenu();
}

function showResults(stats: GameStats): void {
  const best = load(BEST_KEY) ?? 0;
  const record = stats.treats > best;
  if (record) {
    save(BEST_KEY, stats.treats);
    cloudSet(CLOUD_BEST_KEY, String(stats.treats));
  }
  $('#r-treats').textContent = String(stats.treats);
  $('#r-stolen').textContent = String(stats.stolen);
  $('#r-max').textContent = String(stats.maxCats);
  $('#r-time').textContent = `${Math.round(stats.time)} с`;
  $('#r-best').hidden = !record;
  if (record) haptic.success();
  else haptic.warning();
  hud.hidden = true;
  gameover.hidden = false;
}

game.onGameOver = showResults;
game.onTreat = () => haptic.tap();
$('#start').addEventListener('click', startGame);
$('#again').addEventListener('click', startGame);
$('#to-menu').addEventListener('click', showMenu);
$('#quit').addEventListener('click', showMenu);

/* ---------- HUD ---------- */

let lastCats = -1;
let lastTreats = -1;
let lastStolen = -1;
let lastSec = '';

function renderHud(force = false): void {
  const n = game.cats.length;
  if (force || n !== lastCats) {
    lastCats = n;
    catsCount.textContent = String(n);
  }
  if (force || game.stats.treats !== lastTreats) {
    lastTreats = game.stats.treats;
    scoreCats.textContent = String(lastTreats);
  }
  if (force || game.stats.stolen !== lastStolen) {
    lastStolen = game.stats.stolen;
    scoreDogs.textContent = String(lastStolen);
  }
  const sec = `${Math.max(0, game.hunger).toFixed(1)} с`;
  if (force || sec !== lastSec) {
    lastSec = sec;
    hungerSec.textContent = sec;
  }
  const ratio = Math.max(0, Math.min(1, game.hunger / game.hungerLimit));
  hungerFill.style.transform = `scaleX(${ratio.toFixed(3)})`;
  const low = game.hunger < 2.5;
  hungerFill.classList.toggle('is-low', low);
  hungerSec.classList.toggle('is-low', low);
}

/* ---------- loop ---------- */

let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  if (game.phase === 'playing') renderHud();
  requestAnimationFrame(frame);
}

/* ---------- Telegram ---------- */

initTelegram({
  onTheme: (scheme) => {
    document.documentElement.dataset.theme = scheme;
  },
  onBack: showMenu,
});

/** The record travels with the Telegram account: take the cloud value when it beats the local one. */
cloudGet(CLOUD_BEST_KEY, (value) => {
  const cloudBest = Number(value);
  if (value !== null && Number.isFinite(cloudBest) && cloudBest > (load(BEST_KEY) ?? 0)) {
    save(BEST_KEY, cloudBest);
    showBest();
  }
});

/* ---------- start ---------- */

setHunger(load(HUNGER_KEY) ?? DEFAULT_HUNGER);
placeYarn();
showMenu();
requestAnimationFrame(frame);
