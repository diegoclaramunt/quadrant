import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuadrantApi } from './quadrant-api';

@Component({
  selector: 'app-capture-panel',
  imports: [FormsModule],
  template: `
    <button
      type="button"
      class="capture-trigger"
      aria-label="Capturar"
      (click)="open()"
    >
      Capturar
    </button>
    <dialog
      #captureDialog
      class="dialog stack"
      aria-labelledby="capture-title"
      (cancel)="cancel($event)"
    >
      <h2 id="capture-title">Capturar en bandeja</h2>
      <p class="muted">Una línea por idea. La clasificación se hace después.</p>
      <form class="stack" (submit)="capture($event)">
        <label
          >Texto
          <textarea
            #text
            rows="5"
            name="batch"
            autofocus
            [value]="draft()"
            (input)="draft.set(text.value)"
            [disabled]="busy()"
          ></textarea>
        </label>
        @if (message()) {
          <p role="status">{{ message() }}</p>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <div class="row dialog-actions">
          <button type="submit" [disabled]="busy() || !draft().trim()">
            {{ busy() ? 'Guardando…' : 'Guardar en bandeja' }}
          </button>
          <button type="button" class="secondary" (click)="close()">
            Cerrar
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class CapturePanel {
  private readonly api = inject(QuadrantApi);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('captureDialog');
  protected readonly draft = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');

  open() {
    this.dialog().nativeElement.showModal();
    this.error.set('');
    this.message.set('');
  }
  close() {
    if (!this.busy()) this.dialog().nativeElement.close();
  }
  cancel(event: Event) {
    if (this.busy()) event.preventDefault();
  }
  async capture(event: Event) {
    event.preventDefault();
    const items = this.draft()
      .split('\n')
      .map((title) => title.trim())
      .filter(Boolean);
    if (!items.length || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await this.api.invoke<{ tasks: unknown[] }>(
        'inbox.capture_many',
        {
          items: items.map((title) => ({
            title,
            originalText: title,
            channel: 'ui',
          })),
        },
      );
      if (response.status !== 'ok') {
        this.error.set(
          response.error?.message ?? 'No se pudo capturar. Puedes reintentar.',
        );
        return;
      }
      this.draft.set('');
      this.message.set(
        `${items.length} ${items.length === 1 ? 'elemento guardado' : 'elementos guardados'} en la bandeja.`,
      );
    } catch {
      this.error.set('No se pudo conectar. El texto se ha conservado.');
    } finally {
      this.busy.set(false);
    }
  }
}
