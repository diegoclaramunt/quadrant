import { Test, TestingModule } from '@nestjs/testing';
import { createQuadrantApp, QuadrantApp } from '@quadrant/application';
import { openStore } from '@quadrant/storage';
import { AppController } from './app.controller';

describe('AppController', () => {
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
