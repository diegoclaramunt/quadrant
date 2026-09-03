import { Component, computed, inject, signal } from '@angular/core';
import { QuadrantApi, type TaskView } from '../quadrant-api';

interface SlotView {
  id: string;
  weekday: number;
  order: number;
  kind: 'deep' | 'project';
  durationMinutes: number;
  startTime: string | null;
}

interface BlockView {
  id: string;
  slotId: string;
  taskId: string;
  status: string;
  nominalMinutes: number;
}

@Component({
  selector: 'app-week-page',
  styles: `
    .week {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.6rem;
    }
    .day {
      min-height: 12rem;
      cursor: pointer;
    }
    .day.selected {
      outline: 3px solid var(--accent);
    }
    @media (max-width: 900px) {
      .week {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <section class="stack">
      <h1>Semana y día</h1>
      <div class="row">
        <button type="button" (click)="openWeek()">Abrir semana</button>
        <button type="button" class="secondary" (click)="review()">
          Revisión semanal
        </button>
        <button type="button" class="secondary" (click)="propose()">
          Proponer plan
        </button>
      </div>
      @if (week(); as currentWeek) {
        <p class="muted">
          Semana {{ currentWeek.weekStart }} · {{ currentWeek.status }}
        </p>
        <div class="week">
          @for (day of days; track day.value) {
            <article
              class="card day"
              [class.selected]="selectedDay() === day.value"
              (click)="selectedDay.set(day.value)"
              (keyup.enter)="selectedDay.set(day.value)"
              tabindex="0"
            >
              <h2>{{ day.label }}</h2>
              @for (slot of slotsFor(day.value); track slot.id) {
                <p>
                  {{ slot.kind }} {{ slot.durationMinutes }}m
                  @for (block of blocksFor(slot.id); track block.id) {
                    · {{ taskTitle(block.taskId) }} [{{ block.status }}]
                  }
                </p>
              }
            </article>
          }
        </div>
        <section class="panel stack">
          <h2>Día seleccionado</h2>
          @for (slot of slotsFor(selectedDay()); track slot.id) {
            <div class="card">
              <p>{{ slot.kind }} · {{ slot.durationMinutes }} min</p>
              @for (block of blocksFor(slot.id); track block.id) {
                <div class="row">
                  <span
                    >{{ taskTitle(block.taskId) }} · {{ block.status }} ·
                    {{ block.nominalMinutes }} min</span
                  >
                  @if (block.status === 'planned') {
                    <button type="button" (click)="execute(block.id)">
                      Ejecutar
                    </button>
                    <button
                      type="button"
                      class="secondary"
                      (click)="cancel(block.id)"
                    >
                      Cancelar
                    </button>
                  }
                </div>
              }
              <label>
                Asignar tarea
                <select
                  (change)="
                    schedule(slot.id, $any($event.target).value);
                    $any($event.target).value = ''
                  "
                >
                  <option value="">Elegir del backlog</option>
                  @for (task of backlog(); track task.id) {
                    <option [value]="task.id">
                      {{ task.title }} ({{ task.workType }})
                    </option>
                  }
                </select>
              </label>
            </div>
          }
        </section>
      }
      @if (proposal(); as plan) {
        <section class="panel">
          <h2>Propuesta</h2>
          <p>
            {{ plan.assignments.length }} asignaciones,
            {{ plan.unmatched.length }} sin colocar,
            {{ plan.emptySlots.length }} slots vacíos.
          </p>
          <ul>
            @for (item of plan.unmatched; track item.taskId) {
              <li>{{ taskTitle(item.taskId) }}: {{ item.reason }}</li>
            }
          </ul>
          <button type="button" (click)="accept()">Aceptar propuesta</button>
        </section>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </section>
  `,
})
export class WeekPage {
  private readonly api = inject(QuadrantApi);
  protected readonly week = signal<{
    id: string | null;
    weekStart: string | null;
    status: string | null;
    slots: SlotView[];
    blocks: BlockView[];
  } | null>(null);
  protected readonly backlog = signal<TaskView[]>([]);
  protected readonly selectedDay = signal(1);
  protected readonly proposal = signal<{
    id: string;
    assignments: unknown[];
    unmatched: Array<{ taskId: string; reason: string }>;
    emptySlots: string[];
  } | null>(null);
  protected readonly error = signal('');
  protected readonly days = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
  ];
  protected readonly titles = computed(() => {
    const map = new Map(this.backlog().map((task) => [task.id, task.title]));
    return map;
  });

  constructor() {
    void this.reload();
  }

  slotsFor(day: number) {
    return (this.week()?.slots ?? []).filter((slot) => slot.weekday === day);
  }

  blocksFor(slotId: string) {
    return (this.week()?.blocks ?? []).filter(
      (block) => block.slotId === slotId,
    );
  }

  taskTitle(taskId: string) {
    return this.titles().get(taskId) ?? taskId;
  }

  async openWeek() {
    this.handle(await this.api.invoke('week.open', {}));
  }

  async review() {
    this.handle(await this.api.invoke('week.review', {}));
  }

  async propose() {
    const envelope = await this.api.invoke<{
      proposal: {
        id: string;
        assignments: unknown[];
        unmatched: Array<{ taskId: string; reason: string }>;
        emptySlots: string[];
      };
    }>('plan.propose', {});
    if (envelope.status === 'ok' && envelope.result) {
      this.proposal.set(envelope.result.proposal);
    } else {
      this.error.set(envelope.error?.message ?? 'No se pudo proponer');
    }
  }

  async accept() {
    const proposal = this.proposal();
    if (!proposal) {
      return;
    }
    this.handle(
      await this.api.invoke('plan.accept', { proposalId: proposal.id }),
    );
    this.proposal.set(null);
  }

  async schedule(slotId: string, taskId: string) {
    if (!taskId) {
      return;
    }
    this.handle(await this.api.invoke('block.schedule', { slotId, taskId }));
  }

  async execute(blockId: string) {
    this.handle(await this.api.invoke('block.execute', { blockId }));
  }

  async cancel(blockId: string) {
    this.handle(await this.api.invoke('block.cancel', { blockId }));
  }

  private handle(envelope: { status: string; error?: { message: string } }) {
    if (envelope.status !== 'ok' && envelope.status !== 'needs_confirmation') {
      this.error.set(envelope.error?.message ?? 'Operación no aplicada');
    } else {
      this.error.set('');
    }
    void this.reload();
  }

  private async reload() {
    const current = await this.api.invoke<{
      week: {
        id: string | null;
        weekStart: string | null;
        status: string | null;
        slots: SlotView[];
        blocks: BlockView[];
      };
    }>('week.current');
    const backlog = await this.api.invoke<{ tasks: TaskView[] }>(
      'backlog.list',
    );
    if (current.result) {
      this.week.set(current.result.week.id ? current.result.week : null);
    }
    if (backlog.result) {
      this.backlog.set(backlog.result.tasks);
    }
  }
}
