import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuadrantApi, type TaskView } from '../quadrant-api';
import { workTypes, workHelp } from '../work-labels';
import type { Category, Project } from '@quadrant/capabilities';

@Component({
  selector: 'app-process-page',
  imports: [FormsModule],
  template: `
    <section class="stack">
      <h1>Procesar</h1>
      <p class="muted">
        Una tarjeta cada vez. Teclado: U urgente, I importante, 1-4 tipo, Enter
        procesar, P posponer.
      </p>
      @if (task(); as current) {
        <article class="card stack" tabindex="0">
          <p class="muted">{{ remaining() }} pendientes</p>
          <h2>{{ current.title }}</h2>
          <p>{{ current.notes || current.originalText }}</p>
          @if (current.suggestArchive) {
            <p class="error">
              Cuatro posposiciones seguidas: considera archivarla.
            </p>
          }
          <div class="row">
            <label
              ><input
                type="checkbox"
                [checked]="urgent()"
                (change)="urgent.set($any($event.target).checked)"
              />
              Urgente</label
            >
            <label
              ><input
                type="checkbox"
                [checked]="important()"
                (change)="important.set($any($event.target).checked)"
              />
              Importante</label
            >
            <label>
              Tipo
              <select
                [ngModel]="workType()"
                (change)="workType.set($any($event.target).value)"
              >
                @for (type of workTypes; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
              </select>
            </label>
            @if (workType() === 'short') {
              <label>
                Minutos
                <input
                  type="number"
                  min="1"
                  max="59"
                  aria-describedby="processing-error"
                  [attr.aria-invalid]="
                    workType() === 'short' && (minutes() < 1 || minutes() > 59)
                  "
                  [value]="minutes()"
                  (input)="minutes.set(+$any($event.target).value)"
                />
              </label>
            }
          </div>
          <p class="muted">{{ workHelp }}</p>
          <details
            [open]="detailsOpen()"
            (toggle)="detailsOpen.set($any($event.target).open)"
          >
            <summary>Detalles opcionales</summary>
            <div class="stack">
              <label
                >Proyecto
                <select
                  [ngModel]="projectId()"
                  (change)="
                    projectId.set($any($event.target).value); categoryId.set('')
                  "
                >
                  <option value="">Sin proyecto</option>
                  @for (project of projects(); track project.id) {
                    <option [value]="project.id">{{ project.name }}</option>
                  }
                </select>
              </label>
              @if (!projectId()) {
                <label
                  >Categoría
                  <select
                    [ngModel]="categoryId()"
                    (change)="categoryId.set($any($event.target).value)"
                  >
                    <option value="">Sin categoría</option>
                    @for (category of categories(); track category.id) {
                      <option [value]="category.id">{{ category.name }}</option>
                    }
                  </select>
                </label>
              }
              <label
                >Fecha límite
                <input
                  type="date"
                  [value]="deadline()"
                  (input)="deadline.set($any($event.target).value)"
              /></label>
              <label
                >Notas
                <textarea
                  [value]="notes()"
                  (input)="notes.set($any($event.target).value)"
                ></textarea>
              </label>
            </div>
          </details>
          <div class="row">
            <button type="button" [disabled]="busy()" (click)="process()">
              Procesar
            </button>
            <button
              type="button"
              class="secondary"
              [disabled]="busy()"
              (click)="postpone()"
            >
              Posponer
            </button>
            <button
              type="button"
              class="secondary"
              [disabled]="busy()"
              (click)="archive()"
            >
              Archivar
            </button>
          </div>
          @if (error()) {
            <p id="processing-error" class="error" role="alert">
              {{ error() }}
            </p>
          }
          @if (confirmation(); as pending) {
            <div
              class="dialog-inline"
              role="alertdialog"
              aria-label="Confirmar archivo"
            >
              <strong>Confirmar archivo</strong>
              <p>{{ pending.summary }}</p>
              <div class="row">
                <button type="button" (click)="confirmArchive()">
                  Archivar</button
                ><button
                  type="button"
                  class="secondary"
                  (click)="confirmation.set(null)"
                >
                  Cancelar
                </button>
              </div>
            </div>
          }
        </article>
      } @else {
        <p class="panel">La bandeja está vacía.</p>
      }
    </section>
  `,
})
export class ProcessPage {
  protected readonly workTypes = workTypes;
  protected readonly workHelp = workHelp;
  protected readonly detailsOpen = signal(false);
  protected readonly projectId = signal('');
  protected readonly categoryId = signal('');
  protected readonly deadline = signal('');
  protected readonly notes = signal('');
  protected readonly categories = signal<Category[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly busy = signal(false);
  private readonly api = inject(QuadrantApi);
  protected readonly queue = signal<TaskView[]>([]);
  protected readonly urgent = signal(false);
  protected readonly important = signal(true);
  protected readonly workType = signal<'brief' | 'short' | 'deep' | 'project'>(
    'short',
  );
  protected readonly minutes = signal(30);
  protected readonly error = signal('');
  protected readonly confirmation = signal<{
    token: string;
    summary: string;
  } | null>(null);

  protected task() {
    return this.queue()[0] ?? null;
  }

  protected remaining() {
    return this.queue().length;
  }

  constructor() {
    void this.reload();
    void this.loadCatalog();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLElement &&
      (event.target.isContentEditable ||
        event.target.closest('a, button, input, textarea, select, summary'))
    ) {
      return;
    }
    if (
      this.busy() ||
      !this.task() ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if (event.key === 'u' || event.key === 'U') {
      this.urgent.update((value) => !value);
    }
    if (event.key === 'i' || event.key === 'I') {
      this.important.update((value) => !value);
    }
    if (event.key === '1') this.workType.set('brief');
    if (event.key === '2') this.workType.set('short');
    if (event.key === '3') this.workType.set('deep');
    if (event.key === '4') this.workType.set('project');
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.process();
    }
    if (event.key === 'p' || event.key === 'P') {
      void this.postpone();
    }
  }

  async process() {
    const current = this.task();
    if (!current || this.busy()) {
      return;
    }
    if (
      this.workType() === 'short' &&
      (!Number.isInteger(this.minutes()) ||
        this.minutes() < 1 ||
        this.minutes() > 59)
    ) {
      this.error.set('La duración debe estar entre 1 y 59 minutos.');
      return;
    }
    this.busy.set(true);
    try {
      const envelope = await this.api.invoke('task.process', {
        taskId: current.id,
        urgent: this.urgent(),
        important: this.important(),
        workType: this.workType(),
        nominalMinutes:
          this.workType() === 'short' ? this.minutes() : undefined,
        projectId: this.projectId() || null,
        categoryId: this.projectId() ? undefined : this.categoryId() || null,
        deadline: this.deadline() || null,
        notes: this.notes(),
      });
      await this.handle(envelope);
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
    } finally {
      this.busy.set(false);
    }
  }

  async postpone() {
    const current = this.task();
    if (!current || this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      await this.handle(
        await this.api.invoke('task.postpone', {
          taskId: current.id,
          weeksAhead: 1,
        }),
      );
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
    } finally {
      this.busy.set(false);
    }
  }

  async archive() {
    const current = this.task();
    if (!current || this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      const response = await this.api.invoke('task.archive', {
        taskId: current.id,
      });
      if (
        response.status === 'needs_confirmation' &&
        response.confirmation_token
      ) {
        this.confirmation.set({
          token: response.confirmation_token,
          summary:
            response.summary ??
            'La tarea se archivará y dejará de aparecer en las vistas activas.',
        });
      } else await this.handle(response);
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
    } finally {
      this.busy.set(false);
    }
  }

  async confirmArchive() {
    const current = this.task();
    const pending = this.confirmation();
    if (!current || !pending) return;
    this.busy.set(true);
    try {
      await this.handle(
        await this.api.confirm(
          'task.archive',
          { taskId: current.id },
          pending.token,
        ),
      );
      this.confirmation.set(null);
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
    } finally {
      this.busy.set(false);
    }
  }

  private async handle(envelope: {
    status: string;
    error?: { message: string };
  }) {
    if (envelope.status === 'needs_confirmation') return;
    if (envelope.status !== 'ok') {
      this.error.set(envelope.error?.message ?? 'No se pudo completar');
      return;
    }
    this.error.set('');
    await this.reload();
  }

  private async reload() {
    const envelope = await this.api.invoke<{ tasks: TaskView[] }>('inbox.list');
    if (envelope.status === 'ok' && envelope.result) {
      this.queue.set(envelope.result.tasks);
      const current = this.task();
      this.urgent.set(current?.urgent ?? false);
      this.important.set(current?.workType ? current.important : true);
      this.workType.set(current?.workType ?? 'short');
      this.minutes.set(
        current?.workType === 'short' ? (current.nominalMinutes ?? 30) : 30,
      );
      this.projectId.set(current?.projectId ?? '');
      this.categoryId.set(current?.categoryId ?? '');
      this.deadline.set(current?.deadline ?? '');
      this.notes.set(current?.notes ?? '');
      this.detailsOpen.set(false);
    }
  }

  private async loadCatalog() {
    const [categories, projects] = await Promise.all([
      this.api.invoke<{ categories: Category[] }>('category.list'),
      this.api.invoke<{ projects: Project[] }>('project.list'),
    ]);
    if (categories.result) this.categories.set(categories.result.categories);
    if (projects.result) this.projects.set(projects.result.projects);
  }
}
