import {
  DEEP_DEFAULT_MINUTES,
  PROJECT_MINUTES,
  type SlotKind,
  type TemplateSlot,
} from './types';
import { validationError } from './errors';
import { addDays, mondayOf } from './clock';
import type { WeekSlot, WorkBlock } from './types';
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

export function reviewWeekStart(today: string, target?: string): string {
  const current = mondayOf(today);
  const selected = target ?? current;
  if (selected !== current && selected !== addDays(current, 7)) {
    throw validationError(
      'El destino debe ser el lunes de la semana actual o siguiente',
    );
  }
  return selected;
}

export function weekCapacity(
  slots: Pick<WeekSlot, 'id' | 'weekday' | 'durationMinutes'>[],
  blocks: Pick<WorkBlock, 'slotId' | 'status' | 'nominalMinutes'>[],
) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const daySlots = slots.filter((slot) => slot.weekday === index + 1);
    const ids = new Set(daySlots.map((slot) => slot.id));
    const totalMinutes = daySlots.reduce(
      (sum, slot) => sum + slot.durationMinutes,
      0,
    );
    const occupiedMinutes = blocks
      .filter(
        (block) =>
          ids.has(block.slotId) &&
          (block.status === 'planned' || block.status === 'executed'),
      )
      .reduce((sum, block) => sum + block.nominalMinutes, 0);
    return {
      weekday: index + 1,
      totalMinutes,
      occupiedMinutes,
      freeMinutes: totalMinutes - occupiedMinutes,
    };
  });
  return {
    totalMinutes: days.reduce((sum, day) => sum + day.totalMinutes, 0),
    occupiedMinutes: days.reduce((sum, day) => sum + day.occupiedMinutes, 0),
    freeMinutes: days.reduce((sum, day) => sum + day.freeMinutes, 0),
    days,
  };
}

export function normalizeTemplateSlot(input: {
  weekday: number;
  order: number;
  kind: SlotKind;
  durationMinutes?: number | null;
  startTime?: string | null;
}): Omit<TemplateSlot, 'id' | 'templateId'> {
  if (
    !Number.isInteger(input.weekday) ||
    input.weekday < 1 ||
    input.weekday > 7
  ) {
    throw validationError('El día ISO de un slot debe estar entre 1 y 7');
  }
  if (
    !Number.isInteger(input.order) ||
    (input.kind !== 'deep' && input.kind !== 'project')
  ) {
    throw validationError('Indica orden y tipo de bloque válidos');
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
