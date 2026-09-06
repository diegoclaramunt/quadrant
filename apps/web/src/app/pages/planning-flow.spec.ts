import { TestBed } from '@angular/core/testing';
import { ProcessPage } from './process.page';
import { WeekPage } from './week.page';
import { QuadrantApi, type TaskView } from '../quadrant-api';

function task(id: string, extra: Partial<TaskView> = {}): TaskView {
  return {
    id,
    title: id,
    notes: null,
    originalText: id,
    channel: 'ui',
    projectId: null,
    categoryId: null,
    effectiveCategoryId: null,
    status: 'inbox',
    urgent: false,
    important: false,
    quadrant: 'nn',
    workType: null,
    nominalMinutes: null,
    deadline: null,
    availableOn: null,
    consecutivePostponements: 0,
    suggestArchive: false,
    hidden: false,
    ...extra,
  };
}

describe('flujo de planificación realista', () => {
  it('muestra la capacidad libre de un bloque compartido sin contar cancelados', async () => {
    TestBed.configureTestingModule({
      imports: [WeekPage],
      providers: [
        {
          provide: QuadrantApi,
          useValue: {
            invoke: async (id: string) => ({
              status: 'ok',
              result:
                id === 'week.current'
                  ? {
                      week: {
                        id: 'w',
                        weekStart: '2026-09-07',
                        status: 'open',
                        today: '2026-09-07',
                        timezone: 'Europe/Madrid',
                        slots: [
                          {
                            id: 's',
                            weekday: 1,
                            order: 1,
                            kind: 'deep',
                            durationMinutes: 90,
                          },
                        ],
                        blocks: [
                          {
                            id: 'a',
                            slotId: 's',
                            taskId: 'A',
                            status: 'planned',
                            nominalMinutes: 30,
                          },
                          {
                            id: 'b',
                            slotId: 's',
                            taskId: 'B',
                            status: 'executed',
                            nominalMinutes: 30,
                          },
                          {
                            id: 'c',
                            slotId: 's',
                            taskId: 'C',
                            status: 'cancelled',
                            nominalMinutes: 30,
                          },
                        ],
                      },
                    }
                  : { tasks: [] },
            }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(WeekPage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent?.replace(
      /\s+/g,
      ' ',
    );
    expect(text).toContain('60 min ocupados · 30 min libres (nominales)');
    fixture.destroy();
  });
  it('procesa por teclado sin detalles obligatorios y reinicia clasificación y detalles entre tarjetas', async () => {
    const queue = [task('Primera'), task('Segunda')];
    const calls: { id: string; body: Record<string, unknown> }[] = [];
    const api = {
      invoke: async (id: string, body: Record<string, unknown> = {}) => {
        calls.push({ id, body });
        if (id === 'inbox.list')
          return { status: 'ok', result: { tasks: [...queue] } };
        if (id === 'category.list')
          return { status: 'ok', result: { categories: [] } };
        if (id === 'project.list')
          return { status: 'ok', result: { projects: [] } };
        if (id === 'task.process') {
          queue.shift();
          return { status: 'ok', result: {} };
        }
        return { status: 'ok' };
      },
    };
    TestBed.configureTestingModule({
      imports: [ProcessPage],
      providers: [{ provide: QuadrantApi, useValue: api }],
    });
    const fixture = TestBed.createComponent(ProcessPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Sesión abierta · 2 h');
    const checks = root.querySelectorAll<HTMLInputElement>(
      'input[type=checkbox]',
    );
    expect(checks[0].checked).toBe(false);
    expect(checks[1].checked).toBe(true);
    const card = root.querySelector('article')!;
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'u', bubbles: true }),
    );
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: '4', bubbles: true }),
    );
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await fixture.whenStable();
    expect(
      calls.find((call) => call.id === 'task.process')?.body,
    ).toMatchObject({
      urgent: true,
      workType: 'project',
      projectId: null,
      deadline: null,
    });
    expect(root.textContent).toContain('Segunda');
    expect(checks[0].checked).toBe(false);
    expect(checks[1].checked).toBe(true);
    expect(root.querySelector('select')?.value).toBe('short');
    expect(
      root.querySelector<HTMLInputElement>('input[type=number]')?.value,
    ).toBe('30');
    const textarea = root.querySelector('textarea')!;
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await fixture.whenStable();
    expect(calls.filter((call) => call.id === 'task.process')).toHaveLength(1);
    const link = document.createElement('a');
    link.href = '/week';
    link.textContent = 'Semana';
    root.append(link);
    const navigate = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(navigate);
    await fixture.whenStable();
    expect(navigate.defaultPrevented).toBe(false);
    expect(calls.filter((call) => call.id === 'task.process')).toHaveLength(1);
    const modified = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    card.dispatchEvent(modified);
    await fixture.whenStable();
    expect(modified.defaultPrevented).toBe(false);
    expect(calls.filter((call) => call.id === 'task.process')).toHaveLength(1);
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await fixture.whenStable();
    expect(root.textContent).toContain('La bandeja está vacía.');
    const emptyEnter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(emptyEnter);
    expect(emptyEnter.defaultPrevented).toBe(false);
    fixture.destroy();
  });

  it('carga los datos existentes de una tarjeta y conserva el formulario si se cancela un archivo', async () => {
    const saved = task('Con datos', {
      workType: 'short',
      nominalMinutes: 15,
      important: false,
      urgent: true,
      notes: 'Nota previa',
      deadline: '2026-09-10',
    });
    TestBed.configureTestingModule({
      imports: [ProcessPage],
      providers: [
        {
          provide: QuadrantApi,
          useValue: {
            invoke: async (id: string) =>
              id === 'inbox.list'
                ? { status: 'ok', result: { tasks: [saved] } }
                : id === 'category.list'
                  ? { status: 'ok', result: { categories: [] } }
                  : id === 'project.list'
                    ? { status: 'ok', result: { projects: [] } }
                    : { status: 'needs_confirmation' },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProcessPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(
      root.querySelector<HTMLInputElement>('input[type=number]')?.value,
    ).toBe('15');
    expect(root.querySelector('textarea')?.value).toBe('Nota previa');
    expect(
      root.querySelector<HTMLInputElement>('input[type=date]')?.value,
    ).toBe('2026-09-10');
    Array.from(root.querySelectorAll('button'))
      .find((item) => item.textContent?.includes('Archivar'))!
      .click();
    await fixture.whenStable();
    expect(root.textContent).toContain('Con datos');
    fixture.destroy();
  });

  it('revisa capacidad, crea y retira reservas, muestra asignaciones y conserva la propuesta al cancelar aceptación', async () => {
    const calls: { id: string; body: Record<string, unknown> }[] = [];
    const week = {
      id: 'w',
      weekStart: '2026-09-14',
      status: 'open',
      today: '2026-09-11',
      timezone: 'Europe/Madrid',
      slots: [
        { id: 's', weekday: 1, order: 1, kind: 'deep', durationMinutes: 90 },
      ],
      blocks: [],
    };
    const backlog = [
      task('Importante', {
        status: 'backlog',
        important: true,
        workType: 'deep',
      }),
    ];
    TestBed.configureTestingModule({
      imports: [WeekPage],
      providers: [
        {
          provide: QuadrantApi,
          useValue: {
            invoke: async (id: string, body: Record<string, unknown> = {}) => {
              calls.push({ id, body });
              if (id === 'week.current')
                return { status: 'ok', result: { week } };
              if (id === 'backlog.list')
                return { status: 'ok', result: { tasks: backlog } };
              if (id === 'plan.propose')
                return {
                  status: 'ok',
                  result: {
                    proposal: {
                      id: 'p',
                      weekPlanId: 'w',
                      reservations: body['reservations'],
                      assignments: [
                        {
                          taskId: 'Importante',
                          slotId: 's',
                          nominalMinutes: 90,
                        },
                      ],
                      unmatched: [],
                      emptySlots: [],
                    },
                  },
                };
              return {
                status: 'needs_confirmation',
                confirmation_token: 'token',
                summary: 'Aplicar propuesta',
              };
            },
            confirm: async () => ({ status: 'ok', result: {} }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(WeekPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      Array.from(root.querySelectorAll('button')).find((item) =>
        item.textContent?.includes(label),
      )!;
    expect(root.querySelector('select')?.value).toBe('2026-09-14');
    button('Planificar semana').click();
    await fixture.whenStable();
    expect(button('3. Revisar plan').disabled).toBe(true);
    expect(root.textContent).toContain('1,5 h');
    button('Continuar').click();
    await fixture.whenStable();
    const selects = Array.from(root.querySelectorAll('select'));
    const taskSelect = selects.find((select) =>
      select.textContent?.includes('Elige una tarea'),
    )!;
    taskSelect.value = 'Importante';
    taskSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    const slotSelect = selects.find((select) =>
      select.textContent?.includes('Elige un bloque'),
    )!;
    slotSelect.value = 's';
    button('Añadir reserva').click();
    await fixture.whenStable();
    expect(calls.some((call) => call.id === 'block.schedule')).toBe(false);
    button('Revisar plan').click();
    await fixture.whenStable();
    expect(root.textContent).toContain('Reserva elegida');
    expect(root.textContent).toContain('0 h libres');
    button('Aceptar propuesta').click();
    await fixture.whenStable();
    expect(root.querySelector('[aria-label="Propuesta"]')).not.toBeNull();
    expect(
      root.querySelector('[aria-label="Confirmar acción"]'),
    ).not.toBeNull();
    button('Confirmar').click();
    await fixture.whenStable();
    expect(root.querySelector('[aria-label="Confirmar acción"]')).toBeNull();
    button('Quitar reserva').click();
    await fixture.whenStable();
    expect(root.querySelector('[aria-label="Propuesta"]')).toBeNull();
    button('3. Revisar plan').click();
    await fixture.whenStable();
    expect(
      calls.filter((call) => call.id === 'plan.propose').at(-1)?.body[
        'reservations'
      ],
    ).toEqual([]);
    fixture.destroy();
  });
});
