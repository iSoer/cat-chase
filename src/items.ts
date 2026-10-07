import type { Vec } from './vec';

export type ItemKind = 'fish' | 'mouse' | 'cookie';

export const ITEM_KINDS: ItemKind[] = ['fish', 'mouse', 'cookie'];

export function randomKind(): ItemKind {
  return ITEM_KINDS[Math.floor(Math.random() * ITEM_KINDS.length)];
}

export function itemSvg(kind: ItemKind): string {
  switch (kind) {
    case 'fish':
      return `
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M27 20 L37 11 L35 20 L37 29 Z" fill="#8cc9ff" stroke="#4f8fd1" stroke-width="1.5" stroke-linejoin="round" />
  <path d="M5 20 C 9 9, 24 7, 31 20 C 24 33, 9 31, 5 20 Z" fill="#8cc9ff" stroke="#4f8fd1" stroke-width="1.5" />
  <path d="M8 20 C 12 15, 22 15, 27 20" fill="none" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round" />
  <path d="M19 13 q4 7 0 14" fill="none" stroke="#4f8fd1" stroke-width="1.5" stroke-linecap="round" />
  <circle cx="12" cy="18" r="2.6" fill="#2e1f33" />
  <circle cx="13" cy="17" r="1" fill="#fff" />
</svg>`;
    case 'mouse':
      return `
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M30 23 q9 -3 6 9" fill="none" stroke="#8f98b8" stroke-width="2" stroke-linecap="round" />
  <path d="M6 24 C 6 15, 18 12, 26 16 C 33 19, 33 30, 24 32 L 10 32 C 6 32, 5 28, 6 24 Z" fill="#d6daea" stroke="#8f98b8" stroke-width="1.5" />
  <circle cx="14" cy="15" r="4.5" fill="#d6daea" stroke="#8f98b8" stroke-width="1.5" />
  <circle cx="14" cy="15" r="2.4" fill="#ffc4d2" />
  <circle cx="9" cy="23" r="1.7" fill="#2e1f33" />
  <circle cx="5.5" cy="26" r="1.8" fill="#ff8fa8" />
  <path d="M4 24 l-3 -1 M4 27 l-3 1" stroke="#8f98b8" stroke-width="1" stroke-linecap="round" />
</svg>`;
    case 'cookie':
      return `
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="20" cy="20" r="14" fill="#f3c27b" stroke="#c98a3e" stroke-width="1.5" />
  <circle cx="20" cy="24" r="4.5" fill="#b9772f" opacity=".55" />
  <circle cx="12" cy="17" r="2.3" fill="#b9772f" opacity=".55" />
  <circle cx="17" cy="12.5" r="2.3" fill="#b9772f" opacity=".55" />
  <circle cx="23" cy="12.5" r="2.3" fill="#b9772f" opacity=".55" />
  <circle cx="28" cy="17" r="2.3" fill="#b9772f" opacity=".55" />
</svg>`;
  }
}

export class Item {
  readonly el: HTMLDivElement;
  readonly pos: Vec;
  readonly kind: ItemKind;

  constructor(stage: HTMLElement, kind: ItemKind, pos: Vec) {
    this.kind = kind;
    this.pos = { ...pos };
    this.el = document.createElement('div');
    this.el.className = `item item-${kind}`;
    this.el.style.transform = `translate3d(${pos.x.toFixed(0)}px, ${pos.y.toFixed(0)}px, 0)`;
    this.el.innerHTML = `<div class="bob">${itemSvg(kind)}</div>`;
    stage.appendChild(this.el);
  }

  /** Burst and disappear after someone picked it up. */
  vanish(): void {
    const el = this.el;
    el.classList.add('is-gone');
    window.setTimeout(() => el.remove(), 400);
  }
}
