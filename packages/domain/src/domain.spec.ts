import {
  BRIEF_MINUTES,
  DEEP_DEFAULT_MINUTES,
  PROJECT_MINUTES,
  SHORT_DEFAULT_MINUTES,
  type Occupancy,
  type Task,
  type WeekSlot,
} from './index';
import { eisenhowerQuadrant } from './eisenhower';
import { canAssignTaskToSlot } from './compatibility';
import {
  currentMonday,
  mondayOf,
  todayIso,
  tomorrowIso,
  type Clock,
} from './clock';
import { consecutivePostponements, shouldSuggestArchive } from './postponement';
import { applyProjectAssociation, effectiveCategoryId } from './task';
import { defaultTemplateSlots } from './week';
import { proposePlan, sortPlanningCandidates } from './planning';
import { plannedBlockMinutes } from './work-type';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Tarea',
    notes: null,
    originalText: 'Tarea',
    channel: 'ui',
    projectId: null,
    categoryId: null,
    status: 'backlog',
    snoozeOrigin: null,
    previousStatus: null,
    urgent: false,
    important: false,
    workType: 'short',
    nominalMinutes: 30,
    deadline: null,
    availableOn: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    processedAt: '2026-09-01T10:00:00.000Z',
    completedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

function slot(overrides: Partial<WeekSlot> = {}): WeekSlot {
  return {
    id: 's1',
    weekPlanId: 'w1',
    weekday: 1,
    order: 1,
    kind: 'deep',
    durationMinutes: 90,
    startTime: null,
    ...overrides,
  };
}

describe('eisenhower', () => {
  it('deriva los cuatro cuadrantes', () => {
    expect(eisenhowerQuadrant(true, true)).toBe('ui');
    expect(eisenhowerQuadrant(false, true)).toBe('in');
    expect(eisenhowerQuadrant(true, false)).toBe('un');
    expect(eisenhowerQuadrant(false, false)).toBe('nn');
  });
});

describe('category invariant', () => {
  it('hereda la categoría del proyecto y descarta la directa', () => {
    const associated = applyProjectAssociation(
      task({ categoryId: 'c-direct' }),
      {
        id: 'p1',
        name: 'Gemelo digital',
        categoryId: 'c-project',
        archivedAt: null,
      },
    );
    expect(associated.projectId).toBe('p1');
    expect(associated.categoryId).toBeNull();
    expect(
      effectiveCategoryId(associated, {
        id: 'p1',
        name: 'Gemelo digital',
        categoryId: 'c-project',
        archivedAt: null,
      }),
    ).toBe('c-project');
  });
});

describe('postponements', () => {
  it('cuenta decisiones, no semanas, y sugiere al cuarto', () => {
    const postponements = [
      {
        id: '1',
        taskId: 't1',
        fromStatus: 'inbox' as const,
        resumeWeekStart: '2026-09-08',
        createdAt: '2026-08-10T00:00:00.000Z',
        resumedAt: null,
      },
      {
        id: '2',
        taskId: 't1',
        fromStatus: 'inbox' as const,
        resumeWeekStart: '2026-09-29',
        createdAt: '2026-08-17T00:00:00.000Z',
        resumedAt: null,
      },
      {
        id: '3',
        taskId: 't1',
        fromStatus: 'inbox' as const,
        resumeWeekStart: '2026-09-08',
        createdAt: '2026-08-24T00:00:00.000Z',
        resumedAt: null,
      },
      {
        id: '4',
        taskId: 't1',
        fromStatus: 'inbox' as const,
        resumeWeekStart: '2026-09-08',
        createdAt: '2026-08-31T00:00:00.000Z',
        resumedAt: null,
      },
    ];
    expect(consecutivePostponements(postponements.slice(0, 1), [])).toBe(1);
    expect(shouldSuggestArchive(postponements, [])).toBe(true);
    expect(
      consecutivePostponements(postponements, [
        {
          id: 'r',
          taskId: 't1',
          reason: 'process',
          createdAt: '2026-08-20T00:00:00.000Z',
        },
      ]),
    ).toBe(2);
  });
});

describe('compatibility', () => {
  const empty: Occupancy = {
    slot: slot({ kind: 'project', durationMinutes: 120 }),
    blocks: [],
  };

  it('admite exactamente una tarea project en slot project', () => {
    const result = canAssignTaskToSlot(
      task({ workType: 'project', nominalMinutes: null }),
      empty,
      new Map(),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.minutes).toBe(PROJECT_MINUTES);
    }
  });

  it('agrupa short/brief hasta la capacidad y rechaza mezcla con deep', () => {
    const deepSlot: Occupancy = {
      slot: slot(),
      blocks: [
        {
          id: 'b1',
          weekPlanId: 'w1',
          slotId: 's1',
          taskId: 't-short',
          status: 'planned',
          nominalMinutes: 30,
          createdAt: '2026-09-01T00:00:00.000Z',
          executedAt: null,
          cancelledAt: null,
        },
      ],
    };
    const tasks = new Map<string, Task>([
      [
        't-short',
        task({ id: 't-short', workType: 'short', nominalMinutes: 30 }),
      ],
    ]);
    const brief = canAssignTaskToSlot(
      task({ id: 't-brief', workType: 'brief', nominalMinutes: null }),
      deepSlot,
      tasks,
    );
    expect(brief.ok).toBe(true);
    const tooMuch = canAssignTaskToSlot(
      task({ id: 't-big', workType: 'short', nominalMinutes: 70 }),
      deepSlot,
      tasks,
    );
    expect(tooMuch.ok).toBe(false);
    const mixed = canAssignTaskToSlot(
      task({ id: 't-deep', workType: 'deep', nominalMinutes: null }),
      deepSlot,
      tasks,
    );
    expect(mixed.ok).toBe(false);
  });
});

describe('default template', () => {
  it('ofrece dos deep de 90 y un project de 120 por día laborable', () => {
    const slots = defaultTemplateSlots();
    expect(slots).toHaveLength(15);
    for (let weekday = 1; weekday <= 5; weekday += 1) {
      const day = slots.filter((item) => item.weekday === weekday);
      expect(day.filter((item) => item.kind === 'deep')).toHaveLength(2);
      expect(day.filter((item) => item.kind === 'project')).toHaveLength(1);
      expect(
        day
          .filter((item) => item.kind === 'deep')
          .every((item) => item.durationMinutes === DEEP_DEFAULT_MINUTES),
      ).toBe(true);
      expect(day.find((item) => item.kind === 'project')?.durationMinutes).toBe(
        120,
      );
    }
  });
});

describe('nominal durations', () => {
  it('fija 120 para project y 90 por defecto para deep', () => {
    expect(plannedBlockMinutes('project', 'project', 120, null)).toBe(120);
    expect(
      plannedBlockMinutes('deep', 'deep', DEEP_DEFAULT_MINUTES, null),
    ).toBe(90);
    expect(plannedBlockMinutes('brief', 'deep', 90, null)).toBe(BRIEF_MINUTES);
    expect(plannedBlockMinutes('short', 'deep', 90, null)).toBe(
      SHORT_DEFAULT_MINUTES,
    );
  });
});

describe('planning heuristic', () => {
  it('ordena por fecha, cuadrante y antigüedad y explica no colocadas', () => {
    const older = task({
      id: 'old',
      urgent: true,
      important: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      processedAt: '2026-08-01T00:00:00.000Z',
      workType: 'deep',
      deadline: '2026-09-01',
    });
    const later = task({
      id: 'later',
      urgent: false,
      important: false,
      createdAt: '2026-08-02T00:00:00.000Z',
      processedAt: '2026-08-02T00:00:00.000Z',
      workType: 'project',
      deadline: '2026-09-10',
    });
    const unavailable = task({
      id: 'later-avail',
      workType: 'short',
      availableOn: '2026-09-20',
    });
    const sorted = sortPlanningCandidates(
      [later, older, unavailable],
      '2026-09-03',
    );
    expect(sorted.map((item) => item.id)).toEqual([
      'old',
      'later',
      'later-avail',
    ]);

    const proposal = proposePlan(
      {
        today: '2026-09-03',
        tasks: [older, later, unavailable],
        slots: [slot({ id: 'deep-1', kind: 'deep', durationMinutes: 90 })],
        blocks: [],
        hiddenTaskIds: new Set(),
      },
      'prop-1',
      'w1',
      '2026-09-03T00:00:00.000Z',
    );
    expect(proposal.assignments).toEqual([
      expect.objectContaining({ taskId: 'old', slotId: 'deep-1' }),
    ]);
    expect(proposal.unmatched).toEqual(
      expect.arrayContaining([
        { taskId: 'later', reason: 'no_compatible_slot' },
        { taskId: 'later-avail', reason: 'not_available' },
      ]),
    );
    expect(proposal.emptySlots).toEqual([]);
  });
});

describe('clock', () => {
  it('resuelve hoy, mañana y lunes ISO con zona horaria', () => {
    const clock: Clock = {
      now: () => new Date('2026-09-05T22:30:00.000Z'),
    };
    expect(todayIso(clock, 'UTC')).toBe('2026-09-05');
    expect(tomorrowIso(clock, 'UTC')).toBe('2026-09-06');
    expect(mondayOf('2026-09-03')).toBe('2026-08-31');
    expect(currentMonday(clock, 'America/Mexico_City')).toBe('2026-08-31');
  });
});
