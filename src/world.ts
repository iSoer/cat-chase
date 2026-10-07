import type { Item } from './items';
import type { Vec } from './vec';

/** Everything a critter is allowed to look at when deciding where to go. */
export interface World {
  readonly cursor: Vec;
  readonly items: readonly Item[];
}
