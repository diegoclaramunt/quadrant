export type { CapabilityDefinition, CapabilityManifest } from './manifest';
export { manifest } from './manifest';
export { listSchemaIds, validateCapabilityInput } from './validate';
export { schemaDocuments } from './generated/schema-documents';
export type * from './generated/schema-types';
export {
  voiceManifest,
  voiceCaptureSchema,
  validateVoiceCapture,
} from './voice';
export type { VoiceCaptureInput, VoiceCaptureItem } from './voice';
