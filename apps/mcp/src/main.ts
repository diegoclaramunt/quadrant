import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { join } from 'node:path';
import { createQuadrantApp } from '@quadrant/application';
import { manifest, schemaDocuments } from '@quadrant/capabilities';
import { openStore } from '@quadrant/storage';

export function toolName(capabilityId: string): string {
  return capabilityId.replaceAll('.', '_');
}

export function capabilityFromTool(name: string): string | undefined {
  return manifest.capabilities.find((item) => toolName(item.id) === name)?.id;
}

export function createMcpApp(filename?: string) {
  return createQuadrantApp(
    openStore(
      filename ??
        process.env.QUADRANT_DB ??
        join(process.cwd(), '.data', 'quadrant.sqlite'),
    ),
  );
}

export function createMcpServer(app = createMcpApp()) {
  const server = new Server(
    { name: 'quadrant', version: manifest.version },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: manifest.capabilities.map((capability) => ({
      name: toolName(capability.id),
      description: `${capability.description}. Ejemplos: ${capability.examples.join('; ')}`,
      inputSchema: (schemaDocuments[`${capability.id}.input.json`] ?? {
        type: 'object',
      }) as Record<string, unknown>,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const capabilityId = capabilityFromTool(request.params.name);
    if (!capabilityId) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Herramienta desconocida: ${request.params.name}`,
          },
        ],
      };
    }
    const envelope = app.invoke(capabilityId, request.params.arguments ?? {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(envelope),
        },
      ],
      structuredContent: envelope as Record<string, unknown>,
    };
  });

  return server;
}

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
