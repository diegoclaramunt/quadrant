import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';
import type { OperationManifest } from '@five/voice-runtime/core';
import type { VoiceCaptureInput } from '@quadrant/capabilities';

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
  private readonly captured = new Subject<void>();
  readonly captures$ = this.captured.asObservable();

  voiceManifest() {
    return firstValueFrom(
      this.http.get<OperationManifest>('/api/voice/manifest'),
    );
  }

  async captureVoice(requestId: string, args: VoiceCaptureInput) {
    const result = await firstValueFrom(
      this.http.post<Envelope<{ tasks: TaskView[] }>>('/api/voice/capture', {
        requestId,
        arguments: args,
      }),
    );
    if (result.status === 'ok') this.captured.next();
    return result;
  }

  async invoke<T>(
    id: string,
    payload: Record<string, unknown> = {},
  ): Promise<Envelope<T>> {
    const result = await firstValueFrom(
      this.http.post<Envelope<T>>(`/api/capabilities/${id}`, payload),
    );
    if (id === 'inbox.capture_many' && result.status === 'ok')
      this.captured.next();
    return result;
  }

  async confirm<T>(
    id: string,
    payload: Record<string, unknown>,
    token: string,
  ) {
    return firstValueFrom(
      this.http.post<Envelope<T>>(`/api/capabilities/${id}`, {
        ...payload,
        confirmation_token: token,
      }),
    );
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
