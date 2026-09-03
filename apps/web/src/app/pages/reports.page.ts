import { Component, inject, signal } from '@angular/core';
import { QuadrantApi } from '../quadrant-api';

@Component({
  selector: 'app-reports-page',
  template: `
    <section class="stack">
      <h1>Reportes nominales</h1>
      <p class="muted">
        Solo los bloques ejecutados cuentan como trabajo realizado. No hay
        progreso.
      </p>
      <div class="row">
        <label
          >Desde
          <input
            type="date"
            [value]="from()"
            (input)="from.set($any($event.target).value)"
        /></label>
        <label
          >Hasta
          <input
            type="date"
            [value]="to()"
            (input)="to.set($any($event.target).value)"
        /></label>
        <button type="button" (click)="reload()">Consultar</button>
      </div>
      @if (report(); as data) {
        <article class="card">
          <p>Planificados: {{ data.totals.planned }}</p>
          <p>
            Ejecutados: {{ data.totals.executed }} ({{
              hours(data.totals.executedMinutes)
            }}
            h nominales)
          </p>
          <p>Cancelados: {{ data.totals.cancelled }}</p>
          <p>Perdidos: {{ data.totals.missed }}</p>
        </article>
        <ul class="stack">
          @for (group of data.groups; track group.id) {
            <li class="card">
              {{ group.kind }} · {{ group.name }} ·
              {{ hours(group.executedMinutes) }} h ejecutadas · P
              {{ group.planned }} / E {{ group.executed }} / C
              {{ group.cancelled }} / M {{ group.missed }}
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class ReportsPage {
  private readonly api = inject(QuadrantApi);
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly report = signal<{
    totals: {
      planned: number;
      executed: number;
      cancelled: number;
      missed: number;
      executedMinutes: number;
    };
    groups: Array<{
      id: string;
      name: string;
      kind: string;
      planned: number;
      executed: number;
      cancelled: number;
      missed: number;
      executedMinutes: number;
    }>;
  } | null>(null);

  constructor() {
    void this.reload();
  }

  hours(minutes: number) {
    return (minutes / 60).toFixed(1);
  }

  async reload() {
    const envelope = await this.api.invoke<{
      totals: {
        planned: number;
        executed: number;
        cancelled: number;
        missed: number;
        executedMinutes: number;
      };
      groups: Array<{
        id: string;
        name: string;
        kind: string;
        planned: number;
        executed: number;
        cancelled: number;
        missed: number;
        executedMinutes: number;
      }>;
    }>('report.nominal_time', {
      ...(this.from() ? { from: this.from() } : {}),
      ...(this.to() ? { to: this.to() } : {}),
    });
    if (envelope.result) {
      this.report.set(envelope.result);
    }
  }
}
