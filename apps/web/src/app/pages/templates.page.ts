import { Component, inject, signal } from '@angular/core';
import { QuadrantApi } from '../quadrant-api';
import type { HttpsQuadrantLocalSchemasTemplateListOutputJson as TemplateResult } from '@quadrant/capabilities';
import { slotLabel } from '../work-labels';

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
          <p>
            {{ template.slots.length }} bloques ·
            {{ totalHours(template) }} horas nominales semanales
          </p>
          <ul>
            @for (slot of template.slots; track $index) {
              <li>
                {{ days[slot.weekday - 1] }} · {{ slotLabel(slot.kind) }} ·
                {{ slot.durationMinutes }} min nominales
              </li>
            }
          </ul>
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
  protected readonly slotLabel = slotLabel;
  protected readonly days = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];
  private readonly api = inject(QuadrantApi);
  protected readonly templates = signal<TemplateResult['templates']>([]);
  totalHours(template: TemplateResult['templates'][number]) {
    return new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(
      template.slots.reduce((sum, slot) => sum + slot.durationMinutes, 0) / 60,
    );
  }

  constructor() {
    void this.reload();
  }

  async duplicate(templateId: string) {
    await this.api.invoke('template.duplicate', { templateId });
    await this.reload();
  }

  private async reload() {
    const envelope = await this.api.invoke<TemplateResult>('template.list');
    if (envelope.result) {
      this.templates.set(envelope.result.templates);
    }
  }
}
