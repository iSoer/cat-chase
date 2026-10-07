import { scale } from './scale';
import type { Vec } from './vec';

export type CritterKind = 'cat' | 'dog';

/** Shared body for cats and dogs: a sprite on the stage with simple steering physics. */
export abstract class Critter {
  readonly el: HTMLDivElement;
  readonly pos: Vec;
  readonly vel: Vec = { x: 0, y: 0 };

  protected readonly stage: HTMLElement;
  protected readonly rig: HTMLDivElement;
  /** Top speed in px/s at scale 1; see src/scale.ts. */
  protected readonly maxSpeed: number;
  protected readonly accel: number;
  protected facing = 1;

  private readonly flip: HTMLDivElement;
  private renderedFacing = 0;
  private renderedZ = -1;

  protected constructor(stage: HTMLElement, kind: CritterKind, svg: string, start: Vec, maxSpeed: number, accel: number) {
    this.stage = stage;
    this.pos = { ...start };
    this.maxSpeed = maxSpeed;
    this.accel = accel;

    this.el = document.createElement('div');
    this.el.className = `critter ${kind} is-running`;
    this.el.style.setProperty('--stride', `${(95 / maxSpeed).toFixed(3)}s`);
    this.el.style.setProperty('--wag', `${(220 / maxSpeed).toFixed(3)}s`);
    this.el.innerHTML =
      `<div class="pop"><div class="flip"><div class="rig">${svg}</div></div></div>` +
      `<div class="shadow"></div>`;
    this.flip = this.el.querySelector<HTMLDivElement>('.flip')!;
    this.rig = this.el.querySelector<HTMLDivElement>('.rig')!;
    stage.appendChild(this.el);
    this.render();
  }

  /**
   * Accelerate toward a point and move. With `arrive` the critter eases off on approach
   * so it stops near the point instead of overshooting. Returns the distance before moving.
   */
  protected steer(tx: number, ty: number, dt: number, arrive: boolean): number {
    const dx = tx - this.pos.x;
    const dy = ty - this.pos.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.001) {
      const ease = arrive ? 0.3 + 0.7 * Math.min(1, d / (90 * scale)) : 1;
      const speed = this.maxSpeed * scale * ease;
      let ax = (dx / d) * speed - this.vel.x;
      let ay = (dy / d) * speed - this.vel.y;
      const a = Math.hypot(ax, ay);
      const maxA = this.accel * scale * dt;
      if (a > maxA) {
        ax *= maxA / a;
        ay *= maxA / a;
      }
      this.vel.x += ax;
      this.vel.y += ay;
    }
    this.move(dt);
    if (Math.abs(this.vel.x) > 12 * scale) this.facing = this.vel.x > 0 ? 1 : -1;
    return d;
  }

  /** Keep sliding with the momentum it had, losing `damp` of it per second. */
  protected coast(dt: number, damp: number): void {
    const f = Math.pow(damp, dt);
    this.vel.x *= f;
    this.vel.y *= f;
    this.move(dt);
  }

  protected stop(): void {
    this.vel.x = 0;
    this.vel.y = 0;
  }

  protected render(): void {
    this.el.style.transform = `translate3d(${this.pos.x.toFixed(1)}px, ${this.pos.y.toFixed(1)}px, 0)`;
    const z = Math.max(1, Math.round(this.pos.y) + 10000);
    if (z !== this.renderedZ) {
      this.renderedZ = z;
      this.el.style.zIndex = String(z);
    }
    if (this.facing !== this.renderedFacing) {
      this.renderedFacing = this.facing;
      this.flip.style.transform = `scaleX(${this.facing})`;
    }
  }

  /** Pop out and leave the page. */
  dispose(): void {
    const el = this.el;
    el.classList.add('is-leaving');
    window.setTimeout(() => el.remove(), 350);
  }

  /** Drop from the page right away (already off screen). */
  removeNow(): void {
    this.el.remove();
  }

  private move(dt: number): void {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }
}
