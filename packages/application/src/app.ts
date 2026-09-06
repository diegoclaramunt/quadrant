import {
  CONFIRMATION_TTL_MS,
  DomainError,
  PROJECT_MINUTES,
  RECEIPT_RETENTION_DAYS,
  addDays,
  applyProjectAssociation,
  assertAssignable,
  assertCategoryInvariant,
  assertNoDoubleBookingForNonProject,
  assertShortDuration,
  assertTaskVisibleForPlanning,
  canArchive,
  canComplete,
  canPostpone,
  canProcess,
  canUnarchive,
  conflictError,
  currentMonday,
  declaredTaskDuration,
  defaultDomainContext,
  mondayOf,
  normalizeTemplateSlot,
  notFoundError,
  originAfterUnarchive,
  proposePlan,
  resolveTaskTitle,
  reviewWeekStart,
  statusAfterSnoozeResume,
  todayIso,
  validationError,
  ymdInTimeZone,
  type DomainContext,
  type PlanReservation,
  type SlotKind,
  type Task,
  type WeekPlan,
  type WorkType,
} from '@quadrant/domain';
import { manifest, validateCapabilityInput } from '@quadrant/capabilities';
import type { QuadrantRepositories, UnitOfWork } from '@quadrant/storage';
import {
  clarification,
  conflict,
  ok,
  validation,
  type Envelope,
} from './envelope';
import { payloadHash } from './hash';
import {
  hiddenTaskIds,
  presentBlock,
  presentCategory,
  presentProject,
  presentTask,
  presentTemplate,
  presentWeek,
  visibleBacklog,
  visibleInbox,
} from './presenters';

type Payload = Record<string, unknown>;

export class QuadrantApp {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly domain: DomainContext = defaultDomainContext(),
  ) {}

  invoke(capabilityId: string, payload: unknown = {}): Envelope {
    const capability = manifest.capabilities.find(
      (item) => item.id === capabilityId,
    );
    const body = (payload ?? {}) as Payload;
    const requestId =
      typeof body.request_id === 'string' ? body.request_id : null;
    if (!capability) {
      return validation(`Capacidad desconocida: ${capabilityId}`, requestId);
    }
    const checked = validateCapabilityInput(capabilityId, body);
    if (!checked.ok) {
      return validation('Entrada inválida', requestId, checked.errors);
    }
    try {
      return this.uow.transaction(() =>
        this.execute(
          capability.id,
          capability.sideEffect as 'read' | 'write' | 'destructive',
          capability.confirmation as 'none' | 'required',
          body,
          requestId,
        ),
      );
    } catch (error) {
      if (error instanceof ClarificationError) {
        return clarification(error.message, error.questions, requestId);
      }
      if (error instanceof DomainError) {
        if (error.code === 'validation' || error.code === 'not_found') {
          return validation(error.message, requestId);
        }
        return conflict(error.message, requestId, error.code);
      }
      throw error;
    }
  }

  private execute(
    capabilityId: string,
    sideEffect: 'read' | 'write' | 'destructive',
    confirmation: 'none' | 'required',
    body: Payload,
    requestId: string | null,
  ): Envelope {
    const repos = this.uow.repos;
    const now = this.domain.clock.now();
    const nowIso = now.toISOString();
    if (requestId && sideEffect !== 'read') {
      const existing = repos.receipts.get(requestId);
      const hash = payloadHash(body);
      if (existing) {
        if (existing.payloadHash !== hash) {
          return conflict(
            'El mismo request_id se usó con un payload distinto',
            requestId,
            'conflict',
          );
        }
        return JSON.parse(existing.responseJson) as Envelope;
      }
    }
    if (confirmation === 'required') {
      const tokenValue =
        typeof body.confirmation_token === 'string'
          ? body.confirmation_token
          : null;
      const hash = payloadHash(body);
      if (!tokenValue) {
        const token = this.domain.ids();
        const expires = new Date(
          now.getTime() + CONFIRMATION_TTL_MS,
        ).toISOString();
        repos.confirmations.insert({
          token,
          capabilityId,
          payloadHash: hash,
          summary: this.confirmationSummary(capabilityId, body, repos),
          expiresAt: expires,
          usedAt: null,
        });
        return {
          status: 'needs_confirmation',
          request_id: requestId,
          confirmation_token: token,
          summary: this.confirmationSummary(capabilityId, body, repos),
          expires_at: expires,
        };
      }
      const stored = repos.confirmations.get(tokenValue);
      if (!stored || stored.capabilityId !== capabilityId) {
        return conflict(
          'Token de confirmación inválido',
          requestId,
          'conflict',
        );
      }
      if (stored.usedAt) {
        return conflict(
          'El token de confirmación ya fue usado',
          requestId,
          'conflict',
        );
      }
      if (stored.expiresAt <= nowIso) {
        return conflict(
          'El token de confirmación ha caducado',
          requestId,
          'conflict',
        );
      }
      if (stored.payloadHash !== hash) {
        return conflict(
          'El token no corresponde a este payload',
          requestId,
          'conflict',
        );
      }
      stored.usedAt = nowIso;
      repos.confirmations.update(stored);
    }

    const result = this.dispatch(capabilityId, body, repos, nowIso);
    if (requestId && sideEffect !== 'read' && result.status === 'ok') {
      const cutoff = new Date(
        now.getTime() - RECEIPT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      repos.receipts.deleteOlderThan(cutoff);
      repos.receipts.insert({
        requestId,
        payloadHash: payloadHash(body),
        capabilityId,
        responseJson: JSON.stringify(result),
        createdAt: nowIso,
      });
    }
    repos.audit.insert({
      id: this.domain.ids(),
      at: nowIso,
      capabilityId,
      requestId,
      action: capabilityId,
      entityType: 'capability',
      entityId: null,
      payload: { status: result.status },
    });
    return result;
  }

  private dispatch(
    capabilityId: string,
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    switch (capabilityId) {
      case 'inbox.capture_many':
        return this.captureMany(body, repos, nowIso);
      case 'inbox.list':
        return ok({ tasks: visibleInbox(repos) });
      case 'backlog.list':
        return ok({
          tasks: visibleBacklog(repos, {
            categoryId: body.categoryId as string | undefined,
            projectId: body.projectId as string | undefined,
          }),
        });
      case 'task.get':
        return this.taskGet(body, repos);
      case 'task.process':
        return this.taskProcess(body, repos, nowIso);
      case 'task.update':
        return this.taskUpdate(body, repos, nowIso);
      case 'task.postpone':
        return this.taskPostpone(body, repos, nowIso);
      case 'task.complete':
        return this.taskComplete(body, repos, nowIso);
      case 'task.archive':
        return this.taskArchive(body, repos, nowIso);
      case 'task.unarchive':
        return this.taskUnarchive(body, repos, nowIso);
      case 'category.create':
        return this.categoryCreate(body, repos);
      case 'category.rename':
        return this.categoryRename(body, repos);
      case 'category.archive':
        return this.categoryArchive(body, repos, nowIso);
      case 'category.unarchive':
        return this.categoryUnarchive(body, repos);
      case 'category.list':
        return ok({
          categories: repos.categories
            .list(Boolean(body.includeArchived))
            .map(presentCategory),
        });
      case 'project.create':
        return this.projectCreate(body, repos);
      case 'project.rename':
        return this.projectRename(body, repos);
      case 'project.move':
        return this.projectMove(body, repos);
      case 'project.archive':
        return this.projectArchive(body, repos, nowIso);
      case 'project.unarchive':
        return this.projectUnarchive(body, repos);
      case 'project.list':
        return ok({
          projects: repos.projects
            .list(Boolean(body.includeArchived))
            .filter(
              (item) => !body.categoryId || item.categoryId === body.categoryId,
            )
            .map(presentProject),
        });
      case 'template.create':
        return this.templateCreate(body, repos);
      case 'template.duplicate':
        return this.templateDuplicate(body, repos);
      case 'template.update':
        return this.templateUpdate(body, repos);
      case 'template.archive':
        return this.templateArchive(body, repos, nowIso);
      case 'template.list':
        return ok({
          templates: repos.templates
            .list(Boolean(body.includeArchived))
            .map((template) =>
              presentTemplate(template, repos.templates.slots(template.id)),
            ),
        });
      case 'week.open':
        return this.weekOpen(body, repos, nowIso);
      case 'week.review':
        return this.weekReview(body, repos, nowIso);
      case 'week.current':
        return this.weekCurrent(repos);
      case 'week.adjust_slots':
        return this.weekAdjust(body, repos);
      case 'plan.propose':
        return this.planPropose(body, repos, nowIso);
      case 'plan.accept':
        return this.planAccept(body, repos, nowIso);
      case 'block.schedule':
        return this.blockSchedule(body, repos, nowIso);
      case 'block.execute':
        return this.blockExecute(body, repos, nowIso);
      case 'block.cancel':
        return this.blockCancel(body, repos, nowIso);
      case 'report.nominal_time':
        return this.report(body, repos);
      default:
        return validation(`Capacidad no implementada: ${capabilityId}`);
    }
  }

  private captureMany(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const items = body.items as Payload[];
    const tasks = items.map((item) => {
      const originalText = String(item.originalText ?? item.title ?? '');
      const title = resolveTaskTitle(String(item.title ?? ''), originalText);
      let task: Task = {
        id: this.domain.ids(),
        title,
        notes: typeof item.notes === 'string' ? item.notes : null,
        originalText: originalText || title,
        channel: item.channel as Task['channel'],
        projectId: null,
        categoryId: null,
        status: 'inbox',
        snoozeOrigin: null,
        previousStatus: null,
        urgent: false,
        important: false,
        workType: null,
        nominalMinutes: null,
        deadline: null,
        availableOn: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        processedAt: null,
        completedAt: null,
        archivedAt: null,
      };
      if (item.alreadyProcessed) {
        task = this.applyClassification(task, item, repos, nowIso);
        task.status = 'backlog';
        task.processedAt = nowIso;
        this.resetPostponements(task.id, 'process', repos, nowIso);
      }
      repos.tasks.insert(task);
      return presentTask(task, repos);
    });
    return ok({ tasks });
  }

  private taskGet(body: Payload, repos: QuadrantRepositories): Envelope {
    const task = this.findTask(body, repos);
    if (isEnvelope(task)) {
      return task;
    }
    return ok({ task: presentTask(task, repos) });
  }

  private taskProcess(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const current = this.requireTask(String(body.taskId), repos);
    canProcess(current);
    const processed = this.applyClassification(current, body, repos, nowIso);
    processed.status = 'backlog';
    processed.processedAt = nowIso;
    processed.updatedAt = nowIso;
    repos.tasks.update(processed);
    this.resetPostponements(processed.id, 'process', repos, nowIso);
    return ok({ task: presentTask(processed, repos) });
  }

  private taskUpdate(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    let task = this.requireTask(String(body.taskId), repos);
    if (body.title) {
      task.title = String(body.title);
    }
    if ('notes' in body) {
      task.notes = (body.notes as string | null) ?? null;
    }
    if (typeof body.urgent === 'boolean') {
      task.urgent = body.urgent;
    }
    if (typeof body.important === 'boolean') {
      task.important = body.important;
    }
    if (body.workType) {
      task.workType = body.workType as WorkType;
      task.nominalMinutes = declaredTaskDuration(
        task.workType,
        body.nominalMinutes as number | null,
      );
      if (task.workType === 'short') {
        assertShortDuration(task.nominalMinutes ?? 30);
      }
    } else if ('nominalMinutes' in body && task.workType === 'short') {
      assertShortDuration(Number(body.nominalMinutes));
      task.nominalMinutes = Number(body.nominalMinutes);
    }
    if ('deadline' in body) {
      task.deadline = (body.deadline as string | null) ?? null;
    }
    if ('availableOn' in body) {
      task.availableOn = (body.availableOn as string | null) ?? null;
    }
    if ('projectId' in body || 'categoryId' in body) {
      task = this.assignProjectOrCategory(task, body, repos);
    }
    task.updatedAt = nowIso;
    assertCategoryInvariant(task);
    repos.tasks.update(task);
    return ok({ task: presentTask(task, repos) });
  }

  private taskPostpone(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const task = this.requireTask(String(body.taskId), repos);
    const origin = canPostpone(task);
    const timezone = repos.settings.get().timezone;
    const current = currentMonday(this.domain.clock, timezone);
    const resumeWeekStart = body.resumeWeekStart
      ? mondayOf(String(body.resumeWeekStart))
      : addDays(current, 7 * Number(body.weeksAhead ?? 1));
    if (resumeWeekStart <= current) {
      throw validationError(
        'La posposición debe apuntar a la siguiente revisión o una posterior',
      );
    }
    repos.postponements.insert({
      id: this.domain.ids(),
      taskId: task.id,
      fromStatus: origin,
      resumeWeekStart,
      createdAt: nowIso,
      resumedAt: null,
    });
    task.status = 'snoozed';
    task.snoozeOrigin = origin;
    task.updatedAt = nowIso;
    repos.tasks.update(task);
    const presented = presentTask(task, repos);
    return ok({ task: presented, suggestArchive: presented.suggestArchive });
  }

  private taskComplete(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const task = this.requireTask(String(body.taskId), repos);
    canComplete(task);
    for (const block of repos.blocks.forTask(task.id)) {
      if (block.status === 'planned') {
        block.status = 'cancelled';
        block.cancelledAt = nowIso;
        repos.blocks.update(block);
      }
    }
    task.status = 'completed';
    task.completedAt = nowIso;
    task.updatedAt = nowIso;
    repos.tasks.update(task);
    this.resetPostponements(task.id, 'complete', repos, nowIso);
    return ok({ task: presentTask(task, repos) });
  }

  private taskArchive(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const task = this.requireTask(String(body.taskId), repos);
    canArchive(task);
    const previous =
      task.status === 'snoozed' ? task.snoozeOrigin : task.status;
    task.previousStatus =
      previous === 'inbox' || previous === 'backlog' ? previous : 'backlog';
    task.status = 'archived';
    task.archivedAt = nowIso;
    task.updatedAt = nowIso;
    repos.tasks.update(task);
    this.resetPostponements(task.id, 'archive', repos, nowIso);
    return ok({ task: presentTask(task, repos) });
  }

  private taskUnarchive(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const task = this.requireTask(String(body.taskId), repos);
    canUnarchive(task);
    task.status = originAfterUnarchive(task);
    task.archivedAt = null;
    task.updatedAt = nowIso;
    repos.tasks.update(task);
    return ok({ task: presentTask(task, repos) });
  }

  private categoryCreate(body: Payload, repos: QuadrantRepositories): Envelope {
    const category = {
      id: this.domain.ids(),
      name: String(body.name).trim(),
      archivedAt: null,
    };
    repos.categories.insert(category);
    return ok({ category: presentCategory(category) });
  }

  private categoryRename(body: Payload, repos: QuadrantRepositories): Envelope {
    const category = this.requireCategory(String(body.categoryId), repos);
    category.name = String(body.name).trim();
    repos.categories.update(category);
    return ok({ category: presentCategory(category) });
  }

  private categoryArchive(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const category = this.requireCategory(String(body.categoryId), repos);
    category.archivedAt = nowIso;
    repos.categories.update(category);
    return ok({ category: presentCategory(category) });
  }

  private categoryUnarchive(
    body: Payload,
    repos: QuadrantRepositories,
  ): Envelope {
    const category = this.requireCategory(String(body.categoryId), repos);
    category.archivedAt = null;
    repos.categories.update(category);
    return ok({ category: presentCategory(category) });
  }

  private projectCreate(body: Payload, repos: QuadrantRepositories): Envelope {
    this.requireCategory(String(body.categoryId), repos);
    const project = {
      id: this.domain.ids(),
      name: String(body.name).trim(),
      categoryId: String(body.categoryId),
      archivedAt: null,
    };
    repos.projects.insert(project);
    return ok({ project: presentProject(project) });
  }

  private projectRename(body: Payload, repos: QuadrantRepositories): Envelope {
    const project = this.requireProject(String(body.projectId), repos);
    project.name = String(body.name).trim();
    repos.projects.update(project);
    return ok({ project: presentProject(project) });
  }

  private projectMove(body: Payload, repos: QuadrantRepositories): Envelope {
    const project = this.requireProject(String(body.projectId), repos);
    this.requireCategory(String(body.categoryId), repos);
    project.categoryId = String(body.categoryId);
    repos.projects.update(project);
    return ok({ project: presentProject(project) });
  }

  private projectArchive(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const project = this.requireProject(String(body.projectId), repos);
    project.archivedAt = nowIso;
    repos.projects.update(project);
    return ok({ project: presentProject(project) });
  }

  private projectUnarchive(
    body: Payload,
    repos: QuadrantRepositories,
  ): Envelope {
    const project = this.requireProject(String(body.projectId), repos);
    project.archivedAt = null;
    repos.projects.update(project);
    return ok({ project: presentProject(project) });
  }

  private templateCreate(body: Payload, repos: QuadrantRepositories): Envelope {
    const template = {
      id: this.domain.ids(),
      name: String(body.name).trim(),
      isDefault: false,
      archivedAt: null,
    };
    repos.templates.insert(template);
    const slots = this.writeTemplateSlots(
      template.id,
      body.slots as Payload[],
      repos,
    );
    return ok({ template: presentTemplate(template, slots) });
  }

  private templateDuplicate(
    body: Payload,
    repos: QuadrantRepositories,
  ): Envelope {
    const source = this.requireTemplate(String(body.templateId), repos);
    const copy = {
      id: this.domain.ids(),
      name: String(body.name ?? `${source.name} (copia)`),
      isDefault: false,
      archivedAt: null,
    };
    repos.templates.insert(copy);
    const slots = repos.templates.slots(source.id).map((slot) => {
      const next = { ...slot, id: this.domain.ids(), templateId: copy.id };
      repos.templates.insertSlot(next);
      return next;
    });
    return ok({ template: presentTemplate(copy, slots) });
  }

  private templateUpdate(body: Payload, repos: QuadrantRepositories): Envelope {
    const template = this.requireTemplate(String(body.templateId), repos);
    if (body.name) {
      template.name = String(body.name);
    }
    repos.templates.update(template);
    let slots = repos.templates.slots(template.id);
    if (Array.isArray(body.slots)) {
      repos.templates.deleteSlots(template.id);
      slots = this.writeTemplateSlots(
        template.id,
        body.slots as Payload[],
        repos,
      );
    }
    return ok({ template: presentTemplate(template, slots) });
  }

  private templateArchive(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const template = this.requireTemplate(String(body.templateId), repos);
    if (template.isDefault) {
      throw conflictError('No se puede archivar la plantilla predeterminada');
    }
    template.archivedAt = nowIso;
    repos.templates.update(template);
    return ok({
      template: presentTemplate(template, repos.templates.slots(template.id)),
    });
  }

  private weekOpen(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const open = repos.weeks.open();
    const timezone = repos.settings.get().timezone;
    const weekStart = body.weekStart
      ? mondayOf(String(body.weekStart))
      : currentMonday(this.domain.clock, timezone);
    if (open && open.weekStart !== weekStart) {
      throw conflictError('Solo puede haber una semana abierta');
    }
    if (open && open.weekStart === weekStart) {
      return ok({
        week: presentWeek(
          open,
          repos.weeks.slots(open.id),
          repos.blocks.forWeek(open.id),
        ),
      });
    }
    const existing = repos.weeks.getByStart(weekStart);
    if (existing) {
      throw conflictError('Esa semana ya existe');
    }
    const plan = this.openFromTemplate(
      String(body.templateId ?? ''),
      weekStart,
      repos,
    );
    void nowIso;
    return ok({
      week: presentWeek(
        plan,
        repos.weeks.slots(plan.id),
        repos.blocks.forWeek(plan.id),
      ),
    });
  }

  private weekReview(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const timezone = repos.settings.get().timezone;
    const currentStart = reviewWeekStart(
      todayIso(this.domain.clock, timezone),
      body.targetWeekStart as string | undefined,
    );
    const open = repos.weeks.open();
    if (open && currentStart <= open.weekStart) {
      throw conflictError('La semana destino debe ser posterior a la abierta');
    }
    if (repos.weeks.getByStart(currentStart)) {
      throw conflictError('La semana destino ya existe');
    }
    if (open) {
      for (const block of repos.blocks.forWeek(open.id)) {
        if (block.status === 'planned') {
          block.status = 'missed';
          repos.blocks.update(block);
        }
      }
      open.status = 'closed';
      open.closedAt = nowIso;
      repos.weeks.update(open);
    }
    const resumedTaskIds: string[] = [];
    for (const item of repos.postponements.pending()) {
      if (item.resumeWeekStart <= currentStart) {
        const task = repos.tasks.get(item.taskId);
        if (task && task.status === 'snoozed') {
          task.status = statusAfterSnoozeResume(task);
          task.snoozeOrigin = null;
          task.updatedAt = nowIso;
          repos.tasks.update(task);
          resumedTaskIds.push(task.id);
        }
        item.resumedAt = nowIso;
        repos.postponements.update(item);
      }
    }
    const plan = this.openFromTemplate(
      String(body.templateId ?? ''),
      currentStart,
      repos,
    );
    return ok({
      week: presentWeek(
        plan,
        repos.weeks.slots(plan.id),
        repos.blocks.forWeek(plan.id),
        resumedTaskIds,
      ),
    });
  }

  private weekCurrent(repos: QuadrantRepositories): Envelope {
    const open = repos.weeks.open();
    const timezone = repos.settings.get().timezone;
    const calendar = { timezone, today: todayIso(this.domain.clock, timezone) };
    if (!open) {
      return ok({ week: { ...presentWeek(null, [], []), ...calendar } });
    }
    return ok({
      week: {
        ...presentWeek(
          open,
          repos.weeks.slots(open.id),
          repos.blocks.forWeek(open.id),
        ),
        ...calendar,
      },
    });
  }

  private weekAdjust(body: Payload, repos: QuadrantRepositories): Envelope {
    const open = body.weekPlanId
      ? this.requireWeek(String(body.weekPlanId), repos)
      : repos.weeks.open();
    if (!open || open.status !== 'open') {
      throw conflictError('No hay una semana abierta para ajustar');
    }
    for (const operation of body.operations as Payload[]) {
      const op = String(operation.op);
      if (op === 'add') {
        const draft = normalizeTemplateSlot({
          weekday: Number(operation.weekday),
          order: Number(operation.order ?? 99),
          kind: operation.kind as SlotKind,
          durationMinutes: operation.durationMinutes as number | undefined,
          startTime: (operation.startTime as string | null) ?? null,
        });
        repos.weeks.insertSlot({
          id: this.domain.ids(),
          weekPlanId: open.id,
          ...draft,
        });
      } else if (op === 'remove') {
        const slotId = String(operation.slotId);
        if (!repos.weeks.slots(open.id).some((slot) => slot.id === slotId)) {
          throw notFoundError('Slot no encontrado en la semana abierta');
        }
        const active = repos.blocks
          .forSlot(slotId)
          .filter(
            (block) =>
              block.status === 'planned' || block.status === 'executed',
          );
        if (active.length > 0) {
          throw conflictError('No se puede quitar un slot con bloques activos');
        }
        repos.weeks.deleteSlot(slotId);
      } else if (op === 'move' || op === 'change') {
        const slots = repos.weeks.slots(open.id);
        const current = slots.find((slot) => slot.id === operation.slotId);
        if (!current) {
          throw notFoundError('Slot no encontrado');
        }
        if (
          repos.blocks
            .forSlot(current.id)
            .some(
              (block) =>
                block.status === 'planned' || block.status === 'executed',
            )
        ) {
          throw conflictError(
            'No se puede cambiar un slot con bloques activos',
          );
        }
        if (operation.weekday) {
          current.weekday = Number(operation.weekday);
        }
        if (operation.order) {
          current.order = Number(operation.order);
        }
        if (operation.kind) {
          current.kind = operation.kind as SlotKind;
          if (current.kind === 'project') {
            current.durationMinutes = PROJECT_MINUTES;
          }
        }
        if (operation.durationMinutes && current.kind === 'deep') {
          current.durationMinutes = Number(operation.durationMinutes);
        }
        if ('startTime' in operation) {
          current.startTime = (operation.startTime as string | null) ?? null;
        }
        repos.weeks.updateSlot({
          ...current,
          ...normalizeTemplateSlot(current),
        });
      }
    }
    return ok({
      week: presentWeek(
        open,
        repos.weeks.slots(open.id),
        repos.blocks.forWeek(open.id),
      ),
    });
  }

  private planPropose(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const week = body.weekPlanId
      ? this.requireWeek(String(body.weekPlanId), repos)
      : repos.weeks.open();
    if (!week || week.status !== 'open') {
      throw conflictError('No hay una semana abierta');
    }
    const timezone = repos.settings.get().timezone;
    const proposal = {
      ...proposePlan(
        {
          today: todayIso(this.domain.clock, timezone),
          weekStart: week.weekStart,
          reservations: body.reservations as PlanReservation[] | undefined,
          tasks: repos.tasks.list(),
          slots: repos.weeks.slots(week.id),
          blocks: repos.blocks.list(),
          hiddenTaskIds: hiddenTaskIds(repos),
        },
        this.domain.ids(),
        week.id,
        nowIso,
      ),
      acceptedAt: null,
    };
    repos.proposals.insert(proposal);
    return ok({
      proposal: {
        id: proposal.id,
        weekPlanId: proposal.weekPlanId,
        accepted: false,
        reservations: proposal.reservations,
        assignments: proposal.assignments,
        unmatched: proposal.unmatched,
        emptySlots: proposal.emptySlots,
      },
    });
  }

  private planAccept(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const proposal = repos.proposals.get(String(body.proposalId));
    if (!proposal) {
      throw notFoundError('Propuesta no encontrada');
    }
    if (proposal.acceptedAt) {
      return ok({
        proposal: {
          id: proposal.id,
          weekPlanId: proposal.weekPlanId,
          accepted: true,
          reservations: proposal.reservations,
          assignments: proposal.assignments,
          unmatched: proposal.unmatched,
          emptySlots: proposal.emptySlots,
        },
      });
    }
    const week = repos.weeks.open();
    if (!week || week.id !== proposal.weekPlanId) {
      throw conflictError('La semana de la propuesta ya no está abierta');
    }
    try {
      for (const assignment of proposal.assignments) {
        const block = this.scheduleIntoSlot(
          this.requireTask(assignment.taskId, repos),
          assignment.slotId,
          repos,
          nowIso,
        );
        if (block.nominalMinutes !== assignment.nominalMinutes) {
          throw conflictError(
            'La duración ha cambiado; genera una nueva propuesta',
          );
        }
      }
    } catch (error) {
      if (error instanceof DomainError) {
        throw conflictError(
          `La propuesta ya no es compatible: ${error.message}`,
        );
      }
      throw error;
    }
    proposal.acceptedAt = nowIso;
    repos.proposals.update(proposal);
    return ok({
      proposal: {
        id: proposal.id,
        weekPlanId: proposal.weekPlanId,
        accepted: true,
        reservations: proposal.reservations,
        assignments: proposal.assignments,
        unmatched: proposal.unmatched,
        emptySlots: proposal.emptySlots,
      },
    });
  }

  private blockSchedule(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const taskOrEnvelope = body.taskId
      ? this.requireTask(String(body.taskId), repos)
      : this.findTask(body, repos);
    if (isEnvelope(taskOrEnvelope)) {
      return taskOrEnvelope;
    }
    const task = taskOrEnvelope as Task;
    const week = body.weekPlanId
      ? this.requireWeek(String(body.weekPlanId), repos)
      : repos.weeks.open();
    if (!week || week.status !== 'open') {
      throw conflictError('No hay una semana abierta');
    }
    const slotId = body.slotId
      ? String(body.slotId)
      : this.resolveSlotId(week, body, repos);
    const block = this.scheduleIntoSlot(task, slotId, repos, nowIso);
    return ok({ block: presentBlock(block) });
  }

  private blockExecute(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const block = repos.blocks.get(String(body.blockId));
    if (!block) {
      throw notFoundError('Bloque no encontrado');
    }
    if (block.status !== 'planned') {
      throw conflictError('Solo se puede ejecutar un bloque planned');
    }
    const week = this.requireWeek(block.weekPlanId, repos);
    const slot = repos.weeks
      .slots(week.id)
      .find((item) => item.id === block.slotId);
    if (
      week.status !== 'open' ||
      !slot ||
      addDays(week.weekStart, slot.weekday - 1) >
        todayIso(this.domain.clock, repos.settings.get().timezone)
    ) {
      throw conflictError(
        'El bloque no se puede ejecutar antes de su día ni en una semana cerrada',
      );
    }
    block.status = 'executed';
    block.executedAt = nowIso;
    repos.blocks.update(block);
    return ok({ block: presentBlock(block) });
  }

  private blockCancel(
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Envelope {
    const block = repos.blocks.get(String(body.blockId));
    if (!block) {
      throw notFoundError('Bloque no encontrado');
    }
    if (block.status !== 'planned') {
      throw conflictError('Solo se puede cancelar un bloque planned');
    }
    block.status = 'cancelled';
    block.cancelledAt = nowIso;
    repos.blocks.update(block);
    return ok({ block: presentBlock(block) });
  }

  private report(body: Payload, repos: QuadrantRepositories): Envelope {
    const timezone = repos.settings.get().timezone;
    const from = (body.from as string | undefined) ?? '0000-01-01';
    const to = (body.to as string | undefined) ?? '9999-12-31';
    const tasks = repos.tasks.list();
    const projects = repos.projects.list(true);
    const categories = repos.categories.list(true);
    const blocks = repos.blocks.list().filter((block) => {
      const stamp = block.executedAt ?? block.cancelledAt ?? block.createdAt;
      const day = ymdInTimeZone(new Date(stamp), timezone);
      return day >= from && day <= to;
    });
    const filtered = blocks.filter((block) => {
      const task = tasks.find((item) => item.id === block.taskId);
      if (!task) {
        return false;
      }
      if (body.taskId && task.id !== body.taskId) {
        return false;
      }
      if (body.projectId && task.projectId !== body.projectId) {
        return false;
      }
      const project = task.projectId
        ? projects.find((item) => item.id === task.projectId)
        : null;
      const categoryId = project?.categoryId ?? task.categoryId;
      if (body.categoryId && categoryId !== body.categoryId) {
        return false;
      }
      return true;
    });
    const totals = countBlocks(filtered);
    const groups = [];
    if (body.taskId) {
      const task = tasks.find((item) => item.id === body.taskId);
      groups.push({
        id: body.taskId,
        name: task?.title ?? String(body.taskId),
        kind: 'task' as const,
        ...countBlocks(filtered),
      });
    } else if (body.projectId) {
      const project = projects.find((item) => item.id === body.projectId);
      groups.push({
        id: String(body.projectId),
        name: project?.name ?? String(body.projectId),
        kind: 'project' as const,
        ...countBlocks(filtered),
      });
    } else if (body.categoryId) {
      const category = categories.find((item) => item.id === body.categoryId);
      groups.push({
        id: String(body.categoryId),
        name: category?.name ?? String(body.categoryId),
        kind: 'category' as const,
        ...countBlocks(filtered),
      });
    } else {
      groups.push(
        ...projects.map((project) => ({
          id: project.id,
          name: project.name,
          kind: 'project' as const,
          ...countBlocks(
            filtered.filter(
              (block) =>
                tasks.find((task) => task.id === block.taskId)?.projectId ===
                project.id,
            ),
          ),
        })),
      );
    }
    return ok({ totals, groups });
  }

  private applyClassification(
    task: Task,
    body: Payload,
    repos: QuadrantRepositories,
    nowIso: string,
  ): Task {
    const next = this.assignProjectOrCategory({ ...task }, body, repos);
    next.urgent = Boolean(body.urgent);
    next.important = Boolean(body.important);
    next.workType = (body.workType as WorkType | undefined) ?? next.workType;
    if (!next.workType) {
      throw validationError('El procesamiento requiere un tipo de trabajo');
    }
    if (next.workType === 'short') {
      const minutes = Number(body.nominalMinutes ?? next.nominalMinutes ?? 30);
      assertShortDuration(minutes);
      next.nominalMinutes = minutes;
    } else {
      next.nominalMinutes = declaredTaskDuration(
        next.workType,
        body.nominalMinutes as number | null,
      );
    }
    if ('deadline' in body)
      next.deadline = (body.deadline as string | null) ?? null;
    next.availableOn =
      (body.availableOn as string | undefined) ?? next.availableOn;
    if (typeof body.notes === 'string') {
      next.notes = body.notes;
    }
    next.updatedAt = nowIso;
    assertCategoryInvariant(next);
    return next;
  }

  private assignProjectOrCategory(
    task: Task,
    body: Payload,
    repos: QuadrantRepositories,
  ): Task {
    if ('projectId' in body) {
      const projectId = body.projectId as string | null;
      if (projectId) {
        const project = this.requireProject(projectId, repos);
        return applyProjectAssociation(task, project);
      }
      return applyProjectAssociation(
        { ...task, categoryId: (body.categoryId as string | null) ?? null },
        null,
      );
    }
    if ('categoryId' in body) {
      if (task.projectId) {
        throw conflictError(
          'Una tarea con proyecto no puede tener categoría directa',
        );
      }
      const categoryId = body.categoryId as string | null;
      if (categoryId) {
        this.requireCategory(categoryId, repos);
      }
      task.categoryId = categoryId;
    }
    return task;
  }

  private scheduleIntoSlot(
    task: Task,
    slotId: string,
    repos: QuadrantRepositories,
    nowIso: string,
  ) {
    if (task.status !== 'backlog') {
      throw conflictError('Solo se pueden planificar tareas del backlog');
    }
    const categories = new Map(
      repos.categories.list(true).map((item) => [item.id, item]),
    );
    const project = task.projectId ? repos.projects.get(task.projectId) : null;
    assertTaskVisibleForPlanning(task, project, categories);
    const week = repos.weeks.open();
    const slot = (week ? repos.weeks.slots(week.id) : []).find(
      (item) => item.id === slotId,
    );
    if (!week || !slot) {
      throw notFoundError('Slot no encontrado en la semana abierta');
    }
    const date = addDays(week.weekStart, slot.weekday - 1);
    if (
      date < todayIso(this.domain.clock, repos.settings.get().timezone) ||
      (task.availableOn && task.availableOn > date)
    ) {
      throw conflictError('La tarea no está disponible en la fecha del bloque');
    }
    const occupancy = {
      slot,
      blocks: repos.blocks.forSlot(slot.id),
    };
    const tasksById = new Map(
      repos.tasks.list().map((item) => [item.id, item]),
    );
    const minutes = assertAssignable(task, occupancy, tasksById);
    assertNoDoubleBookingForNonProject(task, repos.blocks.forTask(task.id));
    const block = {
      id: this.domain.ids(),
      weekPlanId: week.id,
      slotId: slot.id,
      taskId: task.id,
      status: 'planned' as const,
      nominalMinutes: minutes,
      createdAt: nowIso,
      executedAt: null,
      cancelledAt: null,
    };
    repos.blocks.insert(block);
    this.resetPostponements(task.id, 'schedule', repos, nowIso);
    return block;
  }

  private resolveSlotId(
    week: WeekPlan,
    body: Payload,
    repos: QuadrantRepositories,
  ): string {
    const slots = repos.weeks.slots(week.id);
    const kind = body.slotKind as SlotKind | undefined;
    const date = body.date as string | undefined;
    let candidates = slots;
    if (date) {
      candidates = candidates.filter(
        (slot) => addDays(week.weekStart, slot.weekday - 1) === date,
      );
    }
    if (kind) {
      candidates = candidates.filter((slot) => slot.kind === kind);
    }
    const empty = candidates.filter(
      (slot) =>
        repos.blocks
          .forSlot(slot.id)
          .filter(
            (block) =>
              block.status === 'planned' || block.status === 'executed',
          ).length === 0,
    );
    const pool = empty.length > 0 ? empty : candidates;
    if (pool.length === 0) {
      throw notFoundError('No hay un slot compatible para esa fecha');
    }
    if (pool.length > 1 && !kind) {
      throw new ClarificationError('Hay varios slots posibles', [
        'Indica slotId o slotKind',
      ]);
    }
    return pool[0].id;
  }

  private openFromTemplate(
    templateId: string,
    weekStart: string,
    repos: QuadrantRepositories,
  ): WeekPlan {
    const template = templateId
      ? this.requireTemplate(templateId, repos)
      : repos.templates.default();
    if (!template || template.archivedAt) {
      throw notFoundError('No hay una plantilla disponible');
    }
    const plan: WeekPlan = {
      id: this.domain.ids(),
      weekStart,
      templateId: template.id,
      status: 'open',
      closedAt: null,
    };
    repos.weeks.insert(plan);
    for (const slot of repos.templates.slots(template.id)) {
      repos.weeks.insertSlot({
        id: this.domain.ids(),
        weekPlanId: plan.id,
        weekday: slot.weekday,
        order: slot.order,
        kind: slot.kind,
        durationMinutes: slot.durationMinutes,
        startTime: slot.startTime,
      });
    }
    return plan;
  }

  private writeTemplateSlots(
    templateId: string,
    drafts: Payload[],
    repos: QuadrantRepositories,
  ) {
    return drafts.map((draft) => {
      const normalized = normalizeTemplateSlot({
        weekday: Number(draft.weekday),
        order: Number(draft.order),
        kind: draft.kind as SlotKind,
        durationMinutes: draft.durationMinutes as number | undefined,
        startTime: (draft.startTime as string | null) ?? null,
      });
      const slot = { id: this.domain.ids(), templateId, ...normalized };
      repos.templates.insertSlot(slot);
      return slot;
    });
  }

  private resetPostponements(
    taskId: string,
    reason: 'process' | 'schedule' | 'complete' | 'archive',
    repos: QuadrantRepositories,
    nowIso: string,
  ) {
    repos.postponements.insertReset({
      id: this.domain.ids(),
      taskId,
      reason,
      createdAt: nowIso,
    });
  }

  private requireTask(id: string, repos: QuadrantRepositories): Task {
    const task = repos.tasks.get(id);
    if (!task) {
      throw notFoundError('Tarea no encontrada');
    }
    return task;
  }

  private requireCategory(id: string, repos: QuadrantRepositories) {
    const category = repos.categories.get(id);
    if (!category) {
      throw notFoundError('Categoría no encontrada');
    }
    return category;
  }

  private requireProject(id: string, repos: QuadrantRepositories) {
    const project = repos.projects.get(id);
    if (!project) {
      throw notFoundError('Proyecto no encontrado');
    }
    return project;
  }

  private requireTemplate(id: string, repos: QuadrantRepositories) {
    const template = repos.templates.get(id);
    if (!template) {
      throw notFoundError('Plantilla no encontrada');
    }
    return template;
  }

  private requireWeek(id: string, repos: QuadrantRepositories) {
    const week = repos.weeks.get(id);
    if (!week) {
      throw notFoundError('Semana no encontrada');
    }
    return week;
  }

  private findTask(
    body: Payload,
    repos: QuadrantRepositories,
  ): Task | Envelope {
    if (body.taskId) {
      return this.requireTask(String(body.taskId), repos);
    }
    if (!body.title) {
      return validation('Indica taskId o title');
    }
    const matches = repos.tasks.findByTitle(String(body.title));
    if (matches.length === 0) {
      throw notFoundError(`No hay una tarea llamada ${body.title}`);
    }
    if (matches.length > 1) {
      return clarification(
        'Hay varias tareas con ese título',
        matches.map((item) => item.id),
      );
    }
    return matches[0];
  }

  private confirmationSummary(
    capabilityId: string,
    body: Payload,
    repos: QuadrantRepositories,
  ): string {
    if (capabilityId === 'task.archive') {
      const task = repos.tasks.get(String(body.taskId));
      return `Archivar la tarea «${task?.title ?? body.taskId}». Esta acción es reversible.`;
    }
    if (capabilityId === 'category.archive') {
      const category = repos.categories.get(String(body.categoryId));
      return `Archivar la categoría «${category?.name ?? body.categoryId}». Sus tareas quedarán ocultas.`;
    }
    if (capabilityId === 'project.archive') {
      const project = repos.projects.get(String(body.projectId));
      return `Archivar el proyecto «${project?.name ?? body.projectId}». Sus tareas quedarán ocultas.`;
    }
    if (capabilityId === 'template.archive') {
      const template = repos.templates.get(String(body.templateId));
      return `Archivar la plantilla «${template?.name ?? body.templateId}».`;
    }
    if (capabilityId === 'week.review') {
      const target = reviewWeekStart(
        todayIso(this.domain.clock, repos.settings.get().timezone),
        body.targetWeekStart as string | undefined,
      );
      const open = repos.weeks.open();
      return `${open ? `Cerrar ahora la semana del ${open.weekStart} y marcar sus bloques pendientes como no realizados. ` : ''}Abrir la semana del ${target} al ${addDays(target, 6)}. Las tareas abiertas no se reprogramarán automáticamente.`;
    }
    if (capabilityId === 'plan.accept') {
      return `Aceptar la propuesta ${body.proposalId} y crear los bloques planificados.`;
    }
    return `Confirmar ${capabilityId}`;
  }
}

function isEnvelope(value: Task | Envelope): value is Envelope {
  return !('title' in value) && 'status' in value;
}

class ClarificationError extends Error {
  constructor(
    message: string,
    public questions: string[],
  ) {
    super(message);
    this.name = 'ClarificationError';
  }
}

function countBlocks(blocks: { status: string; nominalMinutes: number }[]) {
  const planned = blocks.filter((item) => item.status === 'planned').length;
  const executed = blocks.filter((item) => item.status === 'executed');
  const cancelled = blocks.filter((item) => item.status === 'cancelled').length;
  const missed = blocks.filter((item) => item.status === 'missed').length;
  return {
    planned,
    executed: executed.length,
    cancelled,
    missed,
    executedMinutes: executed.reduce(
      (sum, item) => sum + item.nominalMinutes,
      0,
    ),
  };
}

export function createQuadrantApp(
  uow: UnitOfWork,
  domain?: DomainContext,
): QuadrantApp {
  return new QuadrantApp(uow, domain);
}
