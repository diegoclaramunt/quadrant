import { Component, HostListener, inject, signal } from '@angular/core';
import { QuadrantApi, type TaskView } from '../quadrant-api';

@Component({
  selector: 'app-process-page',
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
                [value]="workType()"
                (change)="workType.set($any($event.target).value)"
              >
                <option value="brief">brief</option>
                <option value="short">short</option>
                <option value="deep">deep</option>
                <option value="project">project</option>
              </select>
            </label>
            @if (workType() === 'short') {
              <label>
                Minutos
                <input
                  type="number"
                  min="1"
                  max="59"
                  [value]="minutes()"
                  (input)="minutes.set(+$any($event.target).value)"
                />
              </label>
            }
          </div>
          <div class="row">
            <button type="button" (click)="process()">Procesar</button>
            <button type="button" class="secondary" (click)="postpone()">
              Posponer
            </button>
            <button type="button" class="secondary" (click)="archive()">
              Archivar
            </button>
          </div>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
        </article>
      } @else {
        <p class="panel">La bandeja está vacía.</p>
      }
    </section>
  `,
})
export class ProcessPage {
  private readonly api = inject(QuadrantApi);
  protected readonly queue = signal<TaskView[]>([]);
  protected readonly urgent = signal(false);
  protected readonly important = signal(true);
  protected readonly workType = signal<'brief' | 'short' | 'deep' | 'project'>(
    'short',
  );
  protected readonly minutes = signal(30);
  protected readonly error = signal('');

  protected task() {
    return this.queue()[0] ?? null;
  }

  protected remaining() {
    return this.queue().length;
  }

  constructor() {
    void this.reload();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      if (event.key !== 'Enter') {
        return;
      }
    }
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
    if (!current) {
      return;
    }
    const envelope = await this.api.invoke('task.process', {
      taskId: current.id,
      urgent: this.urgent(),
      important: this.important(),
      workType: this.workType(),
      nominalMinutes: this.workType() === 'short' ? this.minutes() : undefined,
    });
    this.handle(envelope);
  }

  async postpone() {
    const current = this.task();
    if (!current) {
      return;
    }
    this.handle(
      await this.api.invoke('task.postpone', {
        taskId: current.id,
        weeksAhead: 1,
      }),
    );
  }

  async archive() {
    const current = this.task();
    if (!current) {
      return;
    }
    this.handle(await this.api.invoke('task.archive', { taskId: current.id }));
  }

  private handle(envelope: { status: string; error?: { message: string } }) {
    if (envelope.status !== 'ok' && envelope.status !== 'needs_confirmation') {
      this.error.set(envelope.error?.message ?? 'No se pudo completar');
      return;
    }
    this.error.set('');
    void this.reload();
  }

  private async reload() {
    const envelope = await this.api.invoke<{ tasks: TaskView[] }>('inbox.list');
    if (envelope.status === 'ok' && envelope.result) {
      this.queue.set(envelope.result.tasks);
    }
  }
}
