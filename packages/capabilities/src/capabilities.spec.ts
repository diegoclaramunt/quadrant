import { manifest, validateCapabilityInput } from './index';

describe('capability contracts', () => {
  it('mantiene entradas anteriores y valida fechas, reservas y detalles opcionales', () => {
    expect(validateCapabilityInput('week.review', {}).ok).toBe(true);
    expect(validateCapabilityInput('plan.propose', {}).ok).toBe(true);
    expect(
      validateCapabilityInput('week.review', { targetWeekStart: '2026-09-14' })
        .ok,
    ).toBe(true);
    expect(
      validateCapabilityInput('week.review', { targetWeekStart: '2026-02-30' })
        .ok,
    ).toBe(false);
    expect(
      validateCapabilityInput('plan.propose', {
        reservations: [{ taskId: 't', slotId: 's' }],
      }).ok,
    ).toBe(true);
    expect(
      validateCapabilityInput('plan.propose', {
        reservations: [{ taskId: 't' }],
      }).ok,
    ).toBe(false);
    expect(
      validateCapabilityInput('task.process', {
        taskId: 't',
        urgent: false,
        important: true,
        workType: 'short',
        deadline: null,
        projectId: null,
        categoryId: null,
        notes: '',
      }).ok,
    ).toBe(true);
  });
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
