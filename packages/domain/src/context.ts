import type { Clock } from './clock';
import { systemClock } from './clock';

export type IdGenerator = () => string;

export function defaultIdGenerator(): IdGenerator {
  return () => crypto.randomUUID();
}

export interface DomainContext {
  clock: Clock;
  ids: IdGenerator;
}

export function defaultDomainContext(): DomainContext {
  return {
    clock: systemClock(),
    ids: defaultIdGenerator(),
  };
}
