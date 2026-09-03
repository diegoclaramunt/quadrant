import { manifest, validateCapabilityInput } from './index';

describe('capability contracts', () => {
  it('cubre las capacidades mínimas del manifiesto', () => {
    const ids = manifest.capabilities.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'inbox.capture_many',
        'task.process',
        'task.archive',
        'week.review',
        'plan.accept',
        'report.nominal_time',
      ]),
    );
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    const archive = manifest.capabilities.find(
      (item) => item.id === 'task.archive',
    );
    expect(archive?.confirmation).toBe('required');
  });

  it('valida ejemplos válidos y rechaza entradas inválidas', () => {
    const ok = validateCapabilityInput('inbox.capture_many', {
      items: [{ title: 'Hola', channel: 'ui' }],
    });
    expect(ok.ok).toBe(true);
    const invalid = validateCapabilityInput('inbox.capture_many', {
      items: [],
    });
    expect(invalid.ok).toBe(false);
  });
});
