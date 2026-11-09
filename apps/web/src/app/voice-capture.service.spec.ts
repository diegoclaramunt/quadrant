import { TestBed } from '@angular/core/testing';
import { createToolSurface } from '@five/voice-runtime/core';
import type {
  BrowserRealtimeOptions,
  BrowserRealtimeSession,
} from '@five/voice-runtime/browser';
import { VoiceCaptureService, VOICE_MODULES } from './voice-capture.service';
import { QuadrantApi } from './quadrant-api';
import { VoiceCapture } from './voice-capture';

const manifest = {
  contract: 'application-operations' as const,
  version: 1 as const,
  operations: [
    {
      name: 'inbox.capture_many',
      kind: 'action' as const,
      access: 'write' as const,
      description: 'Captura',
      inputSchema: { type: 'object', properties: { items: { type: 'array' } } },
    },
  ],
};
const tasks = [{ id: 'saved-1', title: 'Llamar a Ana' }];
const call = {
  callId: 'call-1',
  name: 'inbox_capture_many',
  arguments: {
    items: [{ title: 'Llamar a Ana', originalText: 'Tengo que llamar a Ana' }],
  },
  sessionId: 's1',
};

function setup() {
  const api = {
    voiceManifest: vi.fn().mockResolvedValue(manifest),
    captureVoice: vi
      .fn()
      .mockResolvedValue({ status: 'ok', result: { tasks } }),
  };
  let options!: BrowserRealtimeOptions;
  const runtime = {
    on: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
  };
  const createSession = vi.fn((input: BrowserRealtimeOptions) => {
    options = input;
    return runtime as unknown as BrowserRealtimeSession;
  });
  const loader = vi
    .fn()
    .mockResolvedValue({
      createSession,
      createSurface: (input: typeof manifest) =>
        createToolSurface(input, { qualifyNames: false }),
    });
  TestBed.configureTestingModule({
    imports: [VoiceCapture],
    providers: [
      VoiceCaptureService,
      { provide: QuadrantApi, useValue: api },
      { provide: VOICE_MODULES, useValue: loader },
    ],
  });
  const service = TestBed.inject(VoiceCaptureService);
  return {
    service,
    api,
    runtime,
    loader,
    createSession,
    execute: () => options.executeTool(call),
  };
}

describe('Captura de voz', () => {
  it('presenta el resultado guardado y libera sesión al destruir la UI', async () => {
    const app = setup();
    const fixture = TestBed.createComponent(VoiceCapture);
    fixture.detectChanges();
    expect(app.loader).not.toHaveBeenCalled();
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('button')?.click();
    await fixture.whenStable();
    await app.execute();
    fixture.detectChanges();
    expect(host.querySelector('li')?.textContent).toContain('Llamar a Ana');
    fixture.destroy();
    expect(app.runtime.dispose).toHaveBeenCalled();
  });

  it('carga el runtime solo al iniciar y muestra tareas del servidor', async () => {
    const app = setup();
    expect(app.loader).not.toHaveBeenCalled();
    await app.service.start();
    await app.execute();
    expect(app.runtime.start).toHaveBeenCalledOnce();
    expect(app.api.captureVoice).toHaveBeenCalledWith(
      expect.any(String),
      call.arguments,
    );
    expect(app.service.tasks()).toEqual(tasks);
    app.service.stop();
    expect(app.runtime.dispose).toHaveBeenCalledOnce();
  });

  it('conserva identidad y argumentos tras respuesta incierta y bloquea otro lote', async () => {
    const app = setup();
    app.api.captureVoice.mockRejectedValueOnce(new Error('sin respuesta'));
    await app.service.start();
    expect(await app.execute()).toMatchObject({ status: 'pending_retry' });
    expect(app.service.tasks()).toEqual([]);
    expect(app.service.canRetry()).toBe(true);
    const originalCall = app.api.captureVoice.mock.calls[0];
    await app.execute();
    expect(app.api.captureVoice).toHaveBeenCalledTimes(1);
    app.service.stop();
    await app.service.retry();
    expect(app.api.captureVoice.mock.calls[1]).toEqual(originalCall);
    expect(app.service.canRetry()).toBe(false);
    expect(app.service.tasks()).toEqual(tasks);
  });

  it('no conecta si se cierra mientras carga el manifiesto', async () => {
    const app = setup();
    let resolve!: (value: typeof manifest) => void;
    app.api.voiceManifest.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const start = app.service.start();
    app.service.stop();
    resolve(manifest);
    await start;
    expect(app.createSession).not.toHaveBeenCalled();
  });

  it('no ejecuta callbacks de una sesión cerrada ni confirma un rechazo', async () => {
    const app = setup();
    app.api.captureVoice.mockResolvedValue({
      status: 'validation_error',
      error: { message: 'Falta texto' },
    });
    await app.service.start();
    await app.execute();
    expect(app.service.tasks()).toEqual([]);
    expect(app.service.error()).toBe('Falta texto');
    app.service.stop();
    await app.execute();
    expect(app.api.captureVoice).toHaveBeenCalledTimes(1);
  });
});
