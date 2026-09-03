import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Envelope<T = unknown> {
  status:
    | 'ok'
    | 'validation_error'
    | 'conflict'
    | 'needs_confirmation'
    | 'needs_clarification';
  request_id?: string | null;
  result?: T;
  error?: { message: string; questions?: string[] };
  confirmation_token?: string;
  summary?: string;
}

export interface TaskView {
  id: string;
  title: string;
  notes: string | null;
  originalText: string;
  channel: string;
  projectId: string | null;
  categoryId: string | null;
  effectiveCategoryId: string | null;
  status: string;
  urgent: boolean;
  important: boolean;
  quadrant: 'ui' | 'in' | 'un' | 'nn';
  workType: 'brief' | 'short' | 'deep' | 'project' | null;
  nominalMinutes: number | null;
  deadline: string | null;
  availableOn: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuadrantApi {
  private readonly http = inject(HttpClient);

  async invoke<T>(
    id: string,
    payload: Record<string, unknown> = {},
  ): Promise<Envelope<T>> {
    let envelope = await firstValueFrom(
      this.http.post<Envelope<T>>(`/api/capabilities/${id}`, payload),
    );
    if (
      envelope.status === 'needs_confirmation' &&
      envelope.confirmation_token
    ) {
      const accepted = window.confirm(
        envelope.summary ?? '¿Confirmas esta acción?',
      );
      if (!accepted) {
        return envelope;
      }
      envelope = await firstValueFrom(
        this.http.post<Envelope<T>>(`/api/capabilities/${id}`, {
          ...payload,
          confirmation_token: envelope.confirmation_token,
        }),
      );
    }
    return envelope;
  }

  unwrap<T>(envelope: Envelope<T>): T {
    if (envelope.status !== 'ok' || envelope.result === undefined) {
      throw new Error(
        envelope.error?.message ?? envelope.summary ?? envelope.status,
      );
    }
    return envelope.result;
  }
}
