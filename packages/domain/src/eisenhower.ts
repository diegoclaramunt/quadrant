import type { Quadrant } from './types';

export function eisenhowerQuadrant(
  urgent: boolean,
  important: boolean,
): Quadrant {
  if (urgent && important) {
    return 'ui';
  }
  if (!urgent && important) {
    return 'in';
  }
  if (urgent && !important) {
    return 'un';
  }
  return 'nn';
}

export const QUADRANT_PRIORITY: Record<Quadrant, number> = {
  ui: 0,
  in: 1,
  un: 2,
  nn: 3,
};
