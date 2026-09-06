import type { WorkType, SlotKind } from '@quadrant/domain';

export const workTypes: { value: WorkType; label: string }[] = [
  { value: 'brief', label: 'Rápida · 10 min' },
  { value: 'short', label: 'Corta · menos de 1 h' },
  { value: 'deep', label: 'Concentración · un bloque' },
  { value: 'project', label: 'Sesión abierta · 2 h' },
];
export function workLabel(type: WorkType | null | undefined): string {
  return (
    workTypes.find((item) => item.value === type)?.label ?? 'Sin clasificar'
  );
}
export function slotLabel(kind: SlotKind): string {
  return kind === 'project'
    ? 'Sesión abierta'
    : 'Concentración o tareas cortas';
}
export const workHelp =
  'Una tarea de cualquier tipo puede pertenecer a un proyecto. Elige Sesión abierta para dedicarle dos horas y continuar otro día. Ejecutar un bloque no completa la tarea.';
