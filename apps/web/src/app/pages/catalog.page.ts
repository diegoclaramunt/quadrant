import { Component, inject, signal } from '@angular/core';
import { QuadrantApi } from '../quadrant-api';

@Component({
  selector: 'app-catalog-page',
  template: `
    <section class="stack">
      <h1>Categorías y proyectos</h1>
      <form class="panel row" (submit)="createCategory($event)">
        <input name="category" placeholder="Nueva categoría" />
        <button type="submit">Crear categoría</button>
      </form>
      <form class="panel row" (submit)="createProject($event)">
        <input name="project" placeholder="Nuevo proyecto" />
        <select name="categoryId">
          @for (category of categories(); track category.id) {
            <option [value]="category.id">{{ category.name }}</option>
          }
        </select>
        <button type="submit">Crear proyecto</button>
      </form>
      <div class="row">
        @for (category of categories(); track category.id) {
          <article class="card">
            <h2>{{ category.name }}</h2>
            <button
              type="button"
              class="secondary"
              (click)="archiveCategory(category.id)"
            >
              Archivar
            </button>
          </article>
        }
      </div>
      <ul class="stack">
        @for (project of projects(); track project.id) {
          <li class="card">
            {{ project.name }}
            <button
              type="button"
              class="secondary"
              (click)="archiveProject(project.id)"
            >
              Archivar
            </button>
          </li>
        }
      </ul>
    </section>
  `,
})
export class CatalogPage {
  private readonly api = inject(QuadrantApi);
  protected readonly categories = signal<Array<{ id: string; name: string }>>(
    [],
  );
  protected readonly projects = signal<Array<{ id: string; name: string }>>([]);

  constructor() {
    void this.reload();
  }

  async createCategory(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const name = String(new FormData(form).get('category') ?? '').trim();
    if (!name) {
      return;
    }
    await this.api.invoke('category.create', { name });
    form.reset();
    await this.reload();
  }

  async createProject(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get('project') ?? '').trim();
    const categoryId = String(data.get('categoryId') ?? '');
    if (!name || !categoryId) {
      return;
    }
    await this.api.invoke('project.create', { name, categoryId });
    form.reset();
    await this.reload();
  }

  async archiveCategory(categoryId: string) {
    await this.api.invoke('category.archive', { categoryId });
    await this.reload();
  }

  async archiveProject(projectId: string) {
    await this.api.invoke('project.archive', { projectId });
    await this.reload();
  }

  private async reload() {
    const categories = await this.api.invoke<{
      categories: Array<{ id: string; name: string }>;
    }>('category.list');
    const projects = await this.api.invoke<{
      projects: Array<{ id: string; name: string }>;
    }>('project.list');
    this.categories.set(categories.result?.categories ?? []);
    this.projects.set(projects.result?.projects ?? []);
  }
}
