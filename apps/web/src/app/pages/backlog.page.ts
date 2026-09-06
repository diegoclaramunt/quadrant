import { Component, inject, signal } from '@angular/core';
import { QuadrantApi, type TaskView } from '../quadrant-api';
import { workLabel, workHelp } from '../work-labels';

@Component({
  selector: 'app-backlog-page',
  template: `
    <section class="stack">
      <h1>Backlog</h1>
      <p class="muted">
        Tareas procesadas, planificables ahora o más adelante. {{ workHelp }}
      </p>
      <ul class="stack">
        @for (task of tasks(); track task.id) {
          <li class="card">
            <strong>{{ task.title }}</strong>
            <p class="muted">
              {{ workLabel(task.workType) }} ·
              {{ quadrantLabel(task.quadrant) }}
              @if (task.deadline) {
                · límite {{ task.deadline }}
              }
            </p>
            <div class="row">
              <button type="button" class="secondary" (click)="complete(task)">
                Completar
              </button>
              <button type="button" class="secondary" (click)="postpone(task)">
                Posponer
              </button>
            </div>
          </li>
        }
      </ul>
    </section>
  `,
})
export class BacklogPage {
  protected readonly workLabel = workLabel;
  protected readonly workHelp = workHelp;
  private readonly api = inject(QuadrantApi);
  protected readonly tasks = signal<TaskView[]>([]);

  constructor() {
    void this.reload();
  }

  quadrantLabel(value: TaskView['quadrant']) {
    return {
      ui: 'Urgente e importante',
      in: 'Importante',
      un: 'Urgente',
      nn: 'Ni urgente ni importante',
    }[value];
  }

  async complete(task: TaskView) {
    await this.api.invoke('task.complete', { taskId: task.id });
    await this.reload();
  }

  async postpone(task: TaskView) {
    await this.api.invoke('task.postpone', { taskId: task.id, weeksAhead: 1 });
    await this.reload();
  }

  private async reload() {
    const envelope = await this.api.invoke<{ tasks: TaskView[] }>(
      'backlog.list',
    );
    if (envelope.status === 'ok' && envelope.result) {
      this.tasks.set(envelope.result.tasks);
    }
  }
}
