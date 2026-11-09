import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuadrantApi, type TaskView } from '../quadrant-api';

type Quadrant = TaskView['quadrant'];
interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}
interface Category {
  id: string;
  name: string;
  archived: boolean;
}

/** Los cuatro cuadrantes del tablero, en el orden de las teclas 1–4. */
export const QUADRANTS: ReadonlyArray<{
  id: Quadrant;
  key: number;
  name: string;
  sub: string;
  urgent: boolean;
  important: boolean;
}> = [
  {
    id: 'ui',
    key: 1,
    name: 'Hacer ya',
    sub: 'Urgente e importante',
    urgent: true,
    important: true,
  },
  {
    id: 'in',
    key: 2,
    name: 'Planificar',
    sub: 'Importante, sin prisa',
    urgent: false,
    important: true,
  },
  {
    id: 'un',
    key: 3,
    name: 'Despachar',
    sub: 'Urgente, poco importante',
    urgent: true,
    important: false,
  },
  {
    id: 'nn',
    key: 4,
    name: 'Algún día',
    sub: 'Ni urgente ni importante',
    urgent: false,
    important: false,
  },
];

/** «Revisar PR #warpcom» → ['Revisar PR', 'warpcom']. */
export function parseLine(line: string): [string, string | null] {
  const match = line.match(/\s#([\p{L}\d_-]+)\s*$/u);
  if (!match || match.index === undefined) return [line.trim(), null];
  return [line.slice(0, match.index).trim(), match[1]];
}

const norm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const UNDO_MS = 5000;

@Component({
  selector: 'app-board-page',
  imports: [FormsModule],
  template: `
    <section class="board">
      <form class="capture" (submit)="capture($event)" autocomplete="off">
        <input
          #captureInput
          id="capture-input"
          name="capture"
          aria-label="Nueva tarea"
          placeholder="Nueva tarea…"
          [(ngModel)]="draft"
          (paste)="paste($event)"
          [disabled]="busy()"
        />
        <kbd>Enter</kbd>
      </form>
      <p class="hint">
        Sin fechas ni tipos. Añade <code>#proyecto</code> al final si quieres
        agruparla. Pega varias líneas para añadir varias.
      </p>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (projectChips().length) {
        <div class="filters" aria-label="Filtrar por proyecto">
          <button
            type="button"
            class="chip"
            [attr.aria-pressed]="!filter()"
            (click)="filter.set(null)"
          >
            Todo
          </button>
          @for (p of projectChips(); track p.id) {
            <button
              type="button"
              class="chip"
              [attr.aria-pressed]="filter() === p.id"
              (click)="filter.set(filter() === p.id ? null : p.id)"
            >
              #{{ p.name }}
            </button>
          }
        </div>
      }

      <section
        class="tray"
        [class.over]="overZone() === 'tray'"
        aria-labelledby="tray-title"
      >
        <div class="tray-head">
          <h2 id="tray-title">Sin colocar</h2>
          <small
            >Elige una tarea y pulsa 1, 2, 3 o 4, arrástrala a su cuadrante o
            tócala dos veces para abrirla.</small
          >
        </div>
        <div class="tray-list">
          @for (t of loose(); track t.id) {
            <div
              class="loose"
              role="button"
              tabindex="0"
              draggable="true"
              [attr.aria-pressed]="selected() === t.id"
              (dragstart)="dragStart($event, t.id)"
              (dragend)="dragEnd()"
              (click)="pick(t.id)"
              (keydown.enter)="pick(t.id)"
              (keydown.space)="$event.preventDefault(); pick(t.id)"
              (dblclick)="open(t)"
            >
              <span>{{ t.title }}</span>
              @if (projectName(t); as name) {
                <small class="proj">#{{ name }}</small>
              }
            </div>
          } @empty {
            <span class="tray-empty"
              >Nada por colocar. Lo que escribas arriba aparecerá aquí.</span
            >
          }
        </div>
      </section>

      <div class="matrix-wrap">
        <div class="axis-x" aria-hidden="true">
          <span>Urgente →</span><span>Sin prisa</span>
        </div>
        <div class="axis-y" aria-hidden="true">
          <span>Menos importante</span><span>Importante ↑</span>
        </div>
        <div class="matrix">
          @for (q of quadrants; track q.id) {
            <section
              class="q"
              [attr.data-q]="q.id"
              [class.over]="overZone() === q.id"
              [class.target]="!!selected()"
              [attr.aria-label]="q.name"
              [attr.tabindex]="selected() ? 0 : -1"
              (click)="dropSelected(q.id)"
              (keydown.enter)="dropSelected(q.id)"
              (dragover)="dragOver($event, q.id)"
              (dragleave)="dragLeave($event, q.id)"
              (drop)="drop($event, q.id)"
            >
              <div class="q-head">
                <h2>{{ q.name }}</h2>
                <span class="key">{{ q.key }}</span>
                <span class="n">{{ byQuadrant(q.id).length }}</span>
              </div>
              <div class="q-sub">{{ q.sub }}</div>
              @if (byQuadrant(q.id).length) {
                <ul>
                  @for (t of byQuadrant(q.id); track t.id) {
                    <li
                      class="task"
                      draggable="true"
                      [class.done]="pendingDone().has(t.id)"
                      (dragstart)="dragStart($event, t.id)"
                      (dragend)="dragEnd()"
                    >
                      <button
                        type="button"
                        class="check"
                        [attr.aria-label]="'Marcar hecha: ' + t.title"
                        (click)="$event.stopPropagation(); complete(t)"
                      ></button>
                      <span
                        role="button"
                        tabindex="0"
                        class="t"
                        (click)="$event.stopPropagation(); open(t)"
                        (keydown.enter)="$event.stopPropagation(); open(t)"
                      >
                        {{ t.title }}
                      </span>
                      @if (projectName(t); as name) {
                        <span class="proj">#{{ name }}</span>
                      }
                    </li>
                  }
                </ul>
              } @else {
                <div class="q-empty">Vacío</div>
              }
            </section>
          }
        </div>
      </div>

      <details class="done-log" (toggle)="loadDone($event)">
        <summary>Hechas</summary>
        <ul>
          @for (t of done(); track t.id) {
            <li>
              {{ t.title }}
              @if (projectName(t); as name) {
                <span class="proj">#{{ name }}</span>
              }
            </li>
          } @empty {
            <li class="muted">Aún no has completado nada.</li>
          }
        </ul>
      </details>
    </section>

    @if (toast(); as tst) {
      <div class="toast" role="status">
        <span>{{ tst.text }}</span>
        @if (tst.undo) {
          <button type="button" (click)="undo()">Deshacer</button>
        }
      </div>
    }

    <dialog
      #sheet
      class="sheet"
      aria-labelledby="sheet-title"
      (close)="closeSheet()"
    >
      @if (editing(); as t) {
        <form class="sheet-in" (submit)="saveTitle($event)">
          <span class="eyebrow" id="sheet-title">{{
            t.status === 'inbox' ? '¿Dónde va?' : 'Mover o editar'
          }}</span>
          <input
            id="sheet-input"
            name="sheet-title"
            aria-label="Título de la tarea"
            [(ngModel)]="sheetDraft"
          />
          <div class="pick">
            @for (q of quadrants; track q.id) {
              <button
                type="button"
                [attr.data-q]="q.id"
                [attr.aria-current]="
                  t.status !== 'inbox' && t.quadrant === q.id
                "
                (click)="place(t, q.id)"
              >
                <b>{{ q.name }}</b
                ><small>{{ q.sub }}</small>
              </button>
            }
          </div>
          <div class="sheet-row">
            @if (t.status !== 'inbox') {
              <button type="button" class="btn" (click)="complete(t)">
                Marcar hecha
              </button>
            }
            <button type="button" class="btn danger" (click)="remove(t)">
              {{ confirmDelete() ? '¿Seguro? Borrar' : 'Borrar' }}
            </button>
            <button type="submit" class="btn primary">Guardar y cerrar</button>
          </div>
        </form>
      }
    </dialog>
  `,
  styleUrl: './board.page.css',
})
export class BoardPage {
  private readonly api = inject(QuadrantApi);
  private readonly sheet =
    viewChild.required<ElementRef<HTMLDialogElement>>('sheet');
  private readonly captureInput =
    viewChild.required<ElementRef<HTMLInputElement>>('captureInput');

  protected readonly quadrants = QUADRANTS;
  protected readonly inbox = signal<TaskView[]>([]);
  protected readonly backlog = signal<TaskView[]>([]);
  protected readonly done = signal<TaskView[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly filter = signal<string | null>(null);
  protected readonly selected = signal<string | null>(null);
  protected readonly overZone = signal<string | null>(null);
  protected readonly editing = signal<TaskView | null>(null);
  protected readonly confirmDelete = signal(false);
  protected readonly pendingDone = signal<Set<string>>(new Set());
  protected readonly toast = signal<{ text: string; undo: boolean } | null>(
    null,
  );
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected draft = '';
  protected sheetDraft = '';

  private dragId: string | null = null;
  private undoTimer: ReturnType<typeof setTimeout> | null = null;
  private undoTask: TaskView | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly projectChips = computed(() => {
    const used = new Set(
      [...this.inbox(), ...this.backlog()]
        .map((t) => t.projectId)
        .filter(Boolean),
    );
    return this.projects()
      .filter((p) => used.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly loose = computed(() =>
    this.inbox().filter((t) => this.visible(t)),
  );

  constructor() {
    void this.reload();
  }

  protected byQuadrant(id: Quadrant) {
    return this.backlog().filter((t) => t.quadrant === id && this.visible(t));
  }

  protected projectName(task: TaskView) {
    return this.projects().find((p) => p.id === task.projectId)?.name ?? null;
  }

  private visible(task: TaskView) {
    const f = this.filter();
    return !f || task.projectId === f;
  }

  private async run<T>(work: () => Promise<T>): Promise<T | undefined> {
    this.error.set('');
    try {
      return await work();
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'No se ha podido guardar.',
      );
      return undefined;
    }
  }

  async reload() {
    await this.run(async () => {
      const [inbox, backlog, projects] = await Promise.all([
        this.api.invoke<{ tasks: TaskView[] }>('inbox.list'),
        this.api.invoke<{ tasks: TaskView[] }>('backlog.list'),
        this.api.invoke<{ projects: Project[] }>('project.list'),
      ]);
      this.inbox.set(this.api.unwrap(inbox).tasks);
      this.backlog.set(this.api.unwrap(backlog).tasks);
      this.projects.set(
        this.api.unwrap(projects).projects.filter((p) => !p.archived),
      );
    });
  }

  protected async loadDone(event: Event) {
    if (!(event.target as HTMLDetailsElement).open) return;
    await this.run(async () => {
      const res = await this.api.invoke<{ tasks: TaskView[] }>('backlog.list', {
        status: 'completed',
      });
      const tasks = this.api.unwrap(res).tasks;
      tasks.sort((a, b) =>
        (b.completedAt ?? '').localeCompare(a.completedAt ?? ''),
      );
      this.done.set(tasks.slice(0, 50));
    });
  }

  /** Busca el proyecto por nombre; si no existe lo crea en la categoría «General». */
  private async projectFor(tag: string | null): Promise<string | undefined> {
    if (!tag) return undefined;
    const found = this.projects().find((p) => norm(p.name) === norm(tag));
    if (found) return found.id;
    const cats = this.api.unwrap(
      await this.api.invoke<{ categories: Category[] }>('category.list'),
    ).categories;
    let category = cats.find((c) => !c.archived && norm(c.name) === 'general');
    if (!category) {
      category = this.api.unwrap(
        await this.api.invoke<{ category: Category }>('category.create', {
          name: 'General',
        }),
      ).category;
    }
    const project = this.api.unwrap(
      await this.api.invoke<{ project: Project }>('project.create', {
        name: tag,
        categoryId: category.id,
      }),
    ).project;
    this.projects.update((list) => [...list, project]);
    return project.id;
  }

  private async addLines(lines: string[]) {
    const parsed = lines.map(parseLine).filter(([title]) => title);
    if (!parsed.length) return;
    this.busy.set(true);
    await this.run(async () => {
      const items = [];
      for (const [title, tag] of parsed) {
        const projectId = await this.projectFor(tag);
        items.push({
          title,
          channel: 'ui',
          ...(projectId ? { projectId } : {}),
        });
      }
      this.api.unwrap(
        await this.api.invoke('inbox.capture_many', {
          request_id: crypto.randomUUID(),
          items,
        }),
      );
      this.draft = '';
    });
    this.busy.set(false);
    await this.reload();
    queueMicrotask(() => this.captureInput().nativeElement.focus());
  }

  protected capture(event: Event) {
    event.preventDefault();
    void this.addLines(this.draft.split(/\n+/));
  }

  protected paste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text.includes('\n')) return;
    event.preventDefault();
    void this.addLines(text.split(/\n+/));
  }

  protected pick(id: string) {
    this.selected.set(this.selected() === id ? null : id);
  }

  protected dropSelected(q: Quadrant) {
    const id = this.selected();
    const task = id && this.find(id);
    if (task) void this.place(task, q);
  }

  private find(id: string) {
    return [...this.inbox(), ...this.backlog()].find((t) => t.id === id);
  }

  async place(task: TaskView, q: Quadrant) {
    const target = QUADRANTS.find((x) => x.id === q)!;
    this.selected.set(null);
    if (this.editing()) this.sheet().nativeElement.close();
    if (task.status !== 'inbox' && task.quadrant === q) return;
    await this.run(async () => {
      if (task.status === 'inbox') {
        this.api.unwrap(
          await this.api.invoke('task.process', {
            request_id: crypto.randomUUID(),
            taskId: task.id,
            urgent: target.urgent,
            important: target.important,
            workType: task.workType ?? 'short',
          }),
        );
      } else {
        this.api.unwrap(
          await this.api.invoke('task.update', {
            request_id: crypto.randomUUID(),
            taskId: task.id,
            urgent: target.urgent,
            important: target.important,
          }),
        );
      }
    });
    await this.reload();
  }

  protected complete(task: TaskView) {
    if (this.editing()) this.sheet().nativeElement.close();
    this.flushUndo();
    this.pendingDone.update((s) => new Set(s).add(task.id));
    this.undoTask = task;
    this.showToast(`Hecha: ${task.title}`, true);
    this.undoTimer = setTimeout(() => void this.flushUndo(), UNDO_MS);
  }

  protected undo() {
    if (this.undoTimer) clearTimeout(this.undoTimer);
    const task = this.undoTask;
    this.undoTimer = null;
    this.undoTask = null;
    if (task) {
      this.pendingDone.update((s) => {
        const next = new Set(s);
        next.delete(task.id);
        return next;
      });
    }
    this.toast.set(null);
  }

  private async flushUndo() {
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = null;
    const task = this.undoTask;
    this.undoTask = null;
    if (!task) return;
    await this.run(async () =>
      this.api.unwrap(
        await this.api.invoke('task.complete', {
          request_id: crypto.randomUUID(),
          taskId: task.id,
        }),
      ),
    );
    this.pendingDone.update((s) => {
      const next = new Set(s);
      next.delete(task.id);
      return next;
    });
    if (this.toast()?.undo) this.toast.set(null);
    await this.reload();
    this.done.update((list) => [{ ...task, status: 'completed' }, ...list]);
  }

  private showToast(text: string, undo: boolean) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ text, undo });
    this.toastTimer = setTimeout(() => this.toast.set(null), UNDO_MS);
  }

  protected open(task: TaskView) {
    this.selected.set(null);
    this.confirmDelete.set(false);
    this.editing.set(task);
    const name = this.projectName(task);
    this.sheetDraft = task.title + (name ? ` #${name}` : '');
    this.sheet().nativeElement.showModal();
  }

  protected closeSheet() {
    const task = this.editing();
    this.editing.set(null);
    if (task) void this.commitTitle(task);
  }

  protected saveTitle(event: Event) {
    event.preventDefault();
    this.sheet().nativeElement.close();
  }

  private async commitTitle(task: TaskView) {
    const [title, tag] = parseLine(this.sheetDraft);
    const currentName = this.projectName(task);
    const sameTitle = !title || title === task.title;
    const sameProject =
      (tag ? norm(tag) : null) === (currentName ? norm(currentName) : null);
    if (sameTitle && sameProject) return;
    await this.run(async () => {
      const projectId = tag ? await this.projectFor(tag) : null;
      this.api.unwrap(
        await this.api.invoke('task.update', {
          request_id: crypto.randomUUID(),
          taskId: task.id,
          ...(sameTitle ? {} : { title }),
          ...(sameProject ? {} : { projectId }),
        }),
      );
    });
    await this.reload();
  }

  protected async remove(task: TaskView) {
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }
    this.editing.set(null);
    this.sheet().nativeElement.close();
    await this.run(async () => {
      const first = await this.api.invoke('task.archive', { taskId: task.id });
      if (first.status === 'needs_confirmation' && first.confirmation_token) {
        this.api.unwrap(
          await this.api.confirm(
            'task.archive',
            { taskId: task.id },
            first.confirmation_token,
          ),
        );
      } else {
        this.api.unwrap(first);
      }
    });
    this.showToast(`Borrada: ${task.title}`, false);
    await this.reload();
  }

  // Arrastrar y soltar
  protected dragStart(event: DragEvent, id: string) {
    this.dragId = id;
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }
  protected dragEnd() {
    this.dragId = null;
    this.overZone.set(null);
  }
  protected dragOver(event: DragEvent, zone: string) {
    if (!this.dragId) return;
    event.preventDefault();
    this.overZone.set(zone);
  }
  protected dragLeave(event: DragEvent, zone: string) {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node) && this.overZone() === zone)
      this.overZone.set(null);
  }
  protected drop(event: DragEvent, q: Quadrant) {
    event.preventDefault();
    const task = this.dragId && this.find(this.dragId);
    this.dragEnd();
    if (task) void this.place(task, q);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent) {
    const id = this.selected();
    if (!id || this.editing()) return;
    if ((event.target as HTMLElement).matches('input, textarea')) return;
    const q = QUADRANTS.find((x) => String(x.key) === event.key);
    const task = this.find(id);
    if (q && task) {
      event.preventDefault();
      void this.place(task, q.id);
    } else if (event.key === 'Escape') {
      this.selected.set(null);
    }
  }
}
