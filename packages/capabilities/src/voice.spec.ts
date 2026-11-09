import {
  voiceCaptureSchema,
  voiceManifest,
  validateVoiceCapture,
} from './voice';

describe('Contrato de captura por voz', () => {
  it('deriva una única operación con referencias resueltas', () => {
    expect(voiceManifest.operations.map((operation) => operation.name)).toEqual(
      ['inbox.capture_many'],
    );
    expect(JSON.stringify(voiceCaptureSchema)).not.toContain('$ref');
    expect(
      validateVoiceCapture({
        items: [
          {
            title: 'Llamar a Ana',
            notes: 'Por el presupuesto',
            originalText: 'Tengo que llamar a Ana por el presupuesto',
          },
        ],
      }),
    ).toBe(true);
  });

  it.each([
    'channel',
    'alreadyProcessed',
    'urgent',
    'important',
    'deadline',
    'projectId',
    'workType',
  ])('impide que el modelo decida %s', (field) => {
    expect(
      validateVoiceCapture({ items: [{ title: 'Una tarea', [field]: true }] }),
    ).toBe(false);
  });

  it('rechaza identificadores de transporte y lotes vacíos', () => {
    expect(
      validateVoiceCapture({
        request_id: 'inventado',
        items: [{ title: 'Una tarea' }],
      }),
    ).toBe(false);
    expect(validateVoiceCapture({ items: [] })).toBe(false);
    expect(validateVoiceCapture({ items: [{ title: 4 }] })).toBe(false);
  });
});
