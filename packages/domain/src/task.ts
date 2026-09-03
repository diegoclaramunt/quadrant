import type { Category, Project, Task } from './types';
import { conflictError, validationError } from './errors';

export function effectiveCategoryId(
  task: Pick<Task, 'projectId' | 'categoryId'>,
  project: Project | null,
): string | null {
  if (task.projectId) {
    return project?.categoryId ?? null;
  }
  return task.categoryId;
}

export function applyProjectAssociation(
  task: Task,
  project: Project | null,
): Task {
  if (project) {
    return { ...task, projectId: project.id, categoryId: null };
  }
  return { ...task, projectId: null };
}

export function assertCategoryInvariant(task: Task): void {
  if (task.projectId && task.categoryId) {
    throw conflictError(
      'Una tarea con proyecto no puede tener categoría directa',
    );
  }
}

export function isParentArchived(
  task: Task,
  project: Project | null,
  categoryById: Map<string, Category>,
): boolean {
  if (project?.archivedAt) {
    return true;
  }
  const categoryId = project?.categoryId ?? task.categoryId;
  if (!categoryId) {
    return false;
  }
  return Boolean(categoryById.get(categoryId)?.archivedAt);
}

export function assertTaskVisibleForPlanning(
  task: Task,
  project: Project | null,
  categoryById: Map<string, Category>,
): void {
  if (isParentArchived(task, project, categoryById)) {
    throw conflictError(
      'Las tareas de un padre archivado no admiten nuevos bloques',
    );
  }
}

export function resolveTaskTitle(title: string, originalText: string): string {
  const trimmed = title.trim();
  if (trimmed) {
    return trimmed;
  }
  const fallback = originalText.trim();
  if (!fallback) {
    throw validationError('La captura necesita un título o texto original');
  }
  return fallback.slice(0, 200);
}
