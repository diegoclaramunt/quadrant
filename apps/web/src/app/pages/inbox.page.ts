import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuadrantApi, type TaskView } from '../quadrant-api';

@Component({
  selector: 'app-inbox-page',
  imports: [RouterLink],
  template: `
    <section class="stack">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Fuera de tu cabeza</p>
          <h1>Bandeja</h1>
          <p class="editorial-intro">Primero captura. Después decide.</p>
        </div>
        <a routerLink="/process" class="action-link"
          >Procesar tarjetas <span aria-hidden="true">↗</span></a
        >
      </header>
      <details class="panel">
        <summary>Añadir ideas a la bandeja</summary>
        <form class="stack" (submit)="capture($event)">
          <label>
            Texto (una línea por idea)
            <textarea
              name="batch"
              rows="4"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
            ></textarea>
          </label>
          <div class="row">
            <button type="submit">Capturar</button>
          </div>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
        </form>
      </details>
      @if (!tasks().length) {
        <section class="panel empty-state">
          <span class="empty-symbol" aria-hidden="true">✓</span>
          <h2>Todo en su sitio.</h2>
          <p>
            Tu bandeja está despejada. Captura una idea cuando aparezca; aquí
            tendrá su espacio.
          </p>
        </section>
      }
      @if (tasks().length) {
        <p class="eyebrow">Por decidir · {{ tasks().length }}</p>
        <ul class="stack">
          @for (task of tasks(); track task.id) {
            <li class="card">
              <strong>{{ task.title }}</strong>
              @if (task.notes) {
                <p class="muted">{{ task.notes }}</p>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class InboxPage {
  private readonly api = inject(QuadrantApi);
  protected readonly tasks = signal<TaskView[]>([]);
  protected readonly draft = signal('');
  protected readonly error = signal('');

  constructor() {
    void this.reload();
  }

  async capture(event: Event) {
    event.preventDefault();
    const lines = this.draft()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return;
    }
    const envelope = await this.api.invoke<{ tasks: TaskView[] }>(
      'inbox.capture_many',
      {
        items: lines.map((title) => ({
          title,
          originalText: title,
          channel: 'ui',
        })),
      },
    );
    if (envelope.status !== 'ok') {
      this.error.set(envelope.error?.message ?? 'No se pudo capturar');
      return;
    }
    this.draft.set('');
    this.error.set('');
    await this.reload();
  }

  private async reload() {
    const envelope = await this.api.invoke<{ tasks: TaskView[] }>('inbox.list');
    if (envelope.status === 'ok' && envelope.result) {
      this.tasks.set(envelope.result.tasks);
    }
  }
}
