const SPARKS = ['♥', '♥', '♥', '♥', '✦', '♪'];

export interface SparkOptions {
  /** Extra class for colouring, e.g. `score-cat`. */
  cls?: string;
  /** Font size in px; random 12–22 when omitted. */
  size?: number;
}

/** A little floating glyph (heart, note, "+1") that drifts up and fades out. */
export function spawnSpark(stage: HTMLElement, x: number, y: number, text?: string, opts: SparkOptions = {}): void {
  const s = document.createElement('span');
  s.className = opts.cls ? `spark ${opts.cls}` : 'spark';
  s.textContent = text ?? SPARKS[Math.floor(Math.random() * SPARKS.length)];
  s.style.left = `${x.toFixed(0)}px`;
  s.style.top = `${y.toFixed(0)}px`;
  s.style.fontSize = `${(opts.size ?? 12 + Math.random() * 10).toFixed(0)}px`;
  s.style.setProperty('--hx', `${((Math.random() - 0.5) * 30).toFixed(0)}px`);
  stage.appendChild(s);
  window.setTimeout(() => s.remove(), 1500);
}
