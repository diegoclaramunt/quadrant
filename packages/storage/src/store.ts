import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  DEFAULT_TEMPLATE_NAME,
  SUGGESTED_CATEGORY_NAMES,
  defaultIdGenerator,
  defaultTemplateSlots,
  systemClock,
  type AuditEvent,
  type Category,
  type CommandReceipt,
  type ConfirmationToken,
  type PlanningProposal,
  type Postponement,
  type PostponementReset,
  type Project,
  type Task,
  type TemplateSlot,
  type WeekPlan,
  type WeekSlot,
  type WeekTemplate,
  type WorkBlock,
} from '@quadrant/domain';
import { MIGRATION_001 } from './migrations';
import type { QuadrantRepositories, UnitOfWork } from './ports';

function bool(value: number | null | undefined): boolean {
  return value === 1;
}

function asTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    notes: (row.notes as string | null) ?? null,
    originalText: String(row.original_text),
    channel: row.channel as Task['channel'],
    projectId: (row.project_id as string | null) ?? null,
    categoryId: (row.category_id as string | null) ?? null,
    status: row.status as Task['status'],
    snoozeOrigin: (row.snooze_origin as Task['snoozeOrigin']) ?? null,
    previousStatus: (row.previous_status as Task['previousStatus']) ?? null,
    urgent: bool(row.urgent as number),
    important: bool(row.important as number),
    workType: (row.work_type as Task['workType']) ?? null,
    nominalMinutes: (row.nominal_minutes as number | null) ?? null,
    deadline: (row.deadline as string | null) ?? null,
    availableOn: (row.available_on as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    processedAt: (row.processed_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    archivedAt: (row.archived_at as string | null) ?? null,
  };
}

export class SqliteStore implements UnitOfWork {
  readonly db: Database.Database;
  readonly repos: QuadrantRepositories;

  constructor(filename: string) {
    if (filename !== ':memory:') {
      mkdirSync(dirname(filename), { recursive: true });
    }
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
    this.repos = this.createRepos();
    this.seed();
  }

  close(): void {
    this.db.close();
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  private migrate(): void {
    this.db.exec(MIGRATION_001);
    const applied = this.db
      .prepare('SELECT version FROM schema_migrations WHERE version = 1')
      .get() as { version: number } | undefined;
    if (!applied) {
      this.db
        .prepare(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)',
        )
        .run(new Date().toISOString());
    }
  }

  private seed(): void {
    const timezoneRow = this.db
      .prepare("SELECT value FROM settings WHERE key = 'timezone'")
      .get() as { value: string } | undefined;
    if (!timezoneRow) {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      this.db
        .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
        .run('timezone', timezone);
    }
    const categoryCount = (
      this.db.prepare('SELECT COUNT(*) as count FROM categories').get() as {
        count: number;
      }
    ).count;
    if (categoryCount === 0) {
      const now = systemClock().now().toISOString();
      const ids = defaultIdGenerator();
      for (const name of SUGGESTED_CATEGORY_NAMES) {
        this.db
          .prepare(
            'INSERT INTO categories (id, name, archived_at) VALUES (?, ?, NULL)',
          )
          .run(ids(), name);
      }
      const templateId = ids();
      this.db
        .prepare(
          'INSERT INTO week_templates (id, name, is_default, archived_at) VALUES (?, ?, 1, NULL)',
        )
        .run(templateId, DEFAULT_TEMPLATE_NAME);
      const insertSlot = this.db.prepare(
        `INSERT INTO template_slots (id, template_id, weekday, slot_order, kind, duration_minutes, start_time)
         VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      );
      for (const spec of defaultTemplateSlots()) {
        insertSlot.run(
          ids(),
          templateId,
          spec.weekday,
          spec.order,
          spec.kind,
          spec.durationMinutes,
        );
      }
      void now;
    }
  }

  private createRepos(): QuadrantRepositories {
    const db = this.db;
    return {
      categories: {
        list(includeArchived) {
          const sql = includeArchived
            ? 'SELECT * FROM categories ORDER BY name'
            : 'SELECT * FROM categories WHERE archived_at IS NULL ORDER BY name';
          return (db.prepare(sql).all() as Record<string, unknown>[]).map(
            (row) => ({
              id: String(row.id),
              name: String(row.name),
              archivedAt: (row.archived_at as string | null) ?? null,
            }),
          );
        },
        get(id) {
          const row = db
            .prepare('SELECT * FROM categories WHERE id = ?')
            .get(id) as Record<string, unknown> | undefined;
          return row
            ? {
                id: String(row.id),
                name: String(row.name),
                archivedAt: (row.archived_at as string | null) ?? null,
              }
            : null;
        },
        findByName(name) {
          return (
            db
              .prepare('SELECT * FROM categories WHERE lower(name) = lower(?)')
              .all(name) as Record<string, unknown>[]
          ).map((row) => ({
            id: String(row.id),
            name: String(row.name),
            archivedAt: (row.archived_at as string | null) ?? null,
          }));
        },
        insert(category: Category) {
          db.prepare(
            'INSERT INTO categories (id, name, archived_at) VALUES (?, ?, ?)',
          ).run(category.id, category.name, category.archivedAt);
        },
        update(category: Category) {
          db.prepare(
            'UPDATE categories SET name = ?, archived_at = ? WHERE id = ?',
          ).run(category.name, category.archivedAt, category.id);
        },
      },
      projects: {
        list(includeArchived) {
          const sql = includeArchived
            ? 'SELECT * FROM projects ORDER BY name'
            : 'SELECT * FROM projects WHERE archived_at IS NULL ORDER BY name';
          return (db.prepare(sql).all() as Record<string, unknown>[]).map(
            (row) => ({
              id: String(row.id),
              name: String(row.name),
              categoryId: String(row.category_id),
              archivedAt: (row.archived_at as string | null) ?? null,
            }),
          );
        },
        get(id) {
          const row = db
            .prepare('SELECT * FROM projects WHERE id = ?')
            .get(id) as Record<string, unknown> | undefined;
          return row
            ? {
                id: String(row.id),
                name: String(row.name),
                categoryId: String(row.category_id),
                archivedAt: (row.archived_at as string | null) ?? null,
              }
            : null;
        },
        findByName(name) {
          return (
            db
              .prepare('SELECT * FROM projects WHERE lower(name) = lower(?)')
              .all(name) as Record<string, unknown>[]
          ).map((row) => ({
            id: String(row.id),
            name: String(row.name),
            categoryId: String(row.category_id),
            archivedAt: (row.archived_at as string | null) ?? null,
          }));
        },
        insert(project: Project) {
          db.prepare(
            'INSERT INTO projects (id, name, category_id, archived_at) VALUES (?, ?, ?, ?)',
          ).run(
            project.id,
            project.name,
            project.categoryId,
            project.archivedAt,
          );
        },
        update(project: Project) {
          db.prepare(
            'UPDATE projects SET name = ?, category_id = ?, archived_at = ? WHERE id = ?',
          ).run(
            project.name,
            project.categoryId,
            project.archivedAt,
            project.id,
          );
        },
      },
      tasks: {
        list() {
          return (
            db
              .prepare('SELECT * FROM tasks ORDER BY created_at')
              .all() as Record<string, unknown>[]
          ).map(asTask);
        },
        get(id) {
          const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
            | Record<string, unknown>
            | undefined;
          return row ? asTask(row) : null;
        },
        findByTitle(title) {
          return (
            db
              .prepare('SELECT * FROM tasks WHERE lower(title) = lower(?)')
              .all(title) as Record<string, unknown>[]
          ).map(asTask);
        },
        insert(task: Task) {
          db.prepare(
            `INSERT INTO tasks (
              id, title, notes, original_text, channel, project_id, category_id, status,
              snooze_origin, previous_status, urgent, important, work_type, nominal_minutes,
              deadline, available_on, created_at, updated_at, processed_at, completed_at, archived_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            task.id,
            task.title,
            task.notes,
            task.originalText,
            task.channel,
            task.projectId,
            task.categoryId,
            task.status,
            task.snoozeOrigin,
            task.previousStatus,
            task.urgent ? 1 : 0,
            task.important ? 1 : 0,
            task.workType,
            task.nominalMinutes,
            task.deadline,
            task.availableOn,
            task.createdAt,
            task.updatedAt,
            task.processedAt,
            task.completedAt,
            task.archivedAt,
          );
        },
        update(task: Task) {
          db.prepare(
            `UPDATE tasks SET
              title = ?, notes = ?, original_text = ?, channel = ?, project_id = ?, category_id = ?,
              status = ?, snooze_origin = ?, previous_status = ?, urgent = ?, important = ?,
              work_type = ?, nominal_minutes = ?, deadline = ?, available_on = ?, created_at = ?,
              updated_at = ?, processed_at = ?, completed_at = ?, archived_at = ?
             WHERE id = ?`,
          ).run(
            task.title,
            task.notes,
            task.originalText,
            task.channel,
            task.projectId,
            task.categoryId,
            task.status,
            task.snoozeOrigin,
            task.previousStatus,
            task.urgent ? 1 : 0,
            task.important ? 1 : 0,
            task.workType,
            task.nominalMinutes,
            task.deadline,
            task.availableOn,
            task.createdAt,
            task.updatedAt,
            task.processedAt,
            task.completedAt,
            task.archivedAt,
            task.id,
          );
        },
      },
      templates: {
        list(includeArchived) {
          const sql = includeArchived
            ? 'SELECT * FROM week_templates ORDER BY name'
            : 'SELECT * FROM week_templates WHERE archived_at IS NULL ORDER BY name';
          return (db.prepare(sql).all() as Record<string, unknown>[]).map(
            (row) => ({
              id: String(row.id),
              name: String(row.name),
              isDefault: bool(row.is_default as number),
              archivedAt: (row.archived_at as string | null) ?? null,
            }),
          );
        },
        get(id) {
          const row = db
            .prepare('SELECT * FROM week_templates WHERE id = ?')
            .get(id) as Record<string, unknown> | undefined;
          return row
            ? {
                id: String(row.id),
                name: String(row.name),
                isDefault: bool(row.is_default as number),
                archivedAt: (row.archived_at as string | null) ?? null,
              }
            : null;
        },
        default() {
          const row = db
            .prepare(
              'SELECT * FROM week_templates WHERE is_default = 1 AND archived_at IS NULL LIMIT 1',
            )
            .get() as Record<string, unknown> | undefined;
          return row
            ? {
                id: String(row.id),
                name: String(row.name),
                isDefault: true,
                archivedAt: null,
              }
            : null;
        },
        insert(template: WeekTemplate) {
          db.prepare(
            'INSERT INTO week_templates (id, name, is_default, archived_at) VALUES (?, ?, ?, ?)',
          ).run(
            template.id,
            template.name,
            template.isDefault ? 1 : 0,
            template.archivedAt,
          );
        },
        update(template: WeekTemplate) {
          db.prepare(
            'UPDATE week_templates SET name = ?, is_default = ?, archived_at = ? WHERE id = ?',
          ).run(
            template.name,
            template.isDefault ? 1 : 0,
            template.archivedAt,
            template.id,
          );
        },
        slots(templateId: string) {
          return (
            db
              .prepare(
                'SELECT * FROM template_slots WHERE template_id = ? ORDER BY weekday, slot_order',
              )
              .all(templateId) as Record<string, unknown>[]
          ).map((row) => ({
            id: String(row.id),
            templateId: String(row.template_id),
            weekday: Number(row.weekday),
            order: Number(row.slot_order),
            kind: row.kind as TemplateSlot['kind'],
            durationMinutes: Number(row.duration_minutes),
            startTime: (row.start_time as string | null) ?? null,
          }));
        },
        insertSlot(slot: TemplateSlot) {
          db.prepare(
            `INSERT INTO template_slots (id, template_id, weekday, slot_order, kind, duration_minutes, start_time)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            slot.id,
            slot.templateId,
            slot.weekday,
            slot.order,
            slot.kind,
            slot.durationMinutes,
            slot.startTime,
          );
        },
        deleteSlots(templateId: string) {
          db.prepare('DELETE FROM template_slots WHERE template_id = ?').run(
            templateId,
          );
        },
      },
      weeks: {
        list() {
          return (
            db
              .prepare('SELECT * FROM week_plans ORDER BY week_start')
              .all() as Record<string, unknown>[]
          ).map((row) => ({
            id: String(row.id),
            weekStart: String(row.week_start),
            templateId: String(row.template_id),
            status: row.status as WeekPlan['status'],
            closedAt: (row.closed_at as string | null) ?? null,
          }));
        },
        get(id) {
          const row = db
            .prepare('SELECT * FROM week_plans WHERE id = ?')
            .get(id) as Record<string, unknown> | undefined;
          return row
            ? {
                id: String(row.id),
                weekStart: String(row.week_start),
                templateId: String(row.template_id),
                status: row.status as WeekPlan['status'],
                closedAt: (row.closed_at as string | null) ?? null,
              }
            : null;
        },
        getByStart(weekStart) {
          const row = db
            .prepare('SELECT * FROM week_plans WHERE week_start = ?')
            .get(weekStart) as Record<string, unknown> | undefined;
          return row
            ? {
                id: String(row.id),
                weekStart: String(row.week_start),
                templateId: String(row.template_id),
                status: row.status as WeekPlan['status'],
                closedAt: (row.closed_at as string | null) ?? null,
              }
            : null;
        },
        open() {
          const row = db
            .prepare("SELECT * FROM week_plans WHERE status = 'open' LIMIT 1")
            .get() as Record<string, unknown> | undefined;
          return row
            ? {
                id: String(row.id),
                weekStart: String(row.week_start),
                templateId: String(row.template_id),
                status: 'open',
                closedAt: null,
              }
            : null;
        },
        insert(plan: WeekPlan) {
          db.prepare(
            'INSERT INTO week_plans (id, week_start, template_id, status, closed_at) VALUES (?, ?, ?, ?, ?)',
          ).run(
            plan.id,
            plan.weekStart,
            plan.templateId,
            plan.status,
            plan.closedAt,
          );
        },
        update(plan: WeekPlan) {
          db.prepare(
            'UPDATE week_plans SET week_start = ?, template_id = ?, status = ?, closed_at = ? WHERE id = ?',
          ).run(
            plan.weekStart,
            plan.templateId,
            plan.status,
            plan.closedAt,
            plan.id,
          );
        },
        slots(weekPlanId: string) {
          return (
            db
              .prepare(
                'SELECT * FROM week_slots WHERE week_plan_id = ? ORDER BY weekday, slot_order',
              )
              .all(weekPlanId) as Record<string, unknown>[]
          ).map((row) => ({
            id: String(row.id),
            weekPlanId: String(row.week_plan_id),
            weekday: Number(row.weekday),
            order: Number(row.slot_order),
            kind: row.kind as WeekSlot['kind'],
            durationMinutes: Number(row.duration_minutes),
            startTime: (row.start_time as string | null) ?? null,
          }));
        },
        insertSlot(slot: WeekSlot) {
          db.prepare(
            `INSERT INTO week_slots (id, week_plan_id, weekday, slot_order, kind, duration_minutes, start_time)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            slot.id,
            slot.weekPlanId,
            slot.weekday,
            slot.order,
            slot.kind,
            slot.durationMinutes,
            slot.startTime,
          );
        },
        updateSlot(slot: WeekSlot) {
          db.prepare(
            `UPDATE week_slots SET weekday = ?, slot_order = ?, kind = ?, duration_minutes = ?, start_time = ?
             WHERE id = ?`,
          ).run(
            slot.weekday,
            slot.order,
            slot.kind,
            slot.durationMinutes,
            slot.startTime,
            slot.id,
          );
        },
        deleteSlot(id: string) {
          db.prepare('DELETE FROM week_slots WHERE id = ?').run(id);
        },
      },
      blocks: {
        list() {
          return (
            db.prepare('SELECT * FROM work_blocks').all() as Record<
              string,
              unknown
            >[]
          ).map(asBlock);
        },
        forWeek(weekPlanId) {
          return (
            db
              .prepare('SELECT * FROM work_blocks WHERE week_plan_id = ?')
              .all(weekPlanId) as Record<string, unknown>[]
          ).map(asBlock);
        },
        forSlot(slotId) {
          return (
            db
              .prepare('SELECT * FROM work_blocks WHERE slot_id = ?')
              .all(slotId) as Record<string, unknown>[]
          ).map(asBlock);
        },
        forTask(taskId) {
          return (
            db
              .prepare('SELECT * FROM work_blocks WHERE task_id = ?')
              .all(taskId) as Record<string, unknown>[]
          ).map(asBlock);
        },
        get(id) {
          const row = db
            .prepare('SELECT * FROM work_blocks WHERE id = ?')
            .get(id) as Record<string, unknown> | undefined;
          return row ? asBlock(row) : null;
        },
        insert(block: WorkBlock) {
          db.prepare(
            `INSERT INTO work_blocks (id, week_plan_id, slot_id, task_id, status, nominal_minutes, created_at, executed_at, cancelled_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            block.id,
            block.weekPlanId,
            block.slotId,
            block.taskId,
            block.status,
            block.nominalMinutes,
            block.createdAt,
            block.executedAt,
            block.cancelledAt,
          );
        },
        update(block: WorkBlock) {
          db.prepare(
            `UPDATE work_blocks SET status = ?, nominal_minutes = ?, executed_at = ?, cancelled_at = ? WHERE id = ?`,
          ).run(
            block.status,
            block.nominalMinutes,
            block.executedAt,
            block.cancelledAt,
            block.id,
          );
        },
      },
      postponements: {
        forTask(taskId) {
          return (
            db
              .prepare(
                'SELECT * FROM postponements WHERE task_id = ? ORDER BY created_at',
              )
              .all(taskId) as Record<string, unknown>[]
          ).map(asPostponement);
        },
        pending() {
          return (
            db
              .prepare('SELECT * FROM postponements WHERE resumed_at IS NULL')
              .all() as Record<string, unknown>[]
          ).map(asPostponement);
        },
        insert(item: Postponement) {
          db.prepare(
            `INSERT INTO postponements (id, task_id, from_status, resume_week_start, created_at, resumed_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).run(
            item.id,
            item.taskId,
            item.fromStatus,
            item.resumeWeekStart,
            item.createdAt,
            item.resumedAt,
          );
        },
        update(item: Postponement) {
          db.prepare(
            'UPDATE postponements SET resumed_at = ? WHERE id = ?',
          ).run(item.resumedAt, item.id);
        },
        resets(taskId) {
          return (
            db
              .prepare(
                'SELECT * FROM postponement_resets WHERE task_id = ? ORDER BY created_at',
              )
              .all(taskId) as Record<string, unknown>[]
          ).map((row) => ({
            id: String(row.id),
            taskId: String(row.task_id),
            reason: row.reason as PostponementReset['reason'],
            createdAt: String(row.created_at),
          }));
        },
        insertReset(item: PostponementReset) {
          db.prepare(
            'INSERT INTO postponement_resets (id, task_id, reason, created_at) VALUES (?, ?, ?, ?)',
          ).run(item.id, item.taskId, item.reason, item.createdAt);
        },
      },
      proposals: {
        get(id) {
          const row = db
            .prepare('SELECT * FROM planning_proposals WHERE id = ?')
            .get(id) as Record<string, unknown> | undefined;
          if (!row) {
            return null;
          }
          const payload = JSON.parse(String(row.payload_json)) as Omit<
            PlanningProposal,
            'id' | 'weekPlanId' | 'createdAt' | 'acceptedAt'
          >;
          return {
            id: String(row.id),
            weekPlanId: String(row.week_plan_id),
            createdAt: String(row.created_at),
            acceptedAt: (row.accepted_at as string | null) ?? null,
            assignments: payload.assignments,
            unmatched: payload.unmatched,
            emptySlots: payload.emptySlots,
          };
        },
        insert(proposal: PlanningProposal) {
          db.prepare(
            `INSERT INTO planning_proposals (id, week_plan_id, created_at, accepted_at, payload_json)
             VALUES (?, ?, ?, ?, ?)`,
          ).run(
            proposal.id,
            proposal.weekPlanId,
            proposal.createdAt,
            proposal.acceptedAt,
            JSON.stringify({
              assignments: proposal.assignments,
              unmatched: proposal.unmatched,
              emptySlots: proposal.emptySlots,
            }),
          );
        },
        update(proposal: PlanningProposal) {
          db.prepare(
            'UPDATE planning_proposals SET accepted_at = ?, payload_json = ? WHERE id = ?',
          ).run(
            proposal.acceptedAt,
            JSON.stringify({
              assignments: proposal.assignments,
              unmatched: proposal.unmatched,
              emptySlots: proposal.emptySlots,
            }),
            proposal.id,
          );
        },
      },
      receipts: {
        get(requestId) {
          const row = db
            .prepare('SELECT * FROM command_receipts WHERE request_id = ?')
            .get(requestId) as Record<string, unknown> | undefined;
          return row
            ? {
                requestId: String(row.request_id),
                payloadHash: String(row.payload_hash),
                capabilityId: String(row.capability_id),
                responseJson: String(row.response_json),
                createdAt: String(row.created_at),
              }
            : null;
        },
        insert(receipt: CommandReceipt) {
          db.prepare(
            `INSERT INTO command_receipts (request_id, payload_hash, capability_id, response_json, created_at)
             VALUES (?, ?, ?, ?, ?)`,
          ).run(
            receipt.requestId,
            receipt.payloadHash,
            receipt.capabilityId,
            receipt.responseJson,
            receipt.createdAt,
          );
        },
        deleteOlderThan(iso) {
          db.prepare('DELETE FROM command_receipts WHERE created_at < ?').run(
            iso,
          );
        },
      },
      confirmations: {
        get(token) {
          const row = db
            .prepare('SELECT * FROM confirmation_tokens WHERE token = ?')
            .get(token) as Record<string, unknown> | undefined;
          return row
            ? {
                token: String(row.token),
                capabilityId: String(row.capability_id),
                payloadHash: String(row.payload_hash),
                summary: String(row.summary),
                expiresAt: String(row.expires_at),
                usedAt: (row.used_at as string | null) ?? null,
              }
            : null;
        },
        insert(token: ConfirmationToken) {
          db.prepare(
            `INSERT INTO confirmation_tokens (token, capability_id, payload_hash, summary, expires_at, used_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).run(
            token.token,
            token.capabilityId,
            token.payloadHash,
            token.summary,
            token.expiresAt,
            token.usedAt,
          );
        },
        update(token: ConfirmationToken) {
          db.prepare(
            'UPDATE confirmation_tokens SET used_at = ? WHERE token = ?',
          ).run(token.usedAt, token.token);
        },
      },
      settings: {
        get() {
          const row = db
            .prepare("SELECT value FROM settings WHERE key = 'timezone'")
            .get() as { value: string } | undefined;
          return { timezone: row?.value ?? 'UTC' };
        },
        setTimezone(timezone: string) {
          db.prepare(
            "INSERT INTO settings (key, value) VALUES ('timezone', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          ).run(timezone);
        },
      },
      audit: {
        insert(event: AuditEvent) {
          db.prepare(
            `INSERT INTO audit_events (id, at, capability_id, request_id, action, entity_type, entity_id, payload_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            event.id,
            event.at,
            event.capabilityId,
            event.requestId,
            event.action,
            event.entityType,
            event.entityId,
            JSON.stringify(event.payload),
          );
        },
      },
    };
  }
}

function asBlock(row: Record<string, unknown>): WorkBlock {
  return {
    id: String(row.id),
    weekPlanId: String(row.week_plan_id),
    slotId: String(row.slot_id),
    taskId: String(row.task_id),
    status: row.status as WorkBlock['status'],
    nominalMinutes: Number(row.nominal_minutes),
    createdAt: String(row.created_at),
    executedAt: (row.executed_at as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
  };
}

function asPostponement(row: Record<string, unknown>): Postponement {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    fromStatus: row.from_status as Postponement['fromStatus'],
    resumeWeekStart: String(row.resume_week_start),
    createdAt: String(row.created_at),
    resumedAt: (row.resumed_at as string | null) ?? null,
  };
}

export function openStore(filename = ':memory:'): SqliteStore {
  return new SqliteStore(filename);
}
