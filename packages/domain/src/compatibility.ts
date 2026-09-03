import type { SlotKind, Task, WorkBlock, WorkType, WeekSlot } from './types';
import { conflictError, validationError } from './errors';
import { plannedBlockMinutes } from './work-type';

export interface Occupancy {
  slot: WeekSlot;
  blocks: WorkBlock[];
}

export function remainingCapacity(occupancy: Occupancy): number {
  const used = occupancy.blocks
    .filter(
      (block) => block.status === 'planned' || block.status === 'executed',
    )
    .reduce((sum, block) => sum + block.nominalMinutes, 0);
  return occupancy.slot.durationMinutes - used;
}

export function occupyingWorkTypes(
  occupancy: Occupancy,
  tasksById: Map<string, Task>,
): WorkType[] {
  return occupancy.blocks
    .filter(
      (block) => block.status === 'planned' || block.status === 'executed',
    )
    .map((block) => tasksById.get(block.taskId)?.workType)
    .filter((type): type is WorkType => Boolean(type));
}

export function canAssignTaskToSlot(
  task: Task,
  occupancy: Occupancy,
  tasksById: Map<string, Task>,
): { ok: true; minutes: number } | { ok: false; reason: string } {
  if (!task.workType) {
    return { ok: false, reason: 'La tarea no tiene tipo de trabajo' };
  }
  const slot = occupancy.slot;
  const active = occupancy.blocks.filter(
    (block) => block.status === 'planned' || block.status === 'executed',
  );
  const types = occupyingWorkTypes(occupancy, tasksById);
  const minutes = plannedBlockMinutes(
    task.workType,
    slot.kind,
    slot.durationMinutes,
    task.nominalMinutes,
  );

  if (slot.kind === 'project') {
    if (task.workType !== 'project') {
      return {
        ok: false,
        reason: 'Un slot project solo admite una tarea project',
      };
    }
    if (active.length > 0) {
      return { ok: false, reason: 'El slot project ya está ocupado' };
    }
    return { ok: true, minutes };
  }

  if (task.workType === 'project') {
    return {
      ok: false,
      reason: 'Una tarea project solo puede ir a un slot project',
    };
  }

  if (task.workType === 'deep') {
    if (active.length > 0) {
      return {
        ok: false,
        reason: 'Un slot deep con ocupación no admite una tarea deep',
      };
    }
    return { ok: true, minutes };
  }

  if (types.includes('deep') || types.includes('project')) {
    return {
      ok: false,
      reason: 'Un slot ocupado por deep o project no admite más bloques',
    };
  }

  const remaining = remainingCapacity(occupancy);
  if (minutes > remaining) {
    return {
      ok: false,
      reason: 'La suma nominal superaría la duración del slot deep',
    };
  }
  return { ok: true, minutes };
}

export function assertAssignable(
  task: Task,
  occupancy: Occupancy,
  tasksById: Map<string, Task>,
): number {
  const result = canAssignTaskToSlot(task, occupancy, tasksById);
  if (!result.ok) {
    throw conflictError(result.reason);
  }
  return result.minutes;
}

export function assertNoDoubleBookingForNonProject(
  task: Task,
  plannedBlocksForTask: WorkBlock[],
): void {
  if (task.workType === 'project') {
    return;
  }
  const planned = plannedBlocksForTask.filter(
    (block) => block.status === 'planned',
  );
  if (planned.length > 0) {
    throw conflictError(
      'Una tarea no project no puede tener más de un bloque planned simultáneo',
    );
  }
}

export function assertSlotKind(kind: SlotKind): void {
  if (kind !== 'deep' && kind !== 'project') {
    throw validationError('Tipo de slot no soportado');
  }
}
