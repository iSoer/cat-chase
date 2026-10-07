import './style.css';
import { catSvg, PALETTES } from './cat';
import { Game, LEVEL_BONUS, WIN_BONUS, WIN_TREATS, type GameStats } from './game';
import { itemSvg } from './items';
import type { PerkInfo } from './perks';
import { updateScale } from './scale';
import { cloudGet, cloudSet, haptic, initTelegram, showBackButton } from './telegram';

const MIN_HUNGER = 3;
const MAX_HUNGER = 20;
const DEFAULT_HUNGER = 7;
const HUNGER_KEY = 'cat-chase:hunger';
const BEST_KEY = 'cat-chase:best-score';
/** On touch screens the yarn floats this far above the finger, so cats and yarn stay visible. */
const TOUCH_LIFT = 48;
/** Telegram cloud storage allows only letters, digits, `_` and `-` in keys. */
const CLOUD_BEST_KEY = 'best_score';

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!;

const stage = $('#stage');
const yarn = $('#yarn');
const hud = $('#hud');
const menu = $('#menu');
const pick = $('#pick');
const gameover = $('#gameover');
const choicesEl = $('#choices');
const hungerInput = $<HTMLInputElement>('#hunger');
const catsCount = $('#cats-count');
const progressEl = $('#progress');
const scoreEl = $('#score');
const hungerSec = $('#hunger-sec');
const hungerFill = $('#hunger-fill');
const bestEl = $('#best');
const againBtn = $<HTMLButtonElement>('#again');

updateScale();
window.addEventListener('resize', updateScale);

const game = new Game(stage, hud);
if (import.meta.env.DEV) Object.assign(window, { game }); // handy in the dev console

/* ---------- icons: the game's own sprites, cropped to a portrait ---------- */

const portrait = (svg: string, viewBox: string): string => svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
$('#icon-cat').innerHTML = portrait(catSvg(PALETTES[1]), '22 4 76 76');
$('#icon-fish').innerHTML = itemSvg('fish');
$('#win-treats').textContent = String(WIN_TREATS);

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
  if (best !== null) bestEl.textContent = `Рекорд: ${best} ${plural(best, 'очко', 'очка', 'очков')}`;
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
  pick.hidden = true;
  gameover.hidden = true;
  hud.hidden = false;
  showBackButton(true);
  game.start(clampHunger(Number(hungerInput.value)));
  renderHud(true);
}

function showMenu(): void {
  pick.hidden = true;
  gameover.hidden = true;
  hud.hidden = true;
  showBackButton(false);
  showBest();
  menu.hidden = false;
  game.showMenu();
}

/** Level done: the card with three special cats; the game stays frozen until one is chosen. */
function showPick(level: number, won: boolean): void {
  const bonus = won ? WIN_BONUS : LEVEL_BONUS * level;
  $('#pick-level').textContent = `Уровень ${level} пройден · +${bonus} очков`;
  choicesEl.replaceChildren(...game.choices.map(choiceButton));
  gameover.hidden = true;
  hud.hidden = false;
  pick.hidden = false;
}

function choiceButton(info: PerkInfo): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'choice';
  b.innerHTML =
    `<span class="portrait">${portrait(catSvg(info.palette, info.accessory), '22 4 76 76')}</span>` +
    `<b>${info.name}</b><small>${info.desc}</small>`;
  b.addEventListener('click', () => {
    haptic.tap();
    game.choose(info);
    pick.hidden = true;
    renderHud(true);
  });
  return b;
}

/** Results after a win or after the last cat left; a win can be played on. */
function showResults(stats: GameStats, won: boolean): void {
  const best = load(BEST_KEY) ?? 0;
  const record = stats.score > best;
  if (record) {
    save(BEST_KEY, stats.score);
    cloudSet(CLOUD_BEST_KEY, String(stats.score));
  }
  $('#r-title').textContent = won ? 'Победа! Котики наелись' : 'Котики разбежались';
  $('#r-score').textContent = String(stats.score);
  $('#r-treats').textContent = String(stats.treats);
  $('#r-stolen').textContent = String(stats.stolen);
  $('#r-level').textContent = String(stats.level);
  $('#r-streak').textContent = `×${stats.bestStreak}`;
  $('#r-max').textContent = String(stats.maxCats);
  $('#r-time').textContent = `${Math.round(stats.time)} с`;
  $('#r-best').hidden = !record;
  againBtn.textContent = won ? 'Играть дальше' : 'Ещё раз';
  if (won || record) haptic.success();
  else haptic.warning();
  hud.hidden = true;
  gameover.hidden = false;
}

/** The level whose pick card is pending; after a win the card waits behind the results. */
let pendingLevel = 0;

game.onLevelComplete = (level, won) => {
  pendingLevel = level;
  renderHud(true); // the HUD under the card already shows the next level
  if (won) {
    showResults(game.stats, true);
  } else {
    haptic.success();
    showPick(level, false);
  }
};
game.onGameOver = (stats) => showResults(stats, false);
game.onTreat = () => haptic.tap();

$('#start').addEventListener('click', startGame);
againBtn.addEventListener('click', () => {
  // After a win the game is paused on a pick; "play on" means choosing the next cat.
  if (game.phase === 'pick') showPick(pendingLevel, true);
  else startGame();
});
$('#to-menu').addEventListener('click', showMenu);
$('#quit').addEventListener('click', showMenu);

/* ---------- HUD ---------- */

let lastCats = -1;
let lastProgress = '';
let lastScore = -1;
let lastSec = '';

function renderHud(force = false): void {
  const n = game.cats.length;
  if (force || n !== lastCats) {
    lastCats = n;
    catsCount.textContent = String(n);
  }
  const progress = `${game.progress}/${game.need}`;
  if (force || progress !== lastProgress) {
    lastProgress = progress;
    progressEl.textContent = progress;
  }
  if (force || game.stats.score !== lastScore) {
    lastScore = game.stats.score;
    scoreEl.textContent = String(lastScore);
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
