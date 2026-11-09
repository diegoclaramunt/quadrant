import type { QuadrantApp } from '@quadrant/application';
import { validateVoiceCapture, voiceManifest } from '@quadrant/capabilities';

/** Bind transport metadata here; all writes still belong to QuadrantApp. */
export function captureVoice(app: QuadrantApp, body: unknown) {
  const rejected = () => ({
    status: 'validation_error' as const,
    error: { message: 'Lote de voz o identificador inválido.' },
  });
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return rejected();
  const request = body as Record<string, unknown>;
  if (
    Object.keys(request).some(
      (key) => !['requestId', 'arguments'].includes(key),
    ) ||
    typeof request['requestId'] !== 'string' ||
    !request['requestId'].trim() ||
    request['requestId'].length > 200 ||
    !validateVoiceCapture(request['arguments'])
  )
    return rejected();
  return app.invoke(voiceManifest.operations[0].name, {
    request_id: `voice:${request['requestId']}`,
    items: request['arguments'].items.map((item) => ({
      ...item,
      channel: 'voice',
    })),
  });
}
