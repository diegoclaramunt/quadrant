import { Test, TestingModule } from '@nestjs/testing';
import { createQuadrantApp, QuadrantApp } from '@quadrant/application';
import { openStore } from '@quadrant/storage';
import { AppController } from './app.controller';
import { defaultIdGenerator } from '@quadrant/domain';
import type {
  HttpsQuadrantLocalSchemasWeekCurrentOutputJson as WeekResult,
  HttpsQuadrantLocalSchemasPlanProposeOutputJson as PlanResult,
} from '@quadrant/capabilities';

function result<T>(envelope: ReturnType<QuadrantApp['invoke']>): T {
  expect(envelope.status).toBe('ok');
  if (envelope.status !== 'ok') throw new Error(JSON.stringify(envelope));
  return envelope.result as T;
}

describe('AppController', () => {
  it('delega destino, reservas y aceptación sin alterar los resultados de application', () => {
    const store = openStore(':memory:');
    const app = createQuadrantApp(store, {
      clock: { now: () => new Date('2026-09-11T10:00:00Z') },
      ids: defaultIdGenerator(),
    });
    const http = new AppController(app);
    const preview = http.invoke('week.review', {
      targetWeekStart: '2026-09-14',
    });
    expect(preview.status).toBe('needs_confirmation');
    if (preview.status !== 'needs_confirmation')
      throw new Error('Falta confirmación');
    const opened = http.invoke('week.review', {
      targetWeekStart: '2026-09-14',
      confirmation_token: preview.confirmation_token,
    });
    expect(opened.status).toBe('ok');
    const week = result<WeekResult>(opened).week;
    const captured = http.invoke('inbox.capture_many', {
      items: [
        {
          title: 'Importante',
          channel: 'api',
          alreadyProcessed: true,
          important: true,
          urgent: false,
          workType: 'deep',
        },
      ],
    });
    const taskId = result<{ tasks: { id: string }[] }>(captured).tasks[0].id;
    const reservations = [{ taskId, slotId: week.slots[0].id }];
    const proposal = result<PlanResult>(
      http.invoke('plan.propose', { reservations }),
    ).proposal;
    const direct = result<PlanResult>(
      app.invoke('plan.propose', { reservations }),
    ).proposal;
    expect(proposal.assignments).toEqual(direct.assignments);
    expect(proposal.reservations).toEqual(reservations);
    expect(http.invoke('week.current', {})).toEqual(app.invoke('week.current'));
    const accept = http.invoke('plan.accept', { proposalId: proposal.id });
    if (accept.status !== 'needs_confirmation')
      throw new Error('Falta confirmación');
    expect(
      http.invoke('plan.accept', {
        proposalId: proposal.id,
        confirmation_token: accept.confirmation_token,
      }).status,
    ).toBe('ok');
    expect(store.repos.blocks.list()).toHaveLength(1);
    store.close();
  });
  let controller: AppController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: QuadrantApp,
          useValue: createQuadrantApp(openStore(':memory:')),
        },
      ],
    }).compile();
    controller = module.get(AppController);
  });

  it('expone salud y manifiesto', () => {
    expect(controller.health().name).toBe('quadrant');
    expect(controller.getManifest().capabilities.length).toBeGreaterThan(10);
  });

  it('invoca una capacidad pública', () => {
    const envelope = controller.invoke('inbox.capture_many', {
      items: [{ title: 'Desde HTTP', channel: 'api' }],
    });
    expect(envelope.status).toBe('ok');
  });
});
