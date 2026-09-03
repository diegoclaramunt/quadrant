import { Component, inject, signal } from '@angular/core';
import { QuadrantApi, type TaskView } from '../quadrant-api';

@Component({
  selector: 'app-matrix-page',
  styles: `
    .matrix {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .q {
      min-height: 10rem;
    }
    .ui {
      background: var(--q1);
    }
    .in {
      background: var(--q2);
    }
    .un {
      background: var(--q3);
    }
    .nn {
      background: var(--q4);
    }
    @media (max-width: 800px) {
      .matrix {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <section class="stack">
      <h1>Matriz de Eisenhower</h1>
      <div class="row">
        <label>
          Categoría
          <select
            (change)="categoryId.set($any($event.target).value); reload()"
          >
            <option value="">Todas</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>
        <label>
          Proyecto
          <select (change)="projectId.set($any($event.target).value); reload()">
            <option value="">Todos</option>
            @for (project of projects(); track project.id) {
              <option [value]="project.id">{{ project.name }}</option>
            }
          </select>
        </label>
      </div>
      <div class="matrix">
        @for (key of quadrants; track key.id) {
          <article class="card q {{ key.id }}">
            <h2>{{ key.label }}</h2>
            @for (task of byQuadrant(key.id); track task.id) {
              <p>{{ task.title }}</p>
            }
          </article>
        }
      </div>
    </section>
  `,
})
export class MatrixPage {
  private readonly api = inject(QuadrantApi);
  protected readonly tasks = signal<TaskView[]>([]);
  protected readonly categories = signal<Array<{ id: string; name: string }>>(
    [],
  );
  protected readonly projects = signal<Array<{ id: string; name: string }>>([]);
  protected readonly categoryId = signal('');
  protected readonly projectId = signal('');
  protected readonly quadrants = [
    { id: 'ui' as const, label: 'Urgente e importante' },
    { id: 'in' as const, label: 'Importante, no urgente' },
    { id: 'un' as const, label: 'Urgente, no importante' },
    { id: 'nn' as const, label: 'Ni urgente ni importante' },
  ];

  constructor() {
    void this.bootstrap();
  }

  byQuadrant(id: TaskView['quadrant']) {
    return this.tasks().filter((task) => task.quadrant === id);
  }

  async reload() {
    const envelope = await this.api.invoke<{ tasks: TaskView[] }>(
      'backlog.list',
      {
        ...(this.categoryId() ? { categoryId: this.categoryId() } : {}),
        ...(this.projectId() ? { projectId: this.projectId() } : {}),
      },
    );
    if (envelope.status === 'ok' && envelope.result) {
      this.tasks.set(envelope.result.tasks);
    }
  }

  private async bootstrap() {
    const categories = await this.api.invoke<{
      categories: Array<{ id: string; name: string }>;
    }>('category.list');
    const projects = await this.api.invoke<{
      projects: Array<{ id: string; name: string }>;
    }>('project.list');
    if (categories.result) {
      this.categories.set(categories.result.categories);
    }
    if (projects.result) {
      this.projects.set(projects.result.projects);
    }
    await this.reload();
  }
}
