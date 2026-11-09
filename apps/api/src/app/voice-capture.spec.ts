import { createQuadrantApp } from '@quadrant/application';
import { openStore } from '@quadrant/storage';
import { captureVoice } from './voice-capture';

describe('Captura de voz con application y SQLite reales', () => {
  it('guarda varias tareas, conserva detalles y recupera un lote sin duplicarlo', () => {
    const store = openStore(':memory:');
    try {
      const app = createQuadrantApp(store);
      const input = {
        requestId: 'lote-uno',
        arguments: {
          items: [
            {
              title: 'Llamar a Ana',
              notes: 'Preguntar por el presupuesto',
              originalText: 'Tengo que llamar a Ana por el presupuesto',
            },
            {
              title: 'Revisar la factura del taller',
              originalText: 'y revisar la factura del taller',
            },
          ],
        },
      };
      const result = captureVoice(app, input);
      expect(result.status).toBe('ok');
      expect(captureVoice(app, input)).toEqual(result);
      const tasks = store.repos.tasks.list();
      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toMatchObject({
        title: 'Llamar a Ana',
        notes: 'Preguntar por el presupuesto',
        status: 'inbox',
        channel: 'voice',
        originalText: input.arguments.items[0].originalText,
        urgent: false,
        important: false,
      });
      expect(
        captureVoice(app, {
          ...input,
          arguments: { items: [{ title: 'Cambiar lote' }] },
        }).status,
      ).toBe('conflict');
      expect(store.repos.tasks.list()).toHaveLength(2);
    } finally {
      store.close();
    }
  });

  it('rechaza clasificación y deshace todo el lote si una tarea no tiene texto', () => {
    const store = openStore(':memory:');
    try {
      const app = createQuadrantApp(store);
      expect(
        captureVoice(app, {
          requestId: 'r1',
          arguments: {
            items: [{ title: 'No procesar', alreadyProcessed: true }],
          },
        }).status,
      ).toBe('validation_error');
      expect(
        captureVoice(app, {
          requestId: 'r2',
          arguments: { items: [{ title: 'Válida' }, {}] },
        }).status,
      ).toBe('validation_error');
      expect(store.repos.tasks.list()).toHaveLength(0);
    } finally {
      store.close();
    }
  });
});
