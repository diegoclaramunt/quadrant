import {
  DEEP_DEFAULT_MINUTES,
  PROJECT_MINUTES,
  type SlotKind,
  type TemplateSlot,
} from './types';
import { validationError } from './errors';
import { slotDurationForKind } from './work-type';

export interface DefaultSlotSpec {
  weekday: number;
  order: number;
  kind: SlotKind;
  durationMinutes: number;
}

export function defaultTemplateSlots(): DefaultSlotSpec[] {
  const slots: DefaultSlotSpec[] = [];
  for (let weekday = 1; weekday <= 5; weekday += 1) {
    slots.push(
      {
        weekday,
        order: 1,
        kind: 'deep',
        durationMinutes: DEEP_DEFAULT_MINUTES,
      },
      {
        weekday,
        order: 2,
        kind: 'deep',
        durationMinutes: DEEP_DEFAULT_MINUTES,
      },
      {
        weekday,
        order: 3,
        kind: 'project',
        durationMinutes: PROJECT_MINUTES,
      },
    );
  }
  return slots;
}

export function normalizeTemplateSlot(input: {
  weekday: number;
  order: number;
  kind: SlotKind;
  durationMinutes?: number | null;
  startTime?: string | null;
}): Omit<TemplateSlot, 'id' | 'templateId'> {
  if (input.weekday < 1 || input.weekday > 7) {
    throw validationError('El día ISO de un slot debe estar entre 1 y 7');
  }
  const durationMinutes = slotDurationForKind(
    input.kind,
    input.kind === 'project' ? PROJECT_MINUTES : input.durationMinutes,
  );
  if (input.startTime && !/^\d{2}:\d{2}$/.test(input.startTime)) {
    throw validationError('La hora de inicio debe usar el formato HH:MM');
  }
  return {
    weekday: input.weekday,
    order: input.order,
    kind: input.kind,
    durationMinutes,
    startTime: input.startTime ?? null,
  };
}
