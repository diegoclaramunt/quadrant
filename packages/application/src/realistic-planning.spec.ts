import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultIdGenerator, type Task } from '@quadrant/domain';
import { openStore } from '@quadrant/storage';
import type {
  HttpsQuadrantLocalSchemasWeekCurrentOutputJson as WeekResult,
  HttpsQuadrantLocalSchemasPlanProposeOutputJson as ProposalResult,
} from '@quadrant/capabilities';
import { createQuadrantApp } from './app';
import type { Envelope } from './envelope';

function value<T>(response: Envelope): T {
  expect(response.status).toBe('ok');
  if (response.status !== 'ok') throw new Error(JSON.stringify(response));
  return response.result as T;
}

function setup(filename = ':memory:') {
  const store = openStore(filename);
  store.repos.settings.setTimezone('Europe/Madrid');
  let now = new Date('2026-09-07T10:00:00Z');
  const app = createQuadrantApp(store, {
    clock: { now: () => now },
    ids: defaultIdGenerator(),
  });
  const confirm = (id: string, payload: Record<string, unknown> = {}) => {
    const first = app.invoke(id, payload);
    if (first.status !== 'needs_confirmation') return first;
    return app.invoke(id, {
      ...payload,
      confirmation_token: first.confirmation_token,
    });
  };
  const capture = (title: string, extra: Record<string, unknown> = {}) =>
    value<{ tasks: Task[] }>(
      app.invoke('inbox.capture_many', {
        items: [
          {
            title,
            channel: 'ui',
            alreadyProcessed: true,
            urgent: false,
            important: true,
            workType: 'short',
            ...extra,
          },
        ],
      }),
    ).tasks[0];
  const current = () => value<WeekResult>(app.invoke('week.current')).week;
  const open = () => value<WeekResult>(app.invoke('week.open')).week;
  const propose = (reservations: { taskId: string; slotId: string }[] = []) =>
    value<ProposalResult>(app.invoke('plan.propose', { reservations }))
      .proposal;
  return {
    store,
    app,
    confirm,
    capture,
    current,
    open,
    propose,
    setDate: (date: string) => {
      now = new Date(date);
    },
  };
}

describe('planificación realista — spec 2026-09-05', () => {
  it('suma capacidad nominal sin duplicar slots compartidos y aísla ajustes de la plantilla', () => {
    const q = setup();
    const week = q.open();
    expect(week.capacity?.totalMinutes).toBe(1500);
    expect(week.capacity?.days[0].totalMinutes).toBe(300);
    const slot = week.slots[0];
    const tasks = [q.capture('A'), q.capture('B')];
    const proposal = q.propose(
      tasks.map((task) => ({ taskId: task.id, slotId: slot.id })),
    );
    expect(q.current().blocks).toHaveLength(0);
    value(q.confirm('plan.accept', { proposalId: proposal.id }));
    expect(q.current().capacity?.days[0]).toMatchObject({
      occupiedMinutes: 60,
      freeMinutes: 240,
    });
    const blocks = q.current().blocks;
    value(q.app.invoke('block.execute', { blockId: blocks[0].id }));
    expect(q.current().capacity?.occupiedMinutes).toBe(60);
    const remove = week.slots[1];
    value(
      q.app.invoke('week.adjust_slots', {
        operations: [{ op: 'remove', slotId: remove.id }],
      }),
    );
    expect(q.current().capacity?.totalMinutes).toBe(1410);
    expect(q.store.repos.templates.slots(week.templateId!)).toHaveLength(15);
    q.store.close();
  });

  it('prioriza reservas y explica la fecha urgente que queda fuera', () => {
    const q = setup();
    const week = q.open();
    const slot = week.slots[0];
    value(
      q.app.invoke('week.adjust_slots', {
        operations: week.slots
          .slice(1)
          .map((item) => ({ op: 'remove', slotId: item.id })),
      }),
    );
    const important = q.capture('Importante sin fecha', { workType: 'deep' });
    const urgent = q.capture('Vence hoy', {
      workType: 'deep',
      deadline: '2026-09-07',
      urgent: true,
    });
    const reservations = [{ taskId: important.id, slotId: slot.id }];
    const proposal = q.propose(reservations);
    expect(proposal.reservations).toEqual(reservations);
    expect(proposal.assignments).toEqual([
      { ...reservations[0], nominalMinutes: 90 },
    ]);
    expect(proposal.unmatched).toContainEqual({
      taskId: urgent.id,
      reason: 'slot_full',
    });
    expect(q.current().blocks).toEqual([]);
    expect(
      q.app.invoke('plan.propose', {
        reservations: [...reservations, ...reservations],
      }).status,
    ).toBe('validation_error');
    expect(
      q.app.invoke('plan.propose', {
        reservations: [{ taskId: important.id, slotId: 'missing' }],
      }).status,
    ).toBe('conflict');
    q.store.close();
  });

  it('evalúa disponibilidad por slot y excluye fechas pasadas', () => {
    const q = setup();
    q.open();
    const task = q.capture('Disponible el jueves', { workType: 'deep' });
    value(
      q.app.invoke('task.update', {
        taskId: task.id,
        availableOn: '2026-09-10',
      }),
    );
    const proposal = q.propose();
    const assignment = proposal.assignments[0];
    expect(
      q.current().slots.find((slot) => slot.id === assignment.slotId)?.weekday,
    ).toBe(4);
    const mondaySlot = q.current().slots[0];
    expect(
      q.app.invoke('block.schedule', { taskId: task.id, slotId: mondaySlot.id })
        .status,
    ).toBe('conflict');
    q.setDate('2026-09-11T10:00:00Z');
    expect(
      q
        .current()
        .slots.find((slot) => slot.id === q.propose().assignments[0].slotId)
        ?.weekday,
    ).toBe(5);
    expect(
      q.app.invoke('block.schedule', {
        taskId: task.id,
        date: '2026-09-18',
        slotKind: 'deep',
      }).status,
    ).toBe('validation_error');
    q.store.close();
  });

  it('revisa el viernes hacia el lunes, reactiva orígenes y rechaza ejecución futura', () => {
    const q = setup();
    const first = q.open();
    const task = q.capture('Sesión abierta', { workType: 'project' });
    const block = value<{ block: { id: string } }>(
      q.app.invoke('block.schedule', {
        taskId: task.id,
        slotId: first.slots.find((slot) => slot.kind === 'project')!.id,
      }),
    ).block;
    const snoozed = q.capture('Revisar después');
    const inbox = value<{ tasks: Task[] }>(
      q.app.invoke('inbox.capture_many', {
        items: [{ title: 'Inbox pospuesto', channel: 'ui' }],
      }),
    ).tasks[0];
    for (const item of [snoozed, inbox])
      value(q.app.invoke('task.postpone', { taskId: item.id, weeksAhead: 1 }));
    q.setDate('2026-09-11T10:00:00Z');
    const preview = q.app.invoke('week.review', {
      targetWeekStart: '2026-09-14',
    });
    expect(preview.status).toBe('needs_confirmation');
    if (preview.status === 'needs_confirmation')
      expect(preview.summary).toContain('2026-09-14');
    value(
      q.confirm('week.review', {
        targetWeekStart: '2026-09-14',
        request_id: 'friday-review',
      }),
    );
    expect(q.store.repos.blocks.get(block.id)?.status).toBe('missed');
    expect(q.store.repos.tasks.get(task.id)?.status).toBe('backlog');
    expect(q.store.repos.tasks.get(snoozed.id)?.status).toBe('backlog');
    expect(q.store.repos.tasks.get(inbox.id)?.status).toBe('inbox');
    const next = q.current();
    expect(next.weekStart).toBe('2026-09-14');
    expect(next.blocks).toEqual([]);
    const future = value<{ block: { id: string } }>(
      q.app.invoke('block.schedule', {
        taskId: task.id,
        slotId: next.slots.find((slot) => slot.kind === 'project')!.id,
      }),
    ).block;
    expect(q.app.invoke('block.execute', { blockId: future.id }).status).toBe(
      'conflict',
    );
    q.setDate('2026-09-14T10:00:00Z');
    value(q.app.invoke('block.execute', { blockId: future.id }));
    expect(q.store.repos.tasks.get(task.id)?.status).toBe('backlog');
    expect(
      value<{ totals: { executedMinutes: number } }>(
        q.app.invoke('report.nominal_time'),
      ).totals.executedMinutes,
    ).toBe(120);
    q.store.close();
  });

  it('abre la actual el lunes, valida destino y mantiene atomicidad al fallar la plantilla', () => {
    const q = setup();
    const first = q.open();
    expect(q.confirm('week.review').status).toBe('conflict');
    expect(
      q.confirm('week.review', { targetWeekStart: '2026-09-15' }).status,
    ).toBe('validation_error');
    expect(q.current().id).toBe(first.id);
    q.setDate('2026-09-28T10:00:00Z');
    expect(q.confirm('week.review', { templateId: 'missing' }).status).toBe(
      'validation_error',
    );
    expect(q.current().id).toBe(first.id);
    value(q.confirm('week.review'));
    expect(q.current().weekStart).toBe('2026-09-28');
    expect(q.store.repos.weeks.list()).toHaveLength(2);
    const next = {
      ...q.store.repos.weeks.get(first.id!)!,
      id: 'already-created',
      weekStart: '2026-10-05',
    };
    q.store.repos.weeks.insert(next);
    expect(
      q.confirm('week.review', { targetWeekStart: '2026-10-05' }).status,
    ).toBe('conflict');
    expect(q.current().weekStart).toBe('2026-09-28');
    q.store.close();
  });

  it('revierte toda la aceptación si cambia un slot y permite reintentos idempotentes', () => {
    const q = setup();
    q.open();
    q.capture('Primera', { workType: 'deep' });
    q.capture('Segunda', { workType: 'deep' });
    const proposal = q.propose();
    value(
      q.app.invoke('week.adjust_slots', {
        operations: [
          {
            op: 'change',
            slotId: proposal.assignments[1].slotId,
            durationMinutes: 60,
          },
        ],
      }),
    );
    expect(q.confirm('plan.accept', { proposalId: proposal.id }).status).toBe(
      'conflict',
    );
    expect(q.current().blocks).toEqual([]);
    expect(q.store.repos.proposals.get(proposal.id)?.acceptedAt).toBeNull();
    const fresh = q.propose();
    value(
      q.confirm('plan.accept', {
        proposalId: fresh.id,
        request_id: 'accept-once',
      }),
    );
    value(
      q.app.invoke('plan.accept', {
        proposalId: fresh.id,
        request_id: 'accept-once',
      }),
    );
    expect(q.current().blocks).toHaveLength(2);
    q.store.close();
  });

  it('rechaza una propuesta si una tarea deja de estar disponible y si su semana se cierra', () => {
    const q = setup();
    q.open();
    const task = q.capture('A');
    const proposal = q.propose();
    value(
      q.app.invoke('task.update', {
        taskId: task.id,
        availableOn: '2026-10-01',
      }),
    );
    expect(q.confirm('plan.accept', { proposalId: proposal.id }).status).toBe(
      'conflict',
    );
    expect(q.current().blocks).toEqual([]);
    q.setDate('2026-09-14T10:00:00Z');
    value(q.confirm('week.review'));
    expect(q.confirm('plan.accept', { proposalId: proposal.id }).status).toBe(
      'conflict',
    );
    q.store.close();
  });

  it('conserva reservas tras reinicio y carga propuestas antiguas sin reservas', () => {
    const dir = mkdtempSync(join(tmpdir(), 'quadrant-reservations-'));
    const file = join(dir, 'test.sqlite');
    const q = setup(file);
    try {
      const week = q.open();
      const task = q.capture('Persistente');
      const proposal = q.propose([
        { taskId: task.id, slotId: week.slots[0].id },
      ]);
      q.store.close();
      const again = setup(file);
      try {
        expect(
          again.store.repos.proposals.get(proposal.id)?.reservations,
        ).toEqual(proposal.reservations);
        const old = {
          ...again.store.repos.proposals.get(proposal.id)!,
          id: 'legacy',
          reservations: undefined,
        };
        // Simula el payload JSON anterior, en el que este campo no existía.
        again.store.repos.proposals.insert(
          old as unknown as Parameters<
            typeof again.store.repos.proposals.insert
          >[0],
        );
        expect(again.store.repos.proposals.get('legacy')?.reservations).toEqual(
          [],
        );
        value(again.confirm('plan.accept', { proposalId: proposal.id }));
      } finally {
        again.store.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
