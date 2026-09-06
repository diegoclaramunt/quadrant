import { QUADRANT_PRIORITY, eisenhowerQuadrant } from './eisenhower';
import { canAssignTaskToSlot, type Occupancy } from './compatibility';
import { addDays, mondayOf } from './clock';
import { conflictError } from './errors';
import type {
  PlanReservation,
  PlanningProposal,
  ProposalAssignment,
  Task,
  UnmatchedTask,
  WeekSlot,
  WorkBlock,
} from './types';

export interface PlanningContext {
  today: string;
  weekStart?: string;
  tasks: Task[];
  slots: WeekSlot[];
  blocks: WorkBlock[];
  hiddenTaskIds: Set<string>;
  reservations?: PlanReservation[];
}

export function sortPlanningCandidates(
  tasks: Task[],
  today: string,
  weekStart = mondayOf(today),
): Task[] {
  const end = addDays(weekStart, 6);
  const byDeadline = (a: Task, b: Task) =>
    (a.deadline ?? '9999-12-31').localeCompare(b.deadline ?? '9999-12-31');
  return [...tasks].sort((a, b) => {
    const aDue = Boolean(a.deadline && a.deadline <= end);
    const bDue = Boolean(b.deadline && b.deadline <= end);
    if (aDue !== bDue) return aDue ? -1 : 1;
    if (aDue && byDeadline(a, b)) return byDeadline(a, b);
    const quadrant =
      QUADRANT_PRIORITY[eisenhowerQuadrant(a.urgent, a.important)] -
      QUADRANT_PRIORITY[eisenhowerQuadrant(b.urgent, b.important)];
    return (
      quadrant ||
      byDeadline(a, b) ||
      (a.processedAt ?? a.createdAt).localeCompare(
        b.processedAt ?? b.createdAt,
      ) ||
      a.id.localeCompare(b.id)
    );
  });
}

export function proposePlan(
  context: PlanningContext,
  proposalId: string,
  weekPlanId: string,
  createdAt: string,
): Omit<PlanningProposal, 'acceptedAt'> {
  const weekStart = context.weekStart ?? mondayOf(context.today);
  const reservations = (context.reservations ?? []).map((item) => ({
    ...item,
  }));
  const occupancy = new Map<string, Occupancy>(
    context.slots.map((slot) => [
      slot.id,
      {
        slot,
        blocks: context.blocks.filter((block) => block.slotId === slot.id),
      },
    ]),
  );
  const tasksById = new Map(context.tasks.map((task) => [task.id, task]));
  const assignments: ProposalAssignment[] = [];
  const unmatched: UnmatchedTask[] = [];
  const eligible = (task: Task) =>
    task.status === 'backlog' &&
    !context.hiddenTaskIds.has(task.id) &&
    Boolean(task.workType);
  const available = (task: Task, slot: WeekSlot) => {
    const date = addDays(weekStart, slot.weekday - 1);
    return (
      date >= context.today && (!task.availableOn || task.availableOn <= date)
    );
  };
  const alreadyPlanned = (task: Task) =>
    task.workType !== 'project' &&
    (context.blocks.some(
      (block) => block.taskId === task.id && block.status === 'planned',
    ) ||
      assignments.some((assignment) => assignment.taskId === task.id));
  const assign = (task: Task, place: Occupancy, minutes: number) => {
    assignments.push({
      taskId: task.id,
      slotId: place.slot.id,
      nominalMinutes: minutes,
    });
    place.blocks.push({
      id: `proposal-${proposalId}-${assignments.length}`,
      weekPlanId,
      slotId: place.slot.id,
      taskId: task.id,
      status: 'planned',
      nominalMinutes: minutes,
      createdAt,
      executedAt: null,
      cancelledAt: null,
    });
  };

  const seen = new Set<string>();
  for (const reservation of reservations) {
    const key = JSON.stringify([reservation.taskId, reservation.slotId]);
    const task = tasksById.get(reservation.taskId);
    const place = occupancy.get(reservation.slotId);
    if (
      seen.has(key) ||
      !task ||
      !place ||
      !eligible(task) ||
      alreadyPlanned(task) ||
      !available(task, place.slot)
    ) {
      throw conflictError(
        'Reserva duplicada, no disponible o fuera del backlog y la semana',
      );
    }
    seen.add(key);
    const match = canAssignTaskToSlot(task, place, tasksById);
    if (!match.ok) throw conflictError(match.reason);
    assign(task, place, match.minutes);
  }

  const reservedTasks = new Set(reservations.map((item) => item.taskId));
  const slots = [...context.slots].sort(
    (a, b) =>
      a.weekday - b.weekday || a.order - b.order || a.id.localeCompare(b.id),
  );
  const candidates = sortPlanningCandidates(
    context.tasks.filter(eligible),
    context.today,
    weekStart,
  );
  for (const task of candidates) {
    if (reservedTasks.has(task.id)) continue;
    if (alreadyPlanned(task)) {
      unmatched.push({ taskId: task.id, reason: 'already_planned' });
      continue;
    }
    const compatible = slots.filter(
      (slot) => (slot.kind === 'project') === (task.workType === 'project'),
    );
    const dated = compatible.filter((slot) => available(task, slot));
    let assigned = false;
    for (const slot of dated) {
      const place = occupancy.get(slot.id)!;
      const match = canAssignTaskToSlot(task, place, tasksById);
      if (match.ok) {
        assign(task, place, match.minutes);
        assigned = true;
        break;
      }
    }
    if (!assigned)
      unmatched.push({
        taskId: task.id,
        reason:
          compatible.length === 0
            ? 'no_compatible_slot'
            : dated.length === 0
              ? 'not_available'
              : 'slot_full',
      });
  }
  return {
    id: proposalId,
    weekPlanId,
    createdAt,
    reservations,
    assignments,
    unmatched,
    emptySlots: slots
      .filter(
        (slot) =>
          !occupancy
            .get(slot.id)!
            .blocks.some(
              (block) =>
                block.status === 'planned' || block.status === 'executed',
            ),
      )
      .map((slot) => slot.id),
  };
}
