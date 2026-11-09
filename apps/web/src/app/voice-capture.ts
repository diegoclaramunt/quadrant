import { Component, inject, OnDestroy } from '@angular/core';
import { VoiceCaptureService } from './voice-capture.service';

@Component({
  selector: 'app-voice-capture',
  template: `
    <section class="panel stack" aria-labelledby="voice-title">
      <h3 id="voice-title">Dilo y déjalo en la bandeja</h3>
      <p class="muted">
        Cuenta tus tareas con tus palabras. Se resumirán y guardarán
        directamente; podrás clasificarlas después. El audio se envía a OpenAI
        mientras hablas.
      </p>
      <div class="row">
        <button
          type="button"
          class="secondary"
          (click)="toggle()"
          [disabled]="
            voice.state() !== 'connected' &&
            voice.state() !== 'connecting' &&
            (voice.saving() || voice.canRetry())
          "
          [attr.aria-pressed]="voice.state() === 'connected'"
        >
          {{
            voice.state() === 'connecting'
              ? 'Cancelar conexión'
              : voice.state() === 'connected'
                ? 'Terminar'
                : 'Hablar'
          }}
        </button>
        <span role="status">{{
          voice.saving()
            ? 'Guardando tareas…'
            : voice.state() === 'connecting'
              ? 'Conectando…'
              : voice.state() === 'connected'
                ? voice.activity() === 'thinking'
                  ? 'Preparando tareas…'
                  : voice.activity() === 'speaking'
                    ? 'Respondiendo'
                    : 'Te escucho'
                : 'Micrófono apagado'
        }}</span>
      </div>
      @if (voice.error()) {
        <p class="error" role="alert">{{ voice.error() }}</p>
      }
      @if (voice.canRetry()) {
        <button
          type="button"
          (click)="voice.retry()"
          [disabled]="voice.saving()"
        >
          Reintentar guardado
        </button>
      }
      @if (voice.transcript()) {
        <p class="muted">{{ voice.transcript() }}</p>
      }
      @if (voice.tasks().length) {
        <p role="status">
          {{ voice.tasks().length }} tareas añadidas a la bandeja.
        </p>
        <ul>
          @for (task of voice.tasks(); track task.id) {
            <li>{{ task.title }}</li>
          }
        </ul>
      }
    </section>
  `,
})
export class VoiceCapture implements OnDestroy {
  readonly voice = inject(VoiceCaptureService);
  toggle() {
    if (['connecting', 'connected'].includes(this.voice.state()))
      this.voice.stop();
    else void this.voice.start();
  }
  ngOnDestroy() {
    this.voice.stop();
  }
}
