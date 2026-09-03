import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { schemaDocuments } from './generated/schema-documents';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true,
});
addFormats(ajv);

const common = schemaDocuments['common.json'] as object;
ajv.addSchema(common, 'common.json');
for (const [name, schema] of Object.entries(schemaDocuments)) {
  if (name !== 'common.json') {
    const document = schema as { $id?: string };
    if (document.$id) {
      ajv.addSchema(schema as object);
    }
  }
}

const validators = new Map<string, ValidateFunction>();

export function inputSchemaName(capabilityId: string): string {
  return `${capabilityId}.input.json`;
}

export function validateCapabilityInput(
  capabilityId: string,
  payload: unknown,
): { ok: true } | { ok: false; errors: ErrorObject[] } {
  const key = `https://quadrant.local/schemas/${capabilityId}.input.json`;
  let validate = validators.get(key);
  if (!validate) {
    const schema = schemaDocuments[`${capabilityId}.input.json`];
    if (!schema) {
      return {
        ok: false,
        errors: [
          {
            keyword: 'schema',
            instancePath: '',
            schemaPath: '',
            params: {},
            message: `No existe esquema para ${capabilityId}`,
          },
        ],
      };
    }
    validate = ajv.compile(schema as object);
    validators.set(key, validate);
  }
  const ok = validate(payload);
  if (ok) {
    return { ok: true };
  }
  return { ok: false, errors: validate.errors ?? [] };
}

export function listSchemaIds(): string[] {
  return Object.keys(schemaDocuments);
}
