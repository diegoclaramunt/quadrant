import Ajv from 'ajv/dist/2020';
import { manifest } from './manifest';
import { schemaDocuments } from './generated/schema-documents';
import type { HttpsQuadrantLocalSchemasInboxCaptureManyInputJson } from './generated/schema-types';

export type VoiceCaptureItem = Pick<
  HttpsQuadrantLocalSchemasInboxCaptureManyInputJson['items'][number],
  'title' | 'notes' | 'originalText'
>;
export interface VoiceCaptureInput {
  items: VoiceCaptureItem[];
}

type JsonSchema = Record<string, unknown>;
const documents = schemaDocuments as Record<string, JsonSchema>;

/** The provider receives self-contained schemas; the public JSON files remain authoritative. */
function inlineReferences(
  value: unknown,
  document: string,
  seen = new Set<string>(),
): unknown {
  if (Array.isArray(value))
    return value.map((item) => inlineReferences(item, document, seen));
  if (!value || typeof value !== 'object') return value;
  const node = value as JsonSchema;
  if (typeof node['$ref'] === 'string') {
    const [file, pointer = ''] = node['$ref'].split('#');
    const targetDocument = file || document;
    const identity = `${targetDocument}#${pointer}`;
    if (seen.has(identity)) throw new Error(`Referencia circular: ${identity}`);
    let target: unknown = documents[targetDocument];
    for (const segment of pointer.split('/').filter(Boolean)) {
      target = (target as JsonSchema)?.[
        segment.replace(/~1/g, '/').replace(/~0/g, '~')
      ];
    }
    if (!target) throw new Error(`Esquema no disponible: ${identity}`);
    return inlineReferences(
      target,
      targetDocument,
      new Set([...seen, identity]),
    );
  }
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => key !== '$schema' && key !== '$id')
      .map(([key, child]) => [key, inlineReferences(child, document, seen)]),
  );
}

const capability = manifest.capabilities.find(
  (entry) => entry.id === 'inbox.capture_many',
);
if (!capability) throw new Error('Capacidad inbox.capture_many no disponible');
const documentName = capability.inputSchema.split('/').at(-1);
if (!documentName) throw new Error('Esquema de captura no disponible');
const input = inlineReferences(
  documents[documentName],
  documentName,
) as JsonSchema;
const sourceItems = (input['properties'] as JsonSchema)['items'] as JsonSchema;
const sourceItem = sourceItems['items'] as JsonSchema;
const sourceFields = sourceItem['properties'] as JsonSchema;
const captureFields = ['title', 'notes', 'originalText'];
export const voiceCaptureSchema: JsonSchema = {
  ...input,
  properties: {
    items: {
      ...sourceItems,
      items: {
        ...sourceItem,
        properties: Object.fromEntries(
          captureFields.map((field) => [field, sourceFields[field]]),
        ),
        required: (sourceItem['required'] as string[]).filter((field) =>
          captureFields.includes(field),
        ),
      },
    },
  },
};

export const voiceManifest = {
  contract: 'application-operations' as const,
  version: 1 as const,
  operations: [
    {
      name: capability.id,
      kind: 'action' as const,
      description: `${capability.description}. Sintetiza un título por tarea y conserva detalles en notes y el fragmento original en originalText. Se guardan directamente en bandeja.`,
      access: 'write' as const,
      inputSchema: voiceCaptureSchema,
    },
  ],
};

const validate = new Ajv({ allErrors: true, strict: false }).compile(
  voiceCaptureSchema,
);
export function validateVoiceCapture(
  input: unknown,
): input is VoiceCaptureInput {
  return Boolean(validate(input));
}
