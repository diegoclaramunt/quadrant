import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { addDays } from '@quadrant/domain';
import type {
  HttpsQuadrantLocalSchemasWeekCurrentOutputJson as WeekResult,
  Block,
} from '@quadrant/capabilities';
import { QuadrantApi, type TaskView } from '../quadrant-api';
import { slotLabel } from '../work-labels';

@Component({
  selector: 'app-today-page',
  imports: [RouterLink],
  template: `
    <section class="stack today-page" [attr.aria-busy]="busy()">
      <header class="page-heading">
        <div>
          <p class="eyebrow">{{ readableDate() }}</p>
          <h1>Hoy</h1>
          <p class="editorial-intro">Un bloque a la vez.</p>
        </div>
        <a routerLink="/week" class="secondary action-link">Ver semana</a>
      </header>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      @if (!week()?.id) {
        <section class="panel empty-state">
          <span class="empty-symbol" aria-hidden="true">↗</span>
          <h2>Empieza por hacer espacio.</h2>
          <p>Prepara tu semana para dar un lugar a lo que quieres hacer.</p>
          <a routerLink="/week" class="action-link"
            >Preparar semana <span aria-hidden="true">↗</span></a
          >
        </section>
      } @else {
        @if (future()) {
          <p class="notice" role="status">
            La semana abierta es del {{ date(week()!.weekStart!) }} al
            {{ date(addDays(week()!.weekStart!, 6)) }}. Puedes consultarla, pero
            no ejecutar bloques antes de tiempo.
          </p>
        }
        @if (!blocks().length) {
          <section class="panel empty-state">
            <span class="empty-symbol" aria-hidden="true">☀</span>
            <h2>Un poco de espacio.</h2>
            <p>No hay bloques para este día.</p>
            <a routerLink="/week" class="action-link"
              >Ver semana y planificar <span aria-hidden="true">↗</span></a
            >
          </section>
        }
        @for (block of blocks(); track block.id) {
          <article class="card block-row">
            <div>
              <p class="eyebrow">
                {{ time(block)
                }}{{
                  block.slotId ? ' · ' + slotLabel(slotKind(block.slotId)) : ''
                }}
              </p>
              <h2>{{ title(block.taskId) }}</h2>
              <p class="muted">
                {{ block.nominalMinutes }} min · {{ status(block.status) }}
              </p>
            </div>
            @if (block.status === 'planned') {
              <button
                type="button"
                [disabled]="busy() || future()"
                (click)="execute(block.id)"
              >
                Marcar bloque realizado
              </button>
            }
          </article>
        }
      }
    </section>
  `,
})
export class TodayPage {
  private readonly api = inject(QuadrantApi);
  protected readonly week = signal<WeekResult['week'] | null>(null);
  protected readonly tasks = signal<TaskView[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly addDays = addDays;
  protected readonly slotLabel = slotLabel;
  constructor() {
    void this.reload();
  }
  protected blocks() {
    const w = this.week();
    if (!w || !w.today || !w.weekStart) return [];
    const day =
      Math.floor((Date.parse(w.today) - Date.parse(w.weekStart)) / 86400000) +
      1;
    if (day < 1 || day > 7) return [];
    return w.blocks.filter(
      (b) => w.slots.find((s) => s.id === b.slotId)?.weekday === day,
    );
  }
  protected future() {
    const w = this.week();
    return !!w?.today && !!w.weekStart && w.today < w.weekStart;
  }
  protected title(id: string) {
    return (
      this.tasks().find((task) => task.id === id)?.title ?? 'Tarea sin título'
    );
  }
  protected slotKind(id: string) {
    return this.week()?.slots.find((slot) => slot.id === id)?.kind ?? 'deep';
  }
  protected time(block: Block) {
    return (
      this.week()?.slots.find((slot) => slot.id === block.slotId)?.startTime ??
      'Bloque'
    );
  }
  protected status(value: string) {
    return (
      (
        {
          planned: 'Pendiente',
          executed: 'Realizado',
          cancelled: 'Cancelado',
          missed: 'No realizado',
        } as Record<string, string>
      )[value] ?? 'Pendiente'
    );
  }
  protected date(value: string) {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: value.startsWith(String(new Date().getFullYear()))
        ? undefined
        : 'numeric',
    }).format(new Date(`${value}T12:00:00`));
  }
  protected readableDate() {
    return this.week()?.today ? this.date(this.week()!.today!) : 'Tu jornada';
  }
  async execute(blockId: string) {
    this.busy.set(true);
    try {
      const result = await this.api.invoke('block.execute', {
        blockId,
        request_id: crypto.randomUUID(),
      });
      if (result.status !== 'ok')
        this.error.set(result.error?.message ?? 'No se pudo marcar el bloque.');
      else await this.reload();
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
    } finally {
      this.busy.set(false);
    }
  }
  private async reload() {
    const [week, tasks] = await Promise.all([
      this.api.invoke<WeekResult>('week.current'),
      this.api.invoke<{ tasks: TaskView[] }>('backlog.list'),
    ]);
    if (week.status === 'ok' && week.result) this.week.set(week.result.week);
    if (tasks.status === 'ok' && tasks.result)
      this.tasks.set(tasks.result.tasks);
  }
}
