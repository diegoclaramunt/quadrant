import type { Task, TaskStatus } from './types';
import { conflictError } from './errors';

export function canProcess(task: Task): void {
  if (task.status !== 'inbox') {
    throw conflictError('Solo se puede procesar una tarea en inbox');
  }
}

export function canPostpone(task: Task): 'inbox' | 'backlog' {
  if (task.status === 'inbox' || task.status === 'backlog') {
    return task.status;
  }
  throw conflictError('Solo se puede posponer desde inbox o backlog');
}

export function canComplete(task: Task): void {
  if (task.status === 'completed') {
    throw conflictError('La tarea ya está completada');
  }
  if (task.status === 'archived') {
    throw conflictError('No se puede completar una tarea archivada');
  }
}

export function canArchive(task: Task): void {
  if (task.status === 'archived') {
    throw conflictError('La tarea ya está archivada');
  }
}

export function canUnarchive(task: Task): void {
  if (task.status !== 'archived') {
    throw conflictError('Solo se puede desarchivar una tarea archivada');
  }
}

export function originAfterUnarchive(task: Task): TaskStatus {
  return task.previousStatus ?? 'backlog';
}

export function statusAfterSnoozeResume(task: Task): TaskStatus {
  return task.snoozeOrigin ?? 'backlog';
}
