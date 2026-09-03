export class DomainError extends Error {
  constructor(
    public readonly code: 'validation' | 'conflict' | 'not_found' | 'hidden',
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export function validationError(message: string): DomainError {
  return new DomainError('validation', message);
}

export function conflictError(message: string): DomainError {
  return new DomainError('conflict', message);
}

export function notFoundError(message: string): DomainError {
  return new DomainError('not_found', message);
}

export function hiddenError(message: string): DomainError {
  return new DomainError('hidden', message);
}
