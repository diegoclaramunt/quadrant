import { Component, inject, signal } from '@angular/core';
import { QuadrantApi } from '../quadrant-api';

@Component({
  selector: 'app-templates-page',
  template: `
    <section class="stack">
      <h1>Plantillas</h1>
      <p class="muted">Editar una plantilla no cambia semanas ya creadas.</p>
      @for (template of templates(); track template.id) {
        <article class="card">
          <h2>
            {{ template.name }}
            @if (template.isDefault) {
              (predeterminada)
            }
          </h2>
          <p>{{ template.slots.length }} slots</p>
          <button
            type="button"
            class="secondary"
            (click)="duplicate(template.id)"
          >
            Duplicar
          </button>
        </article>
      }
    </section>
  `,
})
export class TemplatesPage {
  private readonly api = inject(QuadrantApi);
  protected readonly templates = signal<
    Array<{ id: string; name: string; isDefault: boolean; slots: unknown[] }>
  >([]);

  constructor() {
    void this.reload();
  }

  async duplicate(templateId: string) {
    await this.api.invoke('template.duplicate', { templateId });
    await this.reload();
  }

  private async reload() {
    const envelope = await this.api.invoke<{
      templates: Array<{
        id: string;
        name: string;
        isDefault: boolean;
        slots: unknown[];
      }>;
    }>('template.list');
    if (envelope.result) {
      this.templates.set(envelope.result.templates);
    }
  }
}
