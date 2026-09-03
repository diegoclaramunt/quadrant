import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultIdGenerator } from '@quadrant/domain';
import { openStore } from '@quadrant/storage';
import { createQuadrantApp } from './app';
import type { Envelope } from './envelope';

function app() {
  return createQuadrantApp(openStore(':memory:'));
}

function result<T>(envelope: Envelope): T {
  expect(envelope.status).toBe('ok');
  if (envelope.status !== 'ok') {
    throw new Error(JSON.stringify(envelope));
  }
  return envelope.result as T;
}

describe('Quadrant application', () => {
  it('captura por lotes, procesa a backlog y conserva el canal', () => {
    const quadrant = app();
    const captured = result<{
      tasks: Array<{ id: string; status: string; channel: string }>;
    }>(
      quadrant.invoke('inbox.capture_many', {
        items: [
          { title: 'Revisar factura', channel: 'voice' },
          { title: 'Llamar a Ana', channel: 'ui' },
        ],
      }),
    );
    expect(captured.tasks).toHaveLength(2);
    expect(captured.tasks[0].status).toBe('inbox');
    expect(captured.tasks[0].channel).toBe('voice');
    const inbox = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('inbox.list', {}),
    );
    expect(inbox.tasks).toHaveLength(2);
    const processed = result<{ task: { status: string; quadrant: string } }>(
      quadrant.invoke('task.process', {
        taskId: captured.tasks[0].id,
        urgent: true,
        important: true,
        workType: 'short',
        nominalMinutes: 20,
      }),
    );
    expect(processed.task.status).toBe('backlog');
    expect(processed.task.quadrant).toBe('ui');
    const remaining = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('inbox.list', {}),
    );
    expect(remaining.tasks).toHaveLength(1);
  });

  it('pospone cuatro veces desde inbox tras reactivar y sugiere archivo', () => {
    let now = new Date('2026-09-07T10:00:00.000Z');
    const quadrant = createQuadrantApp(openStore(':memory:'), {
      clock: { now: () => now },
      ids: defaultIdGenerator(),
    });
    const captured = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('inbox.capture_many', {
        items: [{ title: 'Pospuesta', channel: 'mcp' }],
      }),
    );
    const id = captured.tasks[0].id;
    let suggestion = false;
    for (let i = 0; i < 4; i += 1) {
      const envelope = result<{ suggestArchive: boolean }>(
        quadrant.invoke('task.postpone', { taskId: id, weeksAhead: 1 }),
      );
      suggestion = envelope.suggestArchive;
      if (i < 3) {
        now = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const review = quadrant.invoke('week.review', {});
        expect(review.status).toBe('needs_confirmation');
        if (review.status === 'needs_confirmation') {
          const confirmed = quadrant.invoke('week.review', {
            confirmation_token: review.confirmation_token,
          });
          expect(confirmed.status).toBe('ok');
        }
      }
    }
    expect(suggestion).toBe(true);
    const stillThere = result<{ task: { status: string } }>(
      quadrant.invoke('task.get', { taskId: id }),
    );
    expect(stillThere.task.status).toBe('snoozed');
  });

  it('archivar proyecto oculta tareas y desarchivarlo las recupera', () => {
    const quadrant = app();
    const categories = result<{
      categories: Array<{ id: string; name: string }>;
    }>(quadrant.invoke('category.list', {}));
    const personal = categories.categories.find(
      (item) => item.name === 'Proyectos personales',
    );
    expect(personal).toBeTruthy();
    const project = result<{ project: { id: string } }>(
      quadrant.invoke('project.create', {
        name: 'Gemelo digital',
        categoryId: personal?.id,
      }),
    );
    const captured = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('inbox.capture_many', {
        items: [
          {
            title: 'Sesión gemelo',
            channel: 'ui',
            alreadyProcessed: true,
            urgent: false,
            important: true,
            workType: 'project',
            projectId: project.project.id,
          },
        ],
      }),
    );
    const backlogBefore = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('backlog.list', {}),
    );
    expect(
      backlogBefore.tasks.some((item) => item.id === captured.tasks[0].id),
    ).toBe(true);
    const archive = quadrant.invoke('project.archive', {
      projectId: project.project.id,
    });
    expect(archive.status).toBe('needs_confirmation');
    if (archive.status === 'needs_confirmation') {
      quadrant.invoke('project.archive', {
        projectId: project.project.id,
        confirmation_token: archive.confirmation_token,
      });
    }
    const backlogHidden = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('backlog.list', {}),
    );
    expect(
      backlogHidden.tasks.some((item) => item.id === captured.tasks[0].id),
    ).toBe(false);
    quadrant.invoke('project.unarchive', { projectId: project.project.id });
    const backlogRestored = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('backlog.list', {}),
    );
    expect(
      backlogRestored.tasks.some((item) => item.id === captured.tasks[0].id),
    ).toBe(true);
  });

  it('idempotencia y conflicto de request_id', () => {
    const quadrant = app();
    const first = quadrant.invoke('inbox.capture_many', {
      request_id: 'req-1',
      items: [{ title: 'Una', channel: 'api' }],
    });
    const second = quadrant.invoke('inbox.capture_many', {
      request_id: 'req-1',
      items: [{ title: 'Una', channel: 'api' }],
    });
    expect(second).toEqual(first);
    const conflicted = quadrant.invoke('inbox.capture_many', {
      request_id: 'req-1',
      items: [{ title: 'Otra', channel: 'api' }],
    });
    expect(conflicted.status).toBe('conflict');
  });

  it('confirmación de archivo en dos pasos y un solo uso', () => {
    const quadrant = app();
    const captured = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('inbox.capture_many', {
        items: [{ title: 'Archivable', channel: 'ui' }],
      }),
    );
    const first = quadrant.invoke('task.archive', {
      taskId: captured.tasks[0].id,
    });
    expect(first.status).toBe('needs_confirmation');
    if (first.status !== 'needs_confirmation') {
      return;
    }
    const done = quadrant.invoke('task.archive', {
      taskId: captured.tasks[0].id,
      confirmation_token: first.confirmation_token,
    });
    expect(done.status).toBe('ok');
    const replay = quadrant.invoke('task.archive', {
      taskId: captured.tasks[0].id,
      confirmation_token: first.confirmation_token,
    });
    expect(replay.status).toBe('conflict');
  });

  it('abre semana desde plantilla, no comparte ajustes y reporta horas nominales', () => {
    const quadrant = app();
    const opened = result<{
      week: {
        id: string;
        slots: Array<{ id: string; kind: string; durationMinutes: number }>;
      };
    }>(quadrant.invoke('week.open', {}));
    const deep = opened.week.slots.filter((slot) => slot.kind === 'deep');
    const projectSlots = opened.week.slots.filter(
      (slot) => slot.kind === 'project',
    );
    expect(deep).toHaveLength(10);
    expect(projectSlots).toHaveLength(5);
    expect(deep.every((slot) => slot.durationMinutes === 90)).toBe(true);
    expect(projectSlots.every((slot) => slot.durationMinutes === 120)).toBe(
      true,
    );

    quadrant.invoke('week.adjust_slots', {
      operations: [{ op: 'remove', slotId: deep[0].id }],
    });
    const templates = result<{
      templates: Array<{ slots: Array<{ id: string }> }>;
    }>(quadrant.invoke('template.list', {}));
    expect(templates.templates[0].slots).toHaveLength(15);

    const categories = result<{
      categories: Array<{ id: string; name: string }>;
    }>(quadrant.invoke('category.list', {}));
    const personal = categories.categories.find(
      (item) => item.name === 'Proyectos personales',
    );
    const project = result<{ project: { id: string } }>(
      quadrant.invoke('project.create', {
        name: 'Gemelo digital',
        categoryId: personal?.id,
      }),
    );
    const captured = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('inbox.capture_many', {
        items: [
          {
            title: 'Gemelo digital',
            channel: 'ui',
            alreadyProcessed: true,
            urgent: false,
            important: true,
            workType: 'project',
            projectId: project.project.id,
          },
        ],
      }),
    );
    const scheduled = result<{ block: { id: string; nominalMinutes: number } }>(
      quadrant.invoke('block.schedule', {
        taskId: captured.tasks[0].id,
        slotId: projectSlots[0].id,
      }),
    );
    expect(scheduled.block.nominalMinutes).toBe(120);
    quadrant.invoke('block.execute', { blockId: scheduled.block.id });
    const report = result<{
      totals: { executed: number; executedMinutes: number };
    }>(
      quadrant.invoke('report.nominal_time', { taskId: captured.tasks[0].id }),
    );
    expect(report.totals.executed).toBe(1);
    expect(report.totals.executedMinutes).toBe(120);
  });

  it('plan.propose no aplica hasta plan.accept', () => {
    const quadrant = app();
    result(quadrant.invoke('week.open', {}));
    const captured = result<{ tasks: Array<{ id: string }> }>(
      quadrant.invoke('inbox.capture_many', {
        items: [
          {
            title: 'Deep work',
            channel: 'ui',
            alreadyProcessed: true,
            urgent: true,
            important: true,
            workType: 'deep',
          },
        ],
      }),
    );
    const proposed = result<{
      proposal: { id: string; assignments: unknown[] };
    }>(quadrant.invoke('plan.propose', {}));
    expect(proposed.proposal.assignments.length).toBeGreaterThan(0);
    const current = result<{ week: { blocks: unknown[] } }>(
      quadrant.invoke('week.current', {}),
    );
    expect(current.week.blocks).toHaveLength(0);
    const confirm = quadrant.invoke('plan.accept', {
      proposalId: proposed.proposal.id,
    });
    expect(confirm.status).toBe('needs_confirmation');
    if (confirm.status === 'needs_confirmation') {
      quadrant.invoke('plan.accept', {
        proposalId: proposed.proposal.id,
        confirmation_token: confirm.confirmation_token,
      });
    }
    const after = result<{ week: { blocks: Array<{ taskId: string }> } }>(
      quadrant.invoke('week.current', {}),
    );
    expect(
      after.week.blocks.some((block) => block.taskId === captured.tasks[0].id),
    ).toBe(true);
  });

  it('persiste tras reiniciar el proceso', () => {
    const dir = mkdtempSync(join(tmpdir(), 'quadrant-'));
    const file = join(dir, 'quadrant.sqlite');
    const first = createQuadrantApp(openStore(file));
    first.invoke('inbox.capture_many', {
      items: [{ title: 'Persistente', channel: 'api' }],
    });
    const listed = result<{ tasks: Array<{ title: string }> }>(
      first.invoke('inbox.list', {}),
    );
    expect(listed.tasks[0].title).toBe('Persistente');
    const second = createQuadrantApp(openStore(file));
    const again = result<{ tasks: Array<{ title: string }> }>(
      second.invoke('inbox.list', {}),
    );
    expect(again.tasks[0].title).toBe('Persistente');
    rmSync(dir, { recursive: true, force: true });
  });
});
