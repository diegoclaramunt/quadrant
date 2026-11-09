import {
  Component,
  ElementRef,
  computed,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addDays, isoWeekday, mondayOf, weekCapacity } from '@quadrant/domain';
import type {
  HttpsQuadrantLocalSchemasWeekCurrentOutputJson as WeekResult,
  HttpsQuadrantLocalSchemasPlanProposeOutputJson as ProposalResult,
  Slot,
} from '@quadrant/capabilities';
import { QuadrantApi, type TaskView, type Envelope } from '../quadrant-api';
import { workLabel, slotLabel, workHelp } from '../work-labels';

@Component({
  selector: 'app-week-page',
  imports: [FormsModule],
  styles: `
    .week {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 6px;
    }
    .day {
      display: flex;
      flex-direction: column;
      padding: 16px 4px;
      gap: 5px;
      text-align: center;
      color: inherit;
      background: transparent;
      border-color: transparent;
      border-radius: 16px;
    }
    .day.selected {
      background: var(--accent);
      color: white;
    }
    .day small {
      font-size: 23px;
      font-weight: 400;
    }
    .day-dot {
      height: 4px;
      width: 4px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.5;
    }
    .panel > .card {
      border: 0;
      border-top: 1px solid var(--line);
      border-radius: 0;
      padding: 20px 0 0;
      gap: 14px;
    }
    @media (max-width: 600px) {
      .day {
        min-width: 0;
        padding: 12px 2px;
        font-size: 11px;
        border-radius: 12px;
      }
    }
  `,
  template: `
    <section class="stack" [attr.aria-busy]="busy()">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Organiza con intención</p>
          <h1>Semana</h1>
        </div>
        <button type="button" (click)="planning.set(!planning())">
          {{ planning() ? 'Volver a mi semana' : 'Planificar semana' }}
        </button>
      </header>
      @if (notice()) {
        <p class="notice" role="status">{{ notice() }}</p>
      }
      @if (error() && !confirmation()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <nav
        class="stepper"
        aria-label="Etapas de planificación"
        [hidden]="!planning()"
      >
        <button
          type="button"
          [class.current-step]="stage() === 'availability'"
          (click)="stage.set('availability')"
        >
          1. Disponibilidad
        </button>
        <button
          type="button"
          [class.current-step]="stage() === 'reservations'"
          [disabled]="!capacityReviewed()"
          (click)="stage.set('reservations')"
        >
          2. Reservas <span class="muted">(opcional)</span>
        </button>
        <button
          type="button"
          [class.current-step]="stage() === 'review'"
          [disabled]="!capacityReviewed() || busy()"
          (click)="stage.set('review'); propose()"
        >
          3. Revisar plan
        </button>
      </nav>
      @if (!week()?.id) {
        <section class="panel empty-state">
          <span class="empty-symbol" aria-hidden="true">+</span>
          <h2>Haz sitio a lo importante.</h2>
          <p>
            Abre tu semana y decide cuánto espacio quieres dedicar a cada cosa.
          </p>
          <button type="button" [disabled]="busy()" (click)="openWeek()">
            Preparar semana
          </button>
        </section>
      }
      <details class="week-actions" [hidden]="!planning()">
        <summary>Cierre y cambio de semana</summary>
        <div class="row">
          <button
            type="button"
            [disabled]="busy() || !!week()?.id"
            (click)="openWeek()"
          >
            Abrir semana actual
          </button>
          <label
            >Destino de la revisión
            <select
              [ngModel]="targetWeekStart()"
              (change)="targetWeekStart.set($any($event.target).value)"
            >
              @for (start of reviewTargets(); track start) {
                <option [value]="start">
                  {{ start }} — {{ endOfWeek(start) }}
                </option>
              }
            </select>
          </label>
          <button
            type="button"
            class="secondary"
            [disabled]="busy() || !targetWeekStart()"
            (click)="review()"
          >
            Revisar y abrir semana elegida
          </button>
        </div>
        <p class="muted">
          La revisión cierra ahora la semana abierta y marca sus bloques
          pendientes como no realizados. Solo puede haber una semana abierta.
        </p>
      </details>
      @if (week(); as currentWeek) {
        @if (currentWeek.id) {
          <p class="editorial-intro">
            {{ shortDate(1) }} — {{ shortDate(7) }} · Tu tiempo, con intención.
          </p>
          @if (capacity(); as total) {
            <p class="muted">
              Capacidad nominal: {{ hours(total.totalMinutes) }} h · ocupadas
              {{ hours(total.occupiedMinutes) }} h · libres
              {{ hours(total.freeMinutes) }} h
            </p>
          }
          <section
            class="panel stack"
            aria-label="Disponibilidad"
            [hidden]="!planning() || stage() !== 'availability'"
          >
            <h2>Disponibilidad</h2>
            <p>
              La plantilla inicial representa 25 horas semanales. Descuenta
              reuniones y obligaciones externas ajustando los bloques de esta
              semana.
            </p>
            <p class="notice">
              La capacidad mostrada es la de esta semana. Ajustar un slot lo
              guarda inmediatamente en la semana.
            </p>
            <button
              type="button"
              class="secondary"
              (click)="capacityReviewed.set(true); stage.set('reservations')"
            >
              Continuar
            </button>
            <div class="row">
              <label
                >Día
                <select
                  [ngModel]="selectedDay()"
                  (change)="selectedDay.set(+$any($event.target).value)"
                >
                  @for (day of days; track day.value) {
                    <option [value]="day.value">{{ day.label }}</option>
                  }
                </select></label
              >
              <label
                >Tipo de bloque
                <select
                  [ngModel]="newKind()"
                  (change)="newKind.set($any($event.target).value)"
                >
                  <option value="deep">Concentración o tareas cortas</option>
                  <option value="project">Sesión abierta · 2 h</option>
                </select></label
              >
              @if (newKind() === 'deep') {
                <label
                  >Minutos
                  <input
                    type="number"
                    min="60"
                    max="120"
                    [value]="newMinutes()"
                    (input)="newMinutes.set(+$any($event.target).value)"
                /></label>
              }
              <button type="button" [disabled]="busy()" (click)="addSlot()">
                Añadir bloque a esta semana
              </button>
            </div>
          </section>
          <div
            class="week"
            aria-label="Elegir día"
            [hidden]="planning() && stage() !== 'availability'"
          >
            @for (day of days; track day.value) {
              <button
                type="button"
                class="card day"
                [class.selected]="selectedDay() === day.value"
                [attr.aria-pressed]="selectedDay() === day.value"
                [attr.aria-label]="day.label + ' ' + shortDate(day.value)"
                (click)="selectedDay.set(day.value)"
              >
                <strong>{{ day.label.slice(0, 3) }}</strong
                ><small>{{ dateFor(day.value).slice(-2) }}</small>
                <span
                  class="day-dot"
                  [style.visibility]="
                    slotsFor(day.value).length ? 'visible' : 'hidden'
                  "
                  aria-hidden="true"
                ></span>
              </button>
            }
          </div>
          <section
            class="panel stack"
            [hidden]="planning() && stage() !== 'availability'"
          >
            <h2>
              {{ days[selectedDay() - 1].label }}
              <span class="muted">· {{ shortDate(selectedDay()) }}</span>
            </h2>
            @if (!slotsFor(selectedDay()).length) {
              <p class="muted">
                Un día sin bloques. Deja espacio o añade disponibilidad al
                planificar.
              </p>
            }
            @for (slot of slotsFor(selectedDay()); track slot.id) {
              <div class="card stack">
                <p>
                  {{ slotLabel(slot.kind) }} · {{ slot.durationMinutes }} min
                </p>
                <p class="muted">
                  {{ slotCapacity(slot).occupiedMinutes }} min ocupados ·
                  {{ slotCapacity(slot).freeMinutes }} min libres (nominales)
                </p>
                @for (block of blocksFor(slot.id); track block.id) {
                  <div class="row">
                    <span
                      >{{ taskTitle(block.taskId) }} ·
                      {{ statusLabel(block.status) }} ·
                      {{ block.nominalMinutes }} min nominales</span
                    >
                    @if (block.status === 'planned') {
                      <button
                        type="button"
                        [disabled]="busy() || dateFor(slot.weekday) > today()"
                        (click)="execute(block.id)"
                      >
                        Ejecutar
                      </button>
                      <button
                        type="button"
                        class="secondary"
                        [disabled]="busy()"
                        (click)="cancel(block.id)"
                      >
                        Cancelar
                      </button>
                    }
                  </div>
                }
                <details>
                  <summary>Asignar una tarea</summary>
                  <div class="stack">
                    <label
                      >Asignar tarea manualmente
                      <select
                        [disabled]="busy()"
                        (change)="manualTask.set($any($event.target).value)"
                      >
                        <option value="">Elegir del backlog</option>
                        @for (task of backlog(); track task.id) {
                          <option [value]="task.id">
                            {{ task.title }} ({{ workLabel(task.workType) }})
                          </option>
                        }
                      </select>
                    </label>
                    <button
                      type="button"
                      [disabled]="busy() || !manualTask()"
                      (click)="
                        schedule(slot.id, manualTask()); manualTask.set('')
                      "
                    >
                      Asignar bloque
                    </button>
                  </div>
                </details>
                <details>
                  <summary>Ajustar este bloque semanal</summary>
                  <div class="row">
                    <label
                      >Día
                      <select #slotDay [ngModel]="slot.weekday">
                        @for (day of days; track day.value) {
                          <option [value]="day.value">{{ day.label }}</option>
                        }
                      </select></label
                    >
                    <label
                      >Orden
                      <input #slotOrder type="number" [value]="slot.order"
                    /></label>
                    <label
                      >Minutos nominales
                      <input
                        #slotMinutes
                        type="number"
                        min="60"
                        max="120"
                        [disabled]="slot.kind === 'project'"
                        [value]="slot.durationMinutes"
                    /></label>
                    <button
                      type="button"
                      [disabled]="busy()"
                      (click)="
                        adjust({
                          op: 'change',
                          slotId: slot.id,
                          weekday: +slotDay.value,
                          order: +slotOrder.value,
                          durationMinutes: +slotMinutes.value,
                        })
                      "
                    >
                      Guardar ajuste
                    </button>
                    <button
                      type="button"
                      class="secondary"
                      [disabled]="busy()"
                      (click)="adjust({ op: 'remove', slotId: slot.id })"
                    >
                      Quitar bloque
                    </button>
                  </div>
                </details>
              </div>
            }
          </section>
          <section
            class="panel stack"
            [hidden]="!planning() || stage() !== 'reservations'"
          >
            <h2>Reservas opcionales</h2>
            <p>Estas reservas solo se aplican al aceptar la propuesta.</p>
            <label
              ><input
                type="checkbox"
                [checked]="importantOnly()"
                (change)="importantOnly.set($any($event.target).checked)"
              />
              Mostrar solo tareas importantes sin fecha</label
            >
            <div class="row">
              <label
                >Tarea
                <select
                  [ngModel]="reservationTask()"
                  (change)="reservationTask.set($any($event.target).value)"
                >
                  <option value="">Elige una tarea</option>
                  @for (task of reservationTasks(); track task.id) {
                    <option [value]="task.id">
                      {{ task.title }} · {{ workLabel(task.workType) }}
                    </option>
                  }
                </select></label
              >
              <label
                >Bloque compatible
                <select #reservationSlot>
                  <option value="">Elige un bloque</option>
                  @for (slot of reservationSlots(); track slot.id) {
                    <option [value]="slot.id">
                      {{ slotDescription(slot.id) }}
                    </option>
                  }
                </select></label
              >
              <button
                type="button"
                [disabled]="busy() || !reservationTask()"
                (click)="reserve(reservationSlot.value)"
              >
                Añadir reserva
              </button>
            </div>
            <ul>
              @for (item of reservations(); track $index) {
                <li>
                  {{ taskTitle(item.taskId) }} →
                  {{ slotDescription(item.slotId) }}
                  <button
                    type="button"
                    class="secondary"
                    [disabled]="busy()"
                    (click)="removeReservation($index)"
                  >
                    Quitar reserva
                  </button>
                </li>
              }
            </ul>
            <button
              class="secondary"
              type="button"
              [disabled]="busy()"
              (click)="stage.set('review'); propose()"
            >
              {{
                reservations().length
                  ? 'Revisar plan'
                  : 'Continuar sin reservas'
              }}
            </button>
            @if (!capacityReviewed()) {
              <p>
                Revisa la capacidad de arriba antes de generar la propuesta.
              </p>
            }
          </section>
        }
      }
      @if (proposal(); as plan) {
        <section
          class="panel stack"
          aria-label="Propuesta"
          [hidden]="!planning() || stage() !== 'review'"
        >
          <h2>Revisar plan</h2>
          <p>
            {{ plan.assignments.length }} asignaciones ·
            {{ plan.unmatched.length }} tareas sin colocar ·
            {{ plan.emptySlots.length }} bloques vacíos.
          </p>
          @if (proposalCapacity(); as total) {
            <p>
              Tras aceptar: {{ hours(total.occupiedMinutes) }} h nominales
              ocupadas y {{ hours(total.freeMinutes) }} h libres.
            </p>
          }
          <ul>
            @for (item of plan.assignments; track $index) {
              <li>
                {{ taskTitle(item.taskId) }} →
                {{ slotDescription(item.slotId) }} ·
                {{ item.nominalMinutes }} min nominales
                {{
                  isReserved(item.taskId, item.slotId)
                    ? '· Reserva elegida'
                    : ''
                }}
              </li>
            }
          </ul>
          <h3>Tareas sin colocar</h3>
          <ul>
            @for (item of plan.unmatched; track item.taskId) {
              <li>
                {{ taskTitle(item.taskId) }}: {{ reasonLabel(item.reason) }}
                @if (dueThisWeek(item.taskId)) {
                  <strong>
                    · Vencida o con fecha límite esta semana: revisa tus
                    reservas.</strong
                  >
                }
              </li>
            }
          </ul>
          <p>
            Bloques vacíos:
            @for (id of plan.emptySlots; track id) {
              {{ slotDescription(id) }};
            }
          </p>
          <button type="button" [disabled]="busy()" (click)="accept()">
            Aceptar propuesta · Aplicar plan
          </button>
        </section>
      }
      <dialog
        #confirmationDialog
        class="dialog stack"
        aria-label="Confirmar acción"
        aria-describedby="week-confirmation-summary"
        [attr.aria-busy]="busy()"
        (cancel)="cancelConfirmation($event)"
      >
        @if (confirmation(); as pending) {
          <h2>
            {{
              pending.id === 'week.review'
                ? 'Cerrar y cambiar de semana'
                : 'Confirmar acción'
            }}
          </h2>
          <p id="week-confirmation-summary">{{ pending.summary }}</p>
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
          <div class="row">
            <button
              type="button"
              [disabled]="busy()"
              (click)="confirmPending()"
            >
              {{ busy() ? 'Aplicando…' : 'Confirmar' }}
            </button>
            <button
              type="button"
              class="secondary"
              autofocus
              [disabled]="busy()"
              (click)="cancelConfirmation()"
            >
              Cancelar
            </button>
          </div>
        }
      </dialog>
    </section>
  `,
})
export class WeekPage {
  private readonly api = inject(QuadrantApi);
  private readonly confirmationDialog =
    viewChild<ElementRef<HTMLDialogElement>>('confirmationDialog');
  protected readonly notice = signal('');
  protected readonly week = signal<WeekResult['week'] | null>(null);
  protected readonly backlog = signal<TaskView[]>([]);
  protected readonly selectedDay = signal(1);
  protected readonly proposal = signal<ProposalResult['proposal'] | null>(null);
  protected readonly reservations = signal<
    { taskId: string; slotId: string }[]
  >([]);
  protected readonly reservationTask = signal('');
  protected readonly importantOnly = signal(true);
  protected readonly reservationTasks = computed(() =>
    this.backlog().filter(
      (task) => !this.importantOnly() || (task.important && !task.deadline),
    ),
  );
  protected readonly capacityReviewed = signal(false);
  protected readonly planning = signal(false);
  protected readonly stage = signal<'availability' | 'reservations' | 'review'>(
    'availability',
  );
  protected readonly manualTask = signal('');
  protected readonly targetWeekStart = signal('');
  protected readonly newKind = signal<'deep' | 'project'>('deep');
  protected readonly newMinutes = signal(90);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly confirmation = signal<{
    id: string;
    payload: Record<string, unknown>;
    token: string;
    summary: string;
  } | null>(null);
  protected readonly workLabel = workLabel;
  protected readonly slotLabel = slotLabel;
  protected readonly workHelp = workHelp;
  protected readonly days = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ].map((label, index) => ({ label, value: index + 1 }));
  protected readonly today = computed(() => this.week()?.today ?? '');
  protected readonly reviewTargets = computed(() =>
    this.today()
      ? [mondayOf(this.today()), addDays(mondayOf(this.today()), 7)]
      : [],
  );
  protected readonly capacity = computed(() =>
    this.week() ? weekCapacity(this.week()!.slots, this.week()!.blocks) : null,
  );
  protected readonly proposalCapacity = computed(() =>
    this.week() && this.proposal()
      ? weekCapacity(this.week()!.slots, [
          ...this.week()!.blocks,
          ...this.proposal()!.assignments.map((item) => ({
            ...item,
            status: 'planned' as const,
          })),
        ])
      : null,
  );

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.confirmationDialog()?.nativeElement;
      const pending = this.confirmation();
      if (!dialog) return;
      if (pending && !dialog.open) dialog.showModal();
      else if (!pending && dialog.open) dialog.close();
    });
    void this.reload();
  }
  slotsFor(day: number) {
    return (this.week()?.slots ?? []).filter((slot) => slot.weekday === day);
  }
  blocksFor(slotId: string) {
    return (this.week()?.blocks ?? []).filter(
      (block) => block.slotId === slotId,
    );
  }
  slotCapacity(slot: Slot) {
    return weekCapacity([slot], this.blocksFor(slot.id));
  }
  taskTitle(taskId: string) {
    return (
      this.backlog().find((task) => task.id === taskId)?.title ??
      'Tarea sin título'
    );
  }
  statusLabel(value: string) {
    return (
      (
        {
          planned: 'Pendiente',
          executed: 'Realizado',
          cancelled: 'Cancelado',
          missed: 'No realizado',
        } as Record<string, string>
      )[value] ?? 'Pendiente'
    );
  }
  shortDate(day: number) {
    const value = this.dateFor(day);
    return value
      ? new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'short',
        }).format(new Date(`${value}T12:00:00`))
      : '';
  }
  hours(minutes: number) {
    return new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(
      minutes / 60,
    );
  }
  endOfWeek(start: string) {
    return addDays(start, 6);
  }
  dateFor(day: number) {
    return this.week()?.weekStart
      ? addDays(this.week()!.weekStart!, day - 1)
      : '';
  }
  slotDescription(id: string) {
    const slot = this.week()?.slots.find((item) => item.id === id);
    return slot
      ? `${this.dateFor(slot.weekday)} · ${slot.order} · ${slotLabel(slot.kind)} · ${slot.durationMinutes} min`
      : 'Bloque no encontrado';
  }
  reasonLabel(reason: string) {
    return (
      (
        {
          no_compatible_slot: 'No hay un bloque del tipo necesario',
          slot_full: 'No queda capacidad compatible',
          already_planned: 'Ya tiene un bloque pendiente',
          not_available: 'No está disponible en las fechas de los bloques',
        } as Record<string, string>
      )[reason] ?? reason
    );
  }
  dueThisWeek(taskId: string) {
    const deadline = this.backlog().find(
      (task) => task.id === taskId,
    )?.deadline;
    return Boolean(
      deadline &&
        this.week()?.weekStart &&
        deadline <= this.endOfWeek(this.week()!.weekStart!),
    );
  }
  isReserved(taskId: string, slotId: string) {
    return this.proposal()?.reservations?.some(
      (item) => item.taskId === taskId && item.slotId === slotId,
    );
  }
  reservationSlots(): Slot[] {
    const task = this.reservationTasks().find(
      (item) => item.id === this.reservationTask(),
    );
    if (!task) return [];
    return (this.week()?.slots ?? []).filter((slot) => {
      if (
        (slot.kind === 'project') !== (task.workType === 'project') ||
        this.dateFor(slot.weekday) < this.today() ||
        (task.availableOn && task.availableOn > this.dateFor(slot.weekday))
      )
        return false;
      const active = this.week()!.blocks.filter(
        (block) => block.status === 'planned' || block.status === 'executed',
      );
      if (
        task.workType !== 'project' &&
        (active.some(
          (block) => block.taskId === task.id && block.status === 'planned',
        ) ||
          this.reservations().some((item) => item.taskId === task.id))
      )
        return false;
      const occupants = [
        ...active.filter((block) => block.slotId === slot.id),
        ...this.reservations()
          .filter((item) => item.slotId === slot.id)
          .map((item) => {
            const reserved = this.backlog().find(
              (candidate) => candidate.id === item.taskId,
            );
            return {
              taskId: item.taskId,
              nominalMinutes:
                reserved?.workType === 'brief'
                  ? 10
                  : reserved?.workType === 'short'
                    ? (reserved.nominalMinutes ?? 30)
                    : slot.durationMinutes,
            };
          }),
      ];
      if (task.workType === 'deep' || task.workType === 'project')
        return occupants.length === 0;
      if (
        occupants.some((item) => {
          const type = this.backlog().find(
            (candidate) => candidate.id === item.taskId,
          )?.workType;
          return !type || type === 'deep' || type === 'project';
        })
      )
        return false;
      return (
        occupants.reduce((sum, item) => sum + item.nominalMinutes, 0) +
          (task.workType === 'brief' ? 10 : (task.nominalMinutes ?? 30)) <=
        slot.durationMinutes
      );
    });
  }
  reserve(slotId: string) {
    if (!this.reservationSlots().some((slot) => slot.id === slotId)) {
      this.error.set('Elige una tarea y un bloque compatible.');
      return;
    }
    this.reservations.update((items) => [
      ...items,
      { taskId: this.reservationTask(), slotId },
    ]);
    this.proposal.set(null);
    this.error.set('');
  }
  removeReservation(index: number) {
    this.reservations.update((items) => items.filter((_, i) => i !== index));
    this.proposal.set(null);
  }
  async openWeek() {
    await this.mutate('week.open', {});
  }
  async review() {
    await this.mutate('week.review', {
      targetWeekStart: this.targetWeekStart(),
    });
  }
  async addSlot() {
    await this.adjust({
      op: 'add',
      weekday: this.selectedDay(),
      order:
        Math.max(
          0,
          ...this.slotsFor(this.selectedDay()).map((slot) => slot.order),
        ) + 1,
      kind: this.newKind(),
      durationMinutes: this.newKind() === 'project' ? 120 : this.newMinutes(),
    });
  }
  async adjust(operation: Record<string, unknown>) {
    if (
      await this.mutate('week.adjust_slots', {
        weekPlanId: this.week()?.id,
        operations: [operation],
      })
    )
      this.capacityReviewed.set(false);
  }
  async propose() {
    if (this.busy() || !this.capacityReviewed()) return;
    this.busy.set(true);
    try {
      const envelope = await this.api.invoke<ProposalResult>('plan.propose', {
        weekPlanId: this.week()?.id,
        reservations: this.reservations(),
      });
      if (envelope.status === 'ok' && envelope.result) {
        this.proposal.set(envelope.result.proposal);
        this.error.set('');
      } else this.showError(envelope);
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
    } finally {
      this.busy.set(false);
    }
  }
  async accept() {
    const plan = this.proposal();
    if (plan && (await this.mutate('plan.accept', { proposalId: plan.id })))
      this.reservations.set([]);
  }
  async schedule(slotId: string, taskId: string) {
    if (taskId) await this.mutate('block.schedule', { slotId, taskId });
  }
  async execute(blockId: string) {
    await this.mutate('block.execute', { blockId });
  }
  async cancel(blockId: string) {
    await this.mutate('block.cancel', { blockId });
  }
  cancelConfirmation(event?: Event) {
    event?.preventDefault();
    if (this.busy()) return;
    this.confirmation.set(null);
    this.error.set('');
  }
  async confirmPending() {
    const pending = this.confirmation();
    if (!pending || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const envelope = await this.api.confirm(
        pending.id,
        pending.payload,
        pending.token,
      );
      if (envelope.status !== 'ok') {
        this.showError(envelope);
        return;
      }
      this.confirmation.set(null);
      this.error.set('');
      await this.reload();
      if (pending.id === 'week.review') {
        this.planning.set(true);
        this.stage.set('availability');
        this.selectedDay.set(1);
        this.notice.set(
          `Semana abierta: ${this.shortDate(1)} — ${this.shortDate(7)}. Ya puedes planificarla.`,
        );
      }
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
    } finally {
      this.busy.set(false);
    }
  }
  private showError(envelope: Envelope) {
    this.error.set(
      envelope.error?.message ??
        (envelope.status === 'needs_confirmation'
          ? 'No se pudo confirmar la operación. Cancela y vuelve a intentarlo.'
          : 'Operación no aplicada'),
    );
  }
  private async mutate(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      const request = {
        ...payload,
        request_id: crypto.randomUUID(),
      };
      const envelope = await this.api.invoke(id, request);
      if (
        envelope.status === 'needs_confirmation' &&
        envelope.confirmation_token
      ) {
        this.confirmation.set({
          id,
          payload: request,
          token: envelope.confirmation_token,
          summary: envelope.summary ?? '¿Confirmas esta acción?',
        });
        return false;
      }
      if (envelope.status !== 'ok') {
        this.showError(envelope);
        return false;
      }
      this.error.set('');
      this.proposal.set(null);
      await this.reload();
      return true;
    } catch {
      this.error.set('No se pudo conectar con Quadrant.');
      return false;
    } finally {
      this.busy.set(false);
    }
  }
  private async reload() {
    const [current, backlog] = await Promise.all([
      this.api.invoke<WeekResult>('week.current'),
      this.api.invoke<{ tasks: TaskView[] }>('backlog.list'),
    ]);
    if (current.result) {
      const previous = this.week()?.id;
      this.week.set(current.result.week);
      if (previous !== current.result.week.id) {
        this.capacityReviewed.set(false);
        this.reservations.set([]);
        this.proposal.set(null);
      }
      if (
        !this.reviewTargets().includes(this.targetWeekStart()) &&
        this.today()
      )
        this.targetWeekStart.set(
          addDays(
            mondayOf(this.today()),
            isoWeekday(this.today()) >= 5 ? 7 : 0,
          ),
        );
    }
    if (backlog.result) this.backlog.set(backlog.result.tasks);
  }
}
