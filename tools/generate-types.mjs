import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFromFile } from 'json-schema-to-typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemasDir = join(root, 'packages/capabilities/schemas');
const outDir = join(root, 'packages/capabilities/src/generated');
mkdirSync(outDir, { recursive: true });

const files = readdirSync(schemasDir)
  .filter((file) => file.endsWith('.json'))
  .sort();

const chunks = [];
for (const file of files) {
  const ts = await compileFromFile(join(schemasDir, file), {
    cwd: schemasDir,
    bannerComment: '',
    declareExternallyReferenced: true,
    unreachableDefinitions: true,
  });
  chunks.push(`// ${file}\n${ts}`);
}

writeFileSync(
  join(outDir, 'schema-types.ts'),
  `/* eslint-disable */\n/** Generated from JSON Schema. Do not edit. */\n${chunks.join('\n')}`,
);
console.log(`Generated types from ${files.length} schemas`);
