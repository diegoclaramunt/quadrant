export type Channel = 'ui' | 'api' | 'mcp' | 'skill' | 'voice';
export type WorkType = 'brief' | 'short' | 'deep' | 'project';
export type SlotKind = 'deep' | 'project';
export type TaskStatus =
  | 'inbox'
  | 'backlog'
  | 'snoozed'
  | 'completed'
  | 'archived';
export type BlockStatus = 'planned' | 'executed' | 'cancelled' | 'missed';
export type WeekStatus = 'open' | 'closed';
export type Quadrant = 'ui' | 'in' | 'un' | 'nn';
export type SideEffect = 'read' | 'write' | 'destructive';
export type ConfirmationPolicy = 'none' | 'required';
export type EnvelopeStatus =
  | 'ok'
  | 'validation_error'
  | 'conflict'
  | 'needs_confirmation'
  | 'needs_clarification';

export interface Category {
  id: string;
  name: string;
  archivedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archivedAt: string | null;
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  originalText: string;
  channel: Channel;
  projectId: string | null;
  categoryId: string | null;
  status: TaskStatus;
  snoozeOrigin: 'inbox' | 'backlog' | null;
  previousStatus: 'inbox' | 'backlog' | null;
  urgent: boolean;
  important: boolean;
  workType: WorkType | null;
  nominalMinutes: number | null;
  deadline: string | null;
  availableOn: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
}

export interface WeekTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  archivedAt: string | null;
}

export interface TemplateSlot {
  id: string;
  templateId: string;
  weekday: number;
  order: number;
  kind: SlotKind;
  durationMinutes: number;
  startTime: string | null;
}

export interface WeekPlan {
  id: string;
  weekStart: string;
  templateId: string;
  status: WeekStatus;
  closedAt: string | null;
}

export interface WeekSlot {
  id: string;
  weekPlanId: string;
  weekday: number;
  order: number;
  kind: SlotKind;
  durationMinutes: number;
  startTime: string | null;
}

export interface WorkBlock {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: BlockStatus;
  nominalMinutes: number;
  createdAt: string;
  executedAt: string | null;
  cancelledAt: string | null;
}

export interface Postponement {
  id: string;
  taskId: string;
  fromStatus: 'inbox' | 'backlog';
  resumeWeekStart: string;
  createdAt: string;
  resumedAt: string | null;
}

export interface PostponementReset {
  id: string;
  taskId: string;
  reason: 'process' | 'schedule' | 'complete' | 'archive';
  createdAt: string;
}

export interface PlanningProposal {
  id: string;
  weekPlanId: string;
  createdAt: string;
  acceptedAt: string | null;
  assignments: ProposalAssignment[];
  unmatched: UnmatchedTask[];
  emptySlots: string[];
}

export interface ProposalAssignment {
  taskId: string;
  slotId: string;
  nominalMinutes: number;
}

export interface UnmatchedTask {
  taskId: string;
  reason: UnmatchedReason;
}

export type UnmatchedReason =
  | 'no_compatible_slot'
  | 'slot_full'
  | 'already_planned'
  | 'not_available';

export interface CommandReceipt {
  requestId: string;
  payloadHash: string;
  capabilityId: string;
  responseJson: string;
  createdAt: string;
}

export interface ConfirmationToken {
  token: string;
  capabilityId: string;
  payloadHash: string;
  summary: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface AuditEvent {
  id: string;
  at: string;
  capabilityId: string | null;
  requestId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  payload: unknown;
}

export interface Settings {
  timezone: string;
}

export const BRIEF_MINUTES = 10;
export const SHORT_DEFAULT_MINUTES = 30;
export const DEEP_DEFAULT_MINUTES = 90;
export const DEEP_MIN_MINUTES = 60;
export const DEEP_MAX_MINUTES = 120;
export const PROJECT_MINUTES = 120;
export const POSTPONE_ARCHIVE_THRESHOLD = 4;
export const RECEIPT_RETENTION_DAYS = 30;
export const CONFIRMATION_TTL_MS = 5 * 60 * 1000;
export const SUGGESTED_CATEGORY_NAMES = [
  'Warpcom',
  'Five',
  'Proyectos vendibles',
  'Proyectos personales',
] as const;
export const DEFAULT_TEMPLATE_NAME = 'Semana laborable';
