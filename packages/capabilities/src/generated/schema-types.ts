/* eslint-disable */
/** Generated from JSON Schema. Do not edit. */
// backlog.list.input.json
export interface HttpsQuadrantLocalSchemasBacklogListInputJson {
  categoryId?: string;
  projectId?: string;
}

// backlog.list.output.json
export interface HttpsQuadrantLocalSchemasBacklogListOutputJson {
  tasks: Task[];
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// block.cancel.input.json
export interface HttpsQuadrantLocalSchemasBlockCancelInputJson {
  request_id?: string;
  confirmation_token?: string;
  blockId: string;
}

// block.cancel.output.json
export interface HttpsQuadrantLocalSchemasBlockCancelOutputJson {
  block: Block;
}
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: "planned" | "executed" | "cancelled" | "missed";
  nominalMinutes: number;
}

// block.execute.input.json
export interface HttpsQuadrantLocalSchemasBlockExecuteInputJson {
  request_id?: string;
  confirmation_token?: string;
  blockId: string;
}

// block.execute.output.json
export interface HttpsQuadrantLocalSchemasBlockExecuteOutputJson {
  block: Block;
}
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: "planned" | "executed" | "cancelled" | "missed";
  nominalMinutes: number;
}

// block.schedule.input.json
export interface HttpsQuadrantLocalSchemasBlockScheduleInputJson {
  request_id?: string;
  confirmation_token?: string;
  taskId?: string;
  title?: string;
  slotId?: string;
  date?: string;
  slotKind?: "deep" | "project";
  weekPlanId?: string;
}

// block.schedule.output.json
export interface HttpsQuadrantLocalSchemasBlockScheduleOutputJson {
  block: Block;
}
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: "planned" | "executed" | "cancelled" | "missed";
  nominalMinutes: number;
}

// category.archive.input.json
export interface HttpsQuadrantLocalSchemasCategoryArchiveInputJson {
  request_id?: string;
  confirmation_token?: string;
  categoryId: string;
}

// category.archive.output.json
export interface HttpsQuadrantLocalSchemasCategoryArchiveOutputJson {
  category: Category;
}
export interface Category {
  id: string;
  name: string;
  archived: boolean;
}

// category.create.input.json
export interface HttpsQuadrantLocalSchemasCategoryCreateInputJson {
  request_id?: string;
  confirmation_token?: string;
  name: string;
}

// category.create.output.json
export interface HttpsQuadrantLocalSchemasCategoryCreateOutputJson {
  category: Category;
}
export interface Category {
  id: string;
  name: string;
  archived: boolean;
}

// category.list.input.json
export interface HttpsQuadrantLocalSchemasCategoryListInputJson {
  includeArchived?: boolean;
}

// category.list.output.json
export interface HttpsQuadrantLocalSchemasCategoryListOutputJson {
  categories: Category[];
}
export interface Category {
  id: string;
  name: string;
  archived: boolean;
}

// category.rename.input.json
export interface HttpsQuadrantLocalSchemasCategoryRenameInputJson {
  request_id?: string;
  confirmation_token?: string;
  categoryId: string;
  name: string;
}

// category.rename.output.json
export interface HttpsQuadrantLocalSchemasCategoryRenameOutputJson {
  category: Category;
}
export interface Category {
  id: string;
  name: string;
  archived: boolean;
}

// category.unarchive.input.json
export interface HttpsQuadrantLocalSchemasCategoryUnarchiveInputJson {
  request_id?: string;
  confirmation_token?: string;
  categoryId: string;
}

// category.unarchive.output.json
export interface HttpsQuadrantLocalSchemasCategoryUnarchiveOutputJson {
  category: Category;
}
export interface Category {
  id: string;
  name: string;
  archived: boolean;
}

// common.json
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "id".
 */
export type Id = string;
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "requestId".
 */
export type RequestId = string;
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "confirmationToken".
 */
export type ConfirmationToken = string;
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "isoDate".
 */
export type IsoDate = string;
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "channel".
 */
export type Channel = "ui" | "api" | "mcp" | "skill" | "voice";
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "workType".
 */
export type WorkType = "brief" | "short" | "deep" | "project";
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "slotKind".
 */
export type SlotKind = "deep" | "project";
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "taskStatus".
 */
export type TaskStatus = "inbox" | "backlog" | "snoozed" | "completed" | "archived";
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "blockStatus".
 */
export type BlockStatus = "planned" | "executed" | "cancelled" | "missed";
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "quadrant".
 */
export type Quadrant = "ui" | "in" | "un" | "nn";
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "unmatchedReason".
 */
export type UnmatchedReason = "no_compatible_slot" | "slot_full" | "already_planned" | "not_available";

export interface HttpsQuadrantLocalSchemasCommonJson {
  [k: string]: unknown;
}
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "task".
 */
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: Channel;
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: TaskStatus;
  urgent: boolean;
  important: boolean;
  quadrant: Quadrant;
  workType?: WorkType | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "category".
 */
export interface Category {
  id: string;
  name: string;
  archived: boolean;
}
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "project".
 */
export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "slot".
 */
export interface Slot {
  id: string;
  weekday: number;
  order: number;
  kind: SlotKind;
  durationMinutes: number;
  startTime?: string | null;
}
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "slotDraft".
 */
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: SlotKind;
  durationMinutes: number;
  startTime?: string | null;
}
/**
 * This interface was referenced by `HttpsQuadrantLocalSchemasCommonJson`'s JSON-Schema
 * via the `definition` "block".
 */
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: BlockStatus;
  nominalMinutes: number;
}

// envelope.json
export interface HttpsQuadrantLocalSchemasEnvelopeJson {
  status: "ok" | "validation_error" | "conflict" | "needs_confirmation" | "needs_clarification";
  request_id?: string | null;
  result?: {
    [k: string]: unknown;
  };
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
    questions?: string[];
  };
  confirmation_token?: string;
  summary?: string;
  expires_at?: string;
}

// inbox.capture_many.input.json
export interface HttpsQuadrantLocalSchemasInboxCaptureManyInputJson {
  request_id?: string;
  confirmation_token?: string;
  /**
   * @minItems 1
   */
  items: [
    {
      title?: string;
      notes?: string;
      originalText?: string;
      channel: "ui" | "api" | "mcp" | "skill" | "voice";
      alreadyProcessed?: boolean;
      urgent?: boolean;
      important?: boolean;
      workType?: "brief" | "short" | "deep" | "project";
      nominalMinutes?: number;
      projectId?: string;
      categoryId?: string;
      deadline?: string;
    },
    ...{
      title?: string;
      notes?: string;
      originalText?: string;
      channel: "ui" | "api" | "mcp" | "skill" | "voice";
      alreadyProcessed?: boolean;
      urgent?: boolean;
      important?: boolean;
      workType?: "brief" | "short" | "deep" | "project";
      nominalMinutes?: number;
      projectId?: string;
      categoryId?: string;
      deadline?: string;
    }[]
  ];
}

// inbox.capture_many.output.json
export interface HttpsQuadrantLocalSchemasInboxCaptureManyOutputJson {
  tasks: Task[];
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// inbox.list.input.json
export interface HttpsQuadrantLocalSchemasInboxListInputJson {}

// inbox.list.output.json
export interface HttpsQuadrantLocalSchemasInboxListOutputJson {
  tasks: Task[];
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// plan.accept.input.json
export interface HttpsQuadrantLocalSchemasPlanAcceptInputJson {
  request_id?: string;
  confirmation_token?: string;
  proposalId: string;
}

// plan.accept.output.json
export interface HttpsQuadrantLocalSchemasPlanAcceptOutputJson {
  proposal: {
    id: string;
    weekPlanId: string;
    accepted?: boolean;
    reservations?: {
      taskId: string;
      slotId: string;
    }[];
    assignments: {
      taskId: string;
      slotId: string;
      nominalMinutes: number;
    }[];
    unmatched: {
      taskId: string;
      reason: "no_compatible_slot" | "slot_full" | "already_planned" | "not_available";
    }[];
    emptySlots: string[];
  };
}

// plan.propose.input.json
export interface HttpsQuadrantLocalSchemasPlanProposeInputJson {
  weekPlanId?: string;
  reservations?: {
    taskId: string;
    slotId: string;
  }[];
}

// plan.propose.output.json
export interface HttpsQuadrantLocalSchemasPlanProposeOutputJson {
  proposal: {
    id: string;
    weekPlanId: string;
    accepted?: boolean;
    reservations?: {
      taskId: string;
      slotId: string;
    }[];
    assignments: {
      taskId: string;
      slotId: string;
      nominalMinutes: number;
    }[];
    unmatched: {
      taskId: string;
      reason: "no_compatible_slot" | "slot_full" | "already_planned" | "not_available";
    }[];
    emptySlots: string[];
  };
}

// project.archive.input.json
export interface HttpsQuadrantLocalSchemasProjectArchiveInputJson {
  request_id?: string;
  confirmation_token?: string;
  projectId: string;
}

// project.archive.output.json
export interface HttpsQuadrantLocalSchemasProjectArchiveOutputJson {
  project: Project;
}
export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}

// project.create.input.json
export interface HttpsQuadrantLocalSchemasProjectCreateInputJson {
  request_id?: string;
  confirmation_token?: string;
  name: string;
  categoryId: string;
}

// project.create.output.json
export interface HttpsQuadrantLocalSchemasProjectCreateOutputJson {
  project: Project;
}
export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}

// project.list.input.json
export interface HttpsQuadrantLocalSchemasProjectListInputJson {
  includeArchived?: boolean;
  categoryId?: string;
}

// project.list.output.json
export interface HttpsQuadrantLocalSchemasProjectListOutputJson {
  projects: Project[];
}
export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}

// project.move.input.json
export interface HttpsQuadrantLocalSchemasProjectMoveInputJson {
  request_id?: string;
  confirmation_token?: string;
  projectId: string;
  categoryId: string;
}

// project.move.output.json
export interface HttpsQuadrantLocalSchemasProjectMoveOutputJson {
  project: Project;
}
export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}

// project.rename.input.json
export interface HttpsQuadrantLocalSchemasProjectRenameInputJson {
  request_id?: string;
  confirmation_token?: string;
  projectId: string;
  name: string;
}

// project.rename.output.json
export interface HttpsQuadrantLocalSchemasProjectRenameOutputJson {
  project: Project;
}
export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}

// project.unarchive.input.json
export interface HttpsQuadrantLocalSchemasProjectUnarchiveInputJson {
  request_id?: string;
  confirmation_token?: string;
  projectId: string;
}

// project.unarchive.output.json
export interface HttpsQuadrantLocalSchemasProjectUnarchiveOutputJson {
  project: Project;
}
export interface Project {
  id: string;
  name: string;
  categoryId: string;
  archived: boolean;
}

// report.nominal_time.input.json
export interface HttpsQuadrantLocalSchemasReportNominalTimeInputJson {
  from?: string;
  to?: string;
  taskId?: string;
  projectId?: string;
  categoryId?: string;
}

// report.nominal_time.output.json
export interface HttpsQuadrantLocalSchemasReportNominalTimeOutputJson {
  totals: {
    planned: number;
    executed: number;
    cancelled: number;
    missed: number;
    executedMinutes: number;
  };
  groups: {
    id: string;
    name: string;
    kind: "task" | "project" | "category";
    planned: number;
    executed: number;
    cancelled: number;
    missed: number;
    executedMinutes: number;
  }[];
}

// task.archive.input.json
export interface HttpsQuadrantLocalSchemasTaskArchiveInputJson {
  request_id?: string;
  confirmation_token?: string;
  taskId: string;
}

// task.archive.output.json
export interface HttpsQuadrantLocalSchemasTaskArchiveOutputJson {
  task: Task;
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// task.complete.input.json
export interface HttpsQuadrantLocalSchemasTaskCompleteInputJson {
  request_id?: string;
  confirmation_token?: string;
  taskId: string;
}

// task.complete.output.json
export interface HttpsQuadrantLocalSchemasTaskCompleteOutputJson {
  task: Task;
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// task.get.input.json
export interface HttpsQuadrantLocalSchemasTaskGetInputJson {
  taskId?: string;
  title?: string;
}

// task.get.output.json
export interface HttpsQuadrantLocalSchemasTaskGetOutputJson {
  task: Task;
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// task.postpone.input.json
export interface HttpsQuadrantLocalSchemasTaskPostponeInputJson {
  request_id?: string;
  confirmation_token?: string;
  taskId: string;
  resumeWeekStart?: string;
  weeksAhead?: number;
}

// task.postpone.output.json
export interface HttpsQuadrantLocalSchemasTaskPostponeOutputJson {
  task: Task;
  suggestArchive: boolean;
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// task.process.input.json
export interface HttpsQuadrantLocalSchemasTaskProcessInputJson {
  request_id?: string;
  confirmation_token?: string;
  taskId: string;
  urgent: boolean;
  important: boolean;
  workType: "brief" | "short" | "deep" | "project";
  nominalMinutes?: number;
  deadline?: string | null;
  availableOn?: string;
  projectId?: string | null;
  categoryId?: string | null;
  notes?: string;
}

// task.process.output.json
export interface HttpsQuadrantLocalSchemasTaskProcessOutputJson {
  task: Task;
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// task.unarchive.input.json
export interface HttpsQuadrantLocalSchemasTaskUnarchiveInputJson {
  request_id?: string;
  confirmation_token?: string;
  taskId: string;
}

// task.unarchive.output.json
export interface HttpsQuadrantLocalSchemasTaskUnarchiveOutputJson {
  task: Task;
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// task.update.input.json
export interface HttpsQuadrantLocalSchemasTaskUpdateInputJson {
  request_id?: string;
  confirmation_token?: string;
  taskId: string;
  title?: string;
  notes?: string | null;
  urgent?: boolean;
  important?: boolean;
  workType?: "brief" | "short" | "deep" | "project";
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  projectId?: string | null;
  categoryId?: string | null;
}

// task.update.output.json
export interface HttpsQuadrantLocalSchemasTaskUpdateOutputJson {
  task: Task;
}
export interface Task {
  id: string;
  title: string;
  notes?: string | null;
  originalText?: string;
  channel: "ui" | "api" | "mcp" | "skill" | "voice";
  projectId?: string | null;
  categoryId?: string | null;
  effectiveCategoryId?: string | null;
  status: "inbox" | "backlog" | "snoozed" | "completed" | "archived";
  urgent: boolean;
  important: boolean;
  quadrant: "ui" | "in" | "un" | "nn";
  workType?: ("brief" | "short" | "deep" | "project") | null;
  nominalMinutes?: number | null;
  deadline?: string | null;
  availableOn?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  consecutivePostponements: number;
  suggestArchive: boolean;
  hidden: boolean;
}

// template.archive.input.json
export interface HttpsQuadrantLocalSchemasTemplateArchiveInputJson {
  request_id?: string;
  confirmation_token?: string;
  templateId: string;
}

// template.archive.output.json
export interface HttpsQuadrantLocalSchemasTemplateArchiveOutputJson {
  template: {
    id: string;
    name: string;
    isDefault: boolean;
    archived: boolean;
    slots: SlotDraft[];
  };
}
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}

// template.create.input.json
export interface HttpsQuadrantLocalSchemasTemplateCreateInputJson {
  request_id?: string;
  confirmation_token?: string;
  name: string;
  slots: SlotDraft[];
}
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}

// template.create.output.json
export interface HttpsQuadrantLocalSchemasTemplateCreateOutputJson {
  template: {
    id: string;
    name: string;
    isDefault: boolean;
    archived: boolean;
    slots: SlotDraft[];
  };
}
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}

// template.duplicate.input.json
export interface HttpsQuadrantLocalSchemasTemplateDuplicateInputJson {
  request_id?: string;
  confirmation_token?: string;
  templateId: string;
  name?: string;
}

// template.duplicate.output.json
export interface HttpsQuadrantLocalSchemasTemplateDuplicateOutputJson {
  template: {
    id: string;
    name: string;
    isDefault: boolean;
    archived: boolean;
    slots: SlotDraft[];
  };
}
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}

// template.list.input.json
export interface HttpsQuadrantLocalSchemasTemplateListInputJson {
  includeArchived?: boolean;
}

// template.list.output.json
export interface HttpsQuadrantLocalSchemasTemplateListOutputJson {
  templates: {
    id: string;
    name: string;
    isDefault: boolean;
    archived: boolean;
    slots: SlotDraft[];
  }[];
}
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}

// template.update.input.json
export interface HttpsQuadrantLocalSchemasTemplateUpdateInputJson {
  request_id?: string;
  confirmation_token?: string;
  templateId: string;
  name?: string;
  slots?: SlotDraft[];
}
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}

// template.update.output.json
export interface HttpsQuadrantLocalSchemasTemplateUpdateOutputJson {
  template: {
    id: string;
    name: string;
    isDefault: boolean;
    archived: boolean;
    slots: SlotDraft[];
  };
}
export interface SlotDraft {
  id?: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}

// week.adjust_slots.input.json
export interface HttpsQuadrantLocalSchemasWeekAdjustSlotsInputJson {
  request_id?: string;
  confirmation_token?: string;
  weekPlanId?: string;
  /**
   * @minItems 1
   */
  operations: [
    {
      op: "add" | "remove" | "move" | "change";
      slotId?: string;
      weekday?: number;
      order?: number;
      kind?: "deep" | "project";
      durationMinutes?: number;
      startTime?: string | null;
    },
    ...{
      op: "add" | "remove" | "move" | "change";
      slotId?: string;
      weekday?: number;
      order?: number;
      kind?: "deep" | "project";
      durationMinutes?: number;
      startTime?: string | null;
    }[]
  ];
}

// week.adjust_slots.output.json
export interface HttpsQuadrantLocalSchemasWeekAdjustSlotsOutputJson {
  week: {
    id: string | null;
    weekStart: string | null;
    status: string | null;
    templateId?: string | null;
    slots: Slot[];
    blocks: Block[];
    resumedTaskIds?: string[];
    today?: string;
    timezone?: string;
    capacity?: {
      totalMinutes: number;
      occupiedMinutes: number;
      freeMinutes: number;
      days: {
        weekday: number;
        totalMinutes: number;
        occupiedMinutes: number;
        freeMinutes: number;
      }[];
    };
  };
}
export interface Slot {
  id: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: "planned" | "executed" | "cancelled" | "missed";
  nominalMinutes: number;
}

// week.current.input.json
export interface HttpsQuadrantLocalSchemasWeekCurrentInputJson {}

// week.current.output.json
export interface HttpsQuadrantLocalSchemasWeekCurrentOutputJson {
  week: {
    id: string | null;
    weekStart: string | null;
    status: string | null;
    templateId?: string | null;
    slots: Slot[];
    blocks: Block[];
    resumedTaskIds?: string[];
    today?: string;
    timezone?: string;
    capacity?: {
      totalMinutes: number;
      occupiedMinutes: number;
      freeMinutes: number;
      days: {
        weekday: number;
        totalMinutes: number;
        occupiedMinutes: number;
        freeMinutes: number;
      }[];
    };
  };
}
export interface Slot {
  id: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: "planned" | "executed" | "cancelled" | "missed";
  nominalMinutes: number;
}

// week.open.input.json
export interface HttpsQuadrantLocalSchemasWeekOpenInputJson {
  request_id?: string;
  confirmation_token?: string;
  templateId?: string;
  weekStart?: string;
}

// week.open.output.json
export interface HttpsQuadrantLocalSchemasWeekOpenOutputJson {
  week: {
    id: string | null;
    weekStart: string | null;
    status: string | null;
    templateId?: string | null;
    slots: Slot[];
    blocks: Block[];
    resumedTaskIds?: string[];
    today?: string;
    timezone?: string;
    capacity?: {
      totalMinutes: number;
      occupiedMinutes: number;
      freeMinutes: number;
      days: {
        weekday: number;
        totalMinutes: number;
        occupiedMinutes: number;
        freeMinutes: number;
      }[];
    };
  };
}
export interface Slot {
  id: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: "planned" | "executed" | "cancelled" | "missed";
  nominalMinutes: number;
}

// week.review.input.json
export interface HttpsQuadrantLocalSchemasWeekReviewInputJson {
  request_id?: string;
  confirmation_token?: string;
  templateId?: string;
  targetWeekStart?: string;
}

// week.review.output.json
export interface HttpsQuadrantLocalSchemasWeekReviewOutputJson {
  week: {
    id: string | null;
    weekStart: string | null;
    status: string | null;
    templateId?: string | null;
    slots: Slot[];
    blocks: Block[];
    resumedTaskIds?: string[];
    today?: string;
    timezone?: string;
    capacity?: {
      totalMinutes: number;
      occupiedMinutes: number;
      freeMinutes: number;
      days: {
        weekday: number;
        totalMinutes: number;
        occupiedMinutes: number;
        freeMinutes: number;
      }[];
    };
  };
}
export interface Slot {
  id: string;
  weekday: number;
  order: number;
  kind: "deep" | "project";
  durationMinutes: number;
  startTime?: string | null;
}
export interface Block {
  id: string;
  weekPlanId: string;
  slotId: string;
  taskId: string;
  status: "planned" | "executed" | "cancelled" | "missed";
  nominalMinutes: number;
}
