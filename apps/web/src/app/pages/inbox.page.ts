import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuadrantApi, type TaskView } from '../quadrant-api';

@Component({
  selector: 'app-inbox-page',
  imports: [RouterLink],
  template: `
    <section class="stack">
      <h1>Bandeja</h1>
      <p class="muted">
        Captura ideas sin clasificarlas. El orden es el de llegada.
      </p>
      <form class="panel stack" (submit)="capture($event)">
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
          <a routerLink="/process">Procesar tarjetas</a>
        </div>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </form>
      <ul class="stack">
        @for (task of tasks(); track task.id) {
          <li class="card">
            <strong>{{ task.title }}</strong>
            <p class="muted">{{ task.channel }} · {{ task.originalText }}</p>
          </li>
        }
      </ul>
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
