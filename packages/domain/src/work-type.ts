import {
  BRIEF_MINUTES,
  DEEP_MAX_MINUTES,
  DEEP_MIN_MINUTES,
  PROJECT_MINUTES,
  SHORT_DEFAULT_MINUTES,
  type WorkType,
} from './types';
import { validationError } from './errors';

export function declaredTaskDuration(
  workType: WorkType,
  nominalMinutes?: number | null,
): number | null {
  if (workType === 'brief') {
    return BRIEF_MINUTES;
  }
  if (workType === 'short') {
    return nominalMinutes ?? SHORT_DEFAULT_MINUTES;
  }
  if (workType === 'deep' || workType === 'project') {
    return null;
  }
  return null;
}

export function slotDurationForKind(
  kind: 'deep' | 'project',
  durationMinutes?: number | null,
): number {
  if (kind === 'project') {
    return PROJECT_MINUTES;
  }
  const value = durationMinutes ?? 90;
  if (value < DEEP_MIN_MINUTES || value > DEEP_MAX_MINUTES) {
    throw validationError(
      `La duración de un slot deep debe estar entre ${DEEP_MIN_MINUTES} y ${DEEP_MAX_MINUTES} minutos`,
    );
  }
  return value;
}

export function plannedBlockMinutes(
  workType: WorkType,
  slotKind: 'deep' | 'project',
  slotMinutes: number,
  declaredMinutes?: number | null,
): number {
  if (workType === 'project') {
    return PROJECT_MINUTES;
  }
  if (workType === 'deep') {
    return slotMinutes;
  }
  if (workType === 'brief') {
    return BRIEF_MINUTES;
  }
  return declaredMinutes ?? SHORT_DEFAULT_MINUTES;
}

export function assertShortDuration(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes >= 60) {
    throw validationError(
      'Una tarea short debe declarar una duración nominal menor de 60 minutos',
    );
  }
}
