import { QUADRANT_PRIORITY, eisenhowerQuadrant } from './eisenhower';
import type { Occupancy } from './compatibility';
import { canAssignTaskToSlot } from './compatibility';
import type {
  PlanningProposal,
  ProposalAssignment,
  Task,
  UnmatchedReason,
  UnmatchedTask,
  WeekSlot,
  WorkBlock,
} from './types';

export interface PlanningContext {
  today: string;
  tasks: Task[];
  slots: WeekSlot[];
  blocks: WorkBlock[];
  hiddenTaskIds: Set<string>;
}

export function sortPlanningCandidates(tasks: Task[], today: string): Task[] {
  return [...tasks].sort((a, b) => {
    const deadlineRank = (task: Task) => {
      if (!task.deadline) {
        return Number.POSITIVE_INFINITY;
      }
      return task.deadline < today ? -1 : task.deadline.localeCompare(today);
    };
    const deadlineDelta = deadlineRank(a) - deadlineRank(b);
    if (deadlineDelta !== 0) {
      return deadlineDelta;
    }
    const quadrantDelta =
      QUADRANT_PRIORITY[eisenhowerQuadrant(a.urgent, a.important)] -
      QUADRANT_PRIORITY[eisenhowerQuadrant(b.urgent, b.important)];
    if (quadrantDelta !== 0) {
      return quadrantDelta;
    }
    const aAge = a.processedAt ?? a.createdAt;
    const bAge = b.processedAt ?? b.createdAt;
    return aAge.localeCompare(bAge);
  });
}

export function unmatchedReasonFor(
  task: Task,
  today: string,
  plannedBlocks: WorkBlock[],
  hadCompatibleSlot: boolean,
  hadCapacity: boolean,
): UnmatchedReason {
  if (task.availableOn && task.availableOn > today) {
    return 'not_available';
  }
  if (
    task.workType !== 'project' &&
    plannedBlocks.some((block) => block.status === 'planned')
  ) {
    return 'already_planned';
  }
  if (!hadCompatibleSlot) {
    return 'no_compatible_slot';
  }
  if (!hadCapacity) {
    return 'slot_full';
  }
  return 'no_compatible_slot';
}

export function proposePlan(
  context: PlanningContext,
  proposalId: string,
  weekPlanId: string,
  createdAt: string,
): Omit<PlanningProposal, 'acceptedAt'> {
  const occupancyBySlot = new Map<string, Occupancy>();
  for (const slot of context.slots) {
    occupancyBySlot.set(slot.id, {
      slot,
      blocks: context.blocks.filter((block) => block.slotId === slot.id),
    });
  }
  const tasksById = new Map(context.tasks.map((task) => [task.id, task]));
  const assignments: ProposalAssignment[] = [];
  const unmatched: UnmatchedTask[] = [];
  const candidates = sortPlanningCandidates(
    context.tasks.filter((task) => {
      if (task.status !== 'backlog') {
        return false;
      }
      if (context.hiddenTaskIds.has(task.id)) {
        return false;
      }
      if (!task.workType) {
        return false;
      }
      return true;
    }),
    context.today,
  );

  const orderedSlots = [...context.slots].sort((a, b) => {
    if (a.weekday !== b.weekday) {
      return a.weekday - b.weekday;
    }
    return a.order - b.order;
  });

  for (const task of candidates) {
    const plannedForTask = context.blocks.filter(
      (block) =>
        block.taskId === task.id &&
        (block.status === 'planned' ||
          assignments.some((item) => item.taskId === task.id)),
    );
    const virtualPlanned = [
      ...plannedForTask,
      ...assignments
        .filter((item) => item.taskId === task.id)
        .map((item) => ({
          id: item.slotId,
          weekPlanId,
          slotId: item.slotId,
          taskId: task.id,
          status: 'planned' as const,
          nominalMinutes: item.nominalMinutes,
          createdAt,
          executedAt: null,
          cancelledAt: null,
        })),
    ];

    if (task.availableOn && task.availableOn > context.today) {
      unmatched.push({ taskId: task.id, reason: 'not_available' });
      continue;
    }
    if (
      task.workType !== 'project' &&
      virtualPlanned.some((block) => block.status === 'planned')
    ) {
      unmatched.push({ taskId: task.id, reason: 'already_planned' });
      continue;
    }

    let hadCompatibleSlot = false;
    let hadCapacity = false;
    let assigned = false;
    for (const slot of orderedSlots) {
      const occupancy = occupancyBySlot.get(slot.id);
      if (!occupancy) {
        continue;
      }
      const compatibleKind =
        (slot.kind === 'project' && task.workType === 'project') ||
        (slot.kind === 'deep' && task.workType !== 'project');
      if (compatibleKind) {
        hadCompatibleSlot = true;
      }
      const result = canAssignTaskToSlot(task, occupancy, tasksById);
      if (result.ok) {
        assignments.push({
          taskId: task.id,
          slotId: slot.id,
          nominalMinutes: result.minutes,
        });
        occupancy.blocks = [
          ...occupancy.blocks,
          {
            id: `proposal-${proposalId}-${task.id}-${slot.id}`,
            weekPlanId,
            slotId: slot.id,
            taskId: task.id,
            status: 'planned',
            nominalMinutes: result.minutes,
            createdAt,
            executedAt: null,
            cancelledAt: null,
          },
        ];
        assigned = true;
        break;
      }
      if (compatibleKind) {
        hadCapacity =
          hadCapacity ||
          result.reason.includes('superaría') ||
          result.reason.includes('ocupado');
      }
    }
    if (!assigned) {
      unmatched.push({
        taskId: task.id,
        reason: unmatchedReasonFor(
          task,
          context.today,
          virtualPlanned,
          hadCompatibleSlot,
          hadCapacity,
        ),
      });
    }
  }

  const usedSlotIds = new Set(assignments.map((item) => item.slotId));
  const emptySlots = context.slots
    .filter((slot) => {
      const occupancy = occupancyBySlot.get(slot.id);
      if (!occupancy) {
        return true;
      }
      const active = occupancy.blocks.filter(
        (block) => block.status === 'planned' || block.status === 'executed',
      );
      return active.length === 0 && !usedSlotIds.has(slot.id);
    })
    .map((slot) => slot.id);

  return {
    id: proposalId,
    weekPlanId,
    createdAt,
    assignments,
    unmatched,
    emptySlots,
  };
}
