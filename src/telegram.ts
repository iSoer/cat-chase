/**
 * Thin bridge to the Telegram Mini App API (`window.Telegram.WebApp`).
 * Every helper is a no-op outside Telegram, so the game keeps working in a plain browser.
 * Docs: https://core.telegram.org/bots/webapps
 */

interface TgInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TgWebApp {
  platform: string;
  version: string;
  colorScheme: 'light' | 'dark';
  /** Bot API 8.0+: system insets (status bar, notch, home indicator). */
  safeAreaInset?: TgInset;
  /** Bot API 8.0+: space taken by Telegram's own header controls. */
  contentSafeAreaInset?: TgInset;
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  };
  CloudStorage: {
    getItem(key: string, cb: (err: unknown, value?: string) => void): void;
    setItem(key: string, value: string, cb?: (err: unknown, stored?: boolean) => void): void;
  };
  ready(): void;
  expand(): void;
  isVersionAtLeast(version: string): boolean;
  disableVerticalSwipes(): void;
  requestFullscreen(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  onEvent(event: string, cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

/** The bridge script also loads in a normal browser; there `platform` is 'unknown'. */
const tg: TgWebApp | null =
  window.Telegram?.WebApp && window.Telegram.WebApp.platform !== 'unknown' ? window.Telegram.WebApp : null;

export const inTelegram = tg !== null;

/** The WebApp object when running inside a Telegram client that supports `version` of the Bot API. */
function since(version: string): TgWebApp | null {
  return tg && tg.isVersionAtLeast(version) ? tg : null;
}

export interface TelegramHooks {
  /** Telegram's light/dark setting (called once on start and on every change). */
  onTheme: (scheme: 'light' | 'dark') => void;
  /** The native back button in the Telegram header was pressed. */
  onBack: () => void;
}

/** Tell Telegram the app is ready, take the whole screen and wire theme, safe area and back button. */
export function initTelegram(hooks: TelegramHooks): void {
  if (!tg) return;
  const app = tg;

  app.ready();
  app.expand();
  // Dragging the yarn ball up and down must not minimise or close the app.
  since('7.7')?.disableVerticalSwipes();
  // On phones the playground takes the whole screen; desktop keeps the normal window.
  if (app.platform === 'android' || app.platform === 'ios') since('8.0')?.requestFullscreen();

  const applyTheme = (): void => {
    hooks.onTheme(app.colorScheme);
    // Paint the header and the area behind the app in the game's own background colour.
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (/^#[0-9a-f]{6}$/i.test(bg)) {
      since('6.9')?.setHeaderColor(bg);
      since('6.9')?.setBackgroundColor(bg);
    }
  };
  applyTheme();
  app.onEvent('themeChanged', applyTheme);

  applySafeArea();
  app.onEvent('safeAreaChanged', applySafeArea);
  app.onEvent('contentSafeAreaChanged', applySafeArea);

  since('6.1')?.BackButton.onClick(hooks.onBack);
}

/** Keep the HUD and overlays clear of the status bar and Telegram's own header buttons. */
function applySafeArea(): void {
  // Older clients report nothing; the CSS then keeps its env(safe-area-inset-*) defaults.
  if (!tg || (!tg.safeAreaInset && !tg.contentSafeAreaInset)) return;
  const zero: TgInset = { top: 0, bottom: 0, left: 0, right: 0 };
  const system = tg.safeAreaInset ?? zero;
  const content = tg.contentSafeAreaInset ?? zero;
  const root = document.documentElement.style;
  root.setProperty('--safe-top', `${system.top + content.top}px`);
  root.setProperty('--safe-bottom', `${system.bottom + content.bottom}px`);
  root.setProperty('--safe-left', `${system.left + content.left}px`);
  root.setProperty('--safe-right', `${system.right + content.right}px`);
}

/** Telegram's own back button in the header: shown during a game and on the results screen. */
export function showBackButton(visible: boolean): void {
  const app = since('6.1');
  if (!app) return;
  if (visible) app.BackButton.show();
  else app.BackButton.hide();
}

export const haptic = {
  /** A cat just ate a treat. */
  tap(): void {
    since('6.1')?.HapticFeedback.impactOccurred('light');
  },
  /** New record. */
  success(): void {
    since('6.1')?.HapticFeedback.notificationOccurred('success');
  },
  /** The cats ran away. */
  warning(): void {
    since('6.1')?.HapticFeedback.notificationOccurred('warning');
  },
};

/**
 * Per-user cloud storage shared across the user's devices (Bot API 6.9+).
 * Keys may contain only `A-Z`, `a-z`, `0-9`, `_` and `-`.
 */
export function cloudGet(key: string, cb: (value: string | null) => void): void {
  since('6.9')?.CloudStorage.getItem(key, (err, value) => cb(err || !value ? null : value));
}

export function cloudSet(key: string, value: string): void {
  since('6.9')?.CloudStorage.setItem(key, value);
}
