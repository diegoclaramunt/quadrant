import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import type {
  BrowserRealtimeOptions,
  BrowserRealtimeSession,
} from '@five/voice-runtime/browser';
import type { OperationManifest } from '@five/voice-runtime/core';
import type { VoiceCaptureInput } from '@quadrant/capabilities';
import { QuadrantApi, type TaskView } from './quadrant-api';

export const VOICE_MODULES = new InjectionToken('VOICE_MODULES', {
  providedIn: 'root',
  factory: () => async () => {
    const [browser, core] = await Promise.all([
      import('@five/voice-runtime/browser'),
      import('@five/voice-runtime/core'),
    ]);
    return {
      createSession: (options: BrowserRealtimeOptions) =>
        new browser.BrowserRealtimeSession(options),
      createSurface: (manifest: OperationManifest) =>
        core.createToolSurface(manifest, { qualifyNames: false }),
    };
  },
});

/** UI state and HTTP routing only. Audio and provider protocol belong to the installed runtime. */
@Injectable({ providedIn: 'root' })
export class VoiceCaptureService {
  private readonly api = inject(QuadrantApi);
  private readonly modules = inject(VOICE_MODULES);
  private runtime: BrowserRealtimeSession | null = null;
  private generation = 0;
  private pending: { requestId: string; arguments: VoiceCaptureInput } | null =
    null;
  readonly state = signal('idle');
  readonly activity = signal('listening');
  readonly error = signal('');
  readonly saving = signal(false);
  readonly canRetry = signal(false);
  readonly tasks = signal<TaskView[]>([]);
  readonly transcript = signal('');

  async start() {
    if (
      ['connecting', 'connected', 'stopping'].includes(this.state()) ||
      this.pending
    )
      return;
    const generation = ++this.generation;
    this.runtime?.dispose();
    this.runtime = null;
    this.error.set('');
    this.state.set('connecting');
    try {
      const [modules, manifest] = await Promise.all([
        this.modules(),
        this.api.voiceManifest(),
      ]);
      if (generation !== this.generation) return;
      const surface = modules.createSurface(manifest);
      const runtime = modules.createSession({
        bootstrap: {
          mode: 'sdp',
          endpoint: '/api/voice/call',
          tools: surface.tools,
        },
        logger: {
          info() {
            /* No persistent or console conversation log. */
          },
          warn() {
            /* Errors surface in the UI. */
          },
        },
        executeTool: async (call) => {
          if (generation !== this.generation) return { status: 'cancelled' };
          if (this.pending)
            return {
              status: 'pending_retry',
              message:
                'Resuelve el lote pendiente con Reintentar antes de capturar más tareas.',
            };
          try {
            const resolved = surface.resolve(call.name, call.arguments);
            if (resolved.operation.name !== 'inbox.capture_many')
              return {
                status: 'validation_error',
                error: { message: 'Solo se permite capturar tareas.' },
              };
            this.pending = {
              requestId: crypto.randomUUID(),
              arguments: structuredClone(
                resolved.input,
              ) as unknown as VoiceCaptureInput,
            };
            return await this.sendPending();
          } catch {
            return {
              status: 'validation_error',
              error: {
                message: 'Los argumentos no corresponden a una captura válida.',
              },
            };
          }
        },
      });
      this.runtime = runtime;
      runtime.on('state', ({ state, message }) => {
        if (generation !== this.generation) return;
        this.state.set(state);
        if (state === 'error')
          this.error.set(message || 'No se pudo conectar la voz.');
      });
      runtime.on('activity', ({ activity }) => {
        if (generation === this.generation) this.activity.set(activity);
      });
      runtime.on('transcript.user', ({ text }) => {
        if (generation === this.generation) this.transcript.set(text);
      });
      runtime.on('error', ({ message }) => {
        if (generation === this.generation) this.error.set(message);
      });
      await runtime.start();
    } catch {
      if (generation === this.generation) {
        this.state.set('error');
        this.error.set(
          'No se pudo preparar la captura de voz. Puedes seguir escribiendo.',
        );
      }
    }
  }

  stop() {
    this.generation++;
    this.runtime?.dispose();
    this.runtime = null;
    this.state.set('idle');
    this.transcript.set('');
  }

  async retry() {
    if (this.pending && !this.saving()) await this.sendPending();
  }

  private async sendPending() {
    const pending = this.pending;
    if (!pending) return { status: 'cancelled' };
    this.saving.set(true);
    this.canRetry.set(false);
    this.error.set('');
    try {
      const response = await this.api.captureVoice(
        pending.requestId,
        pending.arguments,
      );
      if (
        response.status === 'ok' &&
        response.result &&
        Array.isArray(response.result.tasks)
      ) {
        const savedTasks = response.result.tasks;
        this.tasks.update((current) => [
          ...new Map(
            [...current, ...savedTasks].map((task) => [task.id, task]),
          ).values(),
        ]);
        this.pending = null;
      } else if (
        response.status === 'validation_error' ||
        response.status === 'conflict' ||
        response.status === 'needs_clarification'
      ) {
        this.pending = null;
        this.error.set(
          response.error?.message ||
            'No se ha guardado el lote. Revisa la captura.',
        );
      } else {
        throw new Error('Respuesta incierta');
      }
      return response;
    } catch {
      this.canRetry.set(true);
      this.error.set(
        'No se pudo confirmar el guardado. Reintenta este mismo lote para evitar duplicados.',
      );
      return {
        status: 'pending_retry',
        message:
          'El lote se conserva. Usa Reintentar en pantalla; no envíes otra captura del mismo lote.',
      };
    } finally {
      this.saving.set(false);
    }
  }
}
