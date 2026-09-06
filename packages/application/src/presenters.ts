import {
  consecutivePostponements,
  effectiveCategoryId,
  eisenhowerQuadrant,
  isParentArchived,
  shouldSuggestArchive,
  weekCapacity,
  type Category,
  type Project,
  type Task,
  type TemplateSlot,
  type WeekPlan,
  type WeekSlot,
  type WeekTemplate,
  type WorkBlock,
} from '@quadrant/domain';
import type { QuadrantRepositories } from '@quadrant/storage';

export function presentTask(task: Task, repos: QuadrantRepositories) {
  const project = task.projectId ? repos.projects.get(task.projectId) : null;
  const categories = new Map(
    repos.categories.list(true).map((item) => [item.id, item]),
  );
  const postponements = repos.postponements.forTask(task.id);
  const resets = repos.postponements.resets(task.id);
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    originalText: task.originalText,
    channel: task.channel,
    projectId: task.projectId,
    categoryId: task.categoryId,
    effectiveCategoryId: effectiveCategoryId(task, project),
    status: task.status,
    urgent: task.urgent,
    important: task.important,
    quadrant: eisenhowerQuadrant(task.urgent, task.important),
    workType: task.workType,
    nominalMinutes: task.nominalMinutes,
    deadline: task.deadline,
    availableOn: task.availableOn,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    processedAt: task.processedAt,
    completedAt: task.completedAt,
    archivedAt: task.archivedAt,
    consecutivePostponements: consecutivePostponements(postponements, resets),
    suggestArchive: shouldSuggestArchive(postponements, resets),
    hidden: isParentArchived(task, project, categories),
  };
}

export function presentCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    archived: Boolean(category.archivedAt),
  };
}

export function presentProject(project: Project) {
  return {
    id: project.id,
    name: project.name,
    categoryId: project.categoryId,
    archived: Boolean(project.archivedAt),
  };
}

export function presentSlot(slot: TemplateSlot | WeekSlot) {
  return {
    id: slot.id,
    weekday: slot.weekday,
    order: slot.order,
    kind: slot.kind,
    durationMinutes: slot.durationMinutes,
    startTime: slot.startTime,
  };
}

export function presentBlock(block: WorkBlock) {
  return {
    id: block.id,
    weekPlanId: block.weekPlanId,
    slotId: block.slotId,
    taskId: block.taskId,
    status: block.status,
    nominalMinutes: block.nominalMinutes,
  };
}

export function presentTemplate(template: WeekTemplate, slots: TemplateSlot[]) {
  return {
    id: template.id,
    name: template.name,
    isDefault: template.isDefault,
    archived: Boolean(template.archivedAt),
    slots: slots.map(presentSlot),
  };
}

export function presentWeek(
  plan: WeekPlan | null,
  slots: WeekSlot[],
  blocks: WorkBlock[],
  resumedTaskIds: string[] = [],
) {
  return {
    id: plan?.id ?? null,
    weekStart: plan?.weekStart ?? null,
    status: plan?.status ?? null,
    templateId: plan?.templateId ?? null,
    slots: slots.map(presentSlot),
    blocks: blocks.map(presentBlock),
    resumedTaskIds,
    capacity: weekCapacity(slots, blocks),
  };
}

export function visibleInbox(repos: QuadrantRepositories) {
  return repos.tasks
    .list()
    .filter((task) => task.status === 'inbox')
    .map((task) => presentTask(task, repos))
    .filter((task) => !task.hidden);
}

export function visibleBacklog(
  repos: QuadrantRepositories,
  filters: { categoryId?: string; projectId?: string } = {},
) {
  return repos.tasks
    .list()
    .filter((task) => task.status === 'backlog')
    .map((task) => presentTask(task, repos))
    .filter((task) => !task.hidden)
    .filter(
      (task) => !filters.projectId || task.projectId === filters.projectId,
    )
    .filter(
      (task) =>
        !filters.categoryId || task.effectiveCategoryId === filters.categoryId,
    );
}

export function hiddenTaskIds(repos: QuadrantRepositories): Set<string> {
  return new Set(
    repos.tasks
      .list()
      .map((task) => presentTask(task, repos))
      .filter((task) => task.hidden)
      .map((task) => task.id),
  );
}
