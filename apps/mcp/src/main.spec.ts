import { createMcpApp, capabilityFromTool, toolName } from './main';

describe('mcp adapter', () => {
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
