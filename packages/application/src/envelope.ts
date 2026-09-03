export type Envelope<T = unknown> =
  | { status: 'ok'; request_id: string | null; result: T }
  | {
      status: 'validation_error';
      request_id: string | null;
      error: { message: string; code?: string; details?: unknown };
    }
  | {
      status: 'conflict';
      request_id: string | null;
      error: { message: string; code: string };
    }
  | {
      status: 'needs_confirmation';
      request_id: string | null;
      confirmation_token: string;
      summary: string;
      expires_at: string;
    }
  | {
      status: 'needs_clarification';
      request_id: string | null;
      error: { message: string; questions: string[] };
    };

export function ok<T>(result: T, requestId: string | null = null): Envelope<T> {
  return { status: 'ok', request_id: requestId, result };
}

export function validation(
  message: string,
  requestId: string | null = null,
  details?: unknown,
): Envelope {
  return {
    status: 'validation_error',
    request_id: requestId,
    error: { message, details },
  };
}

export function conflict(
  message: string,
  requestId: string | null = null,
  code = 'conflict',
): Envelope {
  return {
    status: 'conflict',
    request_id: requestId,
    error: { message, code },
  };
}

export function clarification(
  message: string,
  questions: string[],
  requestId: string | null = null,
): Envelope {
  return {
    status: 'needs_clarification',
    request_id: requestId,
    error: { message, questions },
  };
}
