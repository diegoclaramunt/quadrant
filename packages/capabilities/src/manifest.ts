import type { ConfirmationPolicy, SideEffect } from '@quadrant/domain';

export interface CapabilityDefinition {
  id: string;
  version: string;
  description: string;
  inputSchema: string;
  outputSchema: string;
  sideEffect: SideEffect;
  confirmation: ConfirmationPolicy;
  examples: string[];
}

export interface CapabilityManifest {
  name: string;
  version: string;
  description: string;
  capabilities: CapabilityDefinition[];
}

export { default as manifest } from '../manifest.json';
