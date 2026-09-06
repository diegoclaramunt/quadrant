import {
  createMcpApp,
  createMcpServer,
  capabilityFromTool,
  toolName,
} from './main';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createQuadrantApp } from '@quadrant/application';
import { openStore } from '@quadrant/storage';
import { defaultIdGenerator } from '@quadrant/domain';
import type {
  HttpsQuadrantLocalSchemasWeekCurrentOutputJson as WeekResult,
  HttpsQuadrantLocalSchemasPlanProposeOutputJson as PlanResult,
} from '@quadrant/capabilities';

describe('mcp adapter', () => {
  it('transporta reservas y revisión con los mismos resultados que application', async () => {
    const store = openStore(':memory:');
    const app = createQuadrantApp(store, {
      clock: { now: () => new Date('2026-09-11T10:00:00Z') },
      ids: defaultIdGenerator(),
    });
    const server = createMcpServer(app);
    const client = new Client({ name: 'test', version: '1.0.0' });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const call = async (id: string, body: Record<string, unknown> = {}) => {
      const result = await client.callTool({
        name: toolName(id),
        arguments: body,
      });
      return result.structuredContent as {
        status: string;
        confirmation_token?: string;
        result: unknown;
      };
    };
    try {
      const preview = await call('week.review', {
        targetWeekStart: '2026-09-14',
      });
      expect(preview.status).toBe('needs_confirmation');
      const opened = await call('week.review', {
        targetWeekStart: '2026-09-14',
        confirmation_token: preview.confirmation_token,
      });
      expect(opened.status).toBe('ok');
      const week = (opened.result as WeekResult).week;
      expect(week.weekStart).toBe('2026-09-14');
      const captured = await call('inbox.capture_many', {
        items: [
          {
            title: 'Importante',
            channel: 'mcp',
            alreadyProcessed: true,
            important: true,
            urgent: false,
            workType: 'deep',
          },
        ],
      });
      const taskId = (captured.result as { tasks: { id: string }[] }).tasks[0]
        .id;
      const reservations = [{ taskId, slotId: week.slots[0].id }];
      const proposed = await call('plan.propose', { reservations });
      expect(proposed.status).toBe('ok');
      const proposal = (proposed.result as PlanResult).proposal;
      const direct = app.invoke('plan.propose', { reservations });
      expect(direct.status).toBe('ok');
      if (direct.status === 'ok')
        expect(proposal.assignments).toEqual(
          (direct.result as PlanResult).proposal.assignments,
        );
      expect(proposal.reservations).toEqual(reservations);
      const current = app.invoke('week.current');
      if (current.status !== 'ok') throw new Error(JSON.stringify(current));
      expect((await call('week.current')).result).toEqual(current.result);
      const accept = await call('plan.accept', { proposalId: proposal.id });
      expect(
        (
          await call('plan.accept', {
            proposalId: proposal.id,
            confirmation_token: accept.confirmation_token,
          })
        ).status,
      ).toBe('ok');
      expect(store.repos.blocks.list()).toHaveLength(1);
    } finally {
      await client.close();
      await server.close();
      store.close();
    }
  });
  it('mapea herramientas a capacidades sin lógica de dominio', () => {
    expect(toolName('inbox.capture_many')).toBe('inbox_capture_many');
    expect(capabilityFromTool('task_archive')).toBe('task.archive');
    const app = createMcpApp(':memory:');
    const captured = app.invoke('inbox.capture_many', {
      items: [{ title: 'Desde MCP', channel: 'mcp' }],
    });
    expect(captured.status).toBe('ok');
  });
});
