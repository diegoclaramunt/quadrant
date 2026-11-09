import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemasDir = join(root, 'packages/capabilities/schemas');
mkdirSync(schemasDir, { recursive: true });

const CAPABILITIES = [
  [
    'inbox.capture_many',
    'Captura una o varias ideas en la bandeja',
    'write',
    'none',
    ['Captura estas ideas: revisar factura y llamar a Ana'],
  ],
  [
    'inbox.list',
    'Lista la bandeja en orden de captura',
    'read',
    'none',
    ['Qué hay en la bandeja'],
  ],
  [
    'backlog.list',
    'Lista el backlog de tareas procesadas',
    'read',
    'none',
    ['Muéstrame el backlog'],
  ],
  [
    'task.get',
    'Obtiene una tarea por identificador o título',
    'read',
    'none',
    ['Cómo está Gemelo digital'],
  ],
  [
    'task.process',
    'Procesa una tarea de la bandeja y la mueve al backlog',
    'write',
    'none',
    ['Clasifica esta tarea como importante y urgente'],
  ],
  [
    'task.update',
    'Actualiza campos de una tarea abierta',
    'write',
    'none',
    ['Cambia el proyecto de esta tarea'],
  ],
  [
    'task.postpone',
    'Pospone una tarea hasta una revisión semanal',
    'write',
    'none',
    ['Déjala para la semana que viene'],
  ],
  [
    'task.complete',
    'Completa una tarea de forma binaria',
    'write',
    'none',
    ['Marca Gemelo digital como hecha'],
  ],
  [
    'task.archive',
    'Archiva una tarea con confirmación explícita',
    'destructive',
    'required',
    ['Archiva esta tarea'],
  ],
  [
    'task.unarchive',
    'Restaura una tarea archivada a su estado previo',
    'write',
    'none',
    ['Recupera esa tarea archivada'],
  ],
  [
    'category.create',
    'Crea una categoría',
    'write',
    'none',
    ['Crea la categoría Warpcom'],
  ],
  [
    'category.rename',
    'Renombra una categoría',
    'write',
    'none',
    ['Renombra Five a Five Consulting'],
  ],
  [
    'category.archive',
    'Archiva una categoría',
    'destructive',
    'required',
    ['Archiva la categoría personal'],
  ],
  [
    'category.unarchive',
    'Desarchiva una categoría',
    'write',
    'none',
    ['Recupera la categoría personal'],
  ],
  [
    'category.list',
    'Lista categorías',
    'read',
    'none',
    ['Lista las categorías'],
  ],
  [
    'project.create',
    'Crea un proyecto en una categoría',
    'write',
    'none',
    ['Crea el proyecto Gemelo digital en Proyectos personales'],
  ],
  [
    'project.rename',
    'Renombra un proyecto',
    'write',
    'none',
    ['Renombra Gemelo digital'],
  ],
  [
    'project.move',
    'Mueve un proyecto a otra categoría',
    'write',
    'none',
    ['Mueve Gemelo digital a Proyectos vendibles'],
  ],
  [
    'project.archive',
    'Archiva un proyecto',
    'destructive',
    'required',
    ['Archiva el proyecto antiguo'],
  ],
  [
    'project.unarchive',
    'Desarchiva un proyecto',
    'write',
    'none',
    ['Recupera el proyecto antiguo'],
  ],
  ['project.list', 'Lista proyectos', 'read', 'none', ['Lista los proyectos']],
  [
    'template.create',
    'Crea una plantilla semanal',
    'write',
    'none',
    ['Crea una plantilla de fines de semana'],
  ],
  [
    'template.duplicate',
    'Duplica una plantilla',
    'write',
    'none',
    ['Duplica la plantilla laborable'],
  ],
  [
    'template.update',
    'Actualiza una plantilla sin alterar semanas ya creadas',
    'write',
    'none',
    ['Pon los bloques deep a 60 minutos en la plantilla'],
  ],
  [
    'template.archive',
    'Archiva una plantilla',
    'destructive',
    'required',
    ['Archiva esa plantilla'],
  ],
  [
    'template.list',
    'Lista plantillas semanales',
    'read',
    'none',
    ['Qué plantillas tengo'],
  ],
  [
    'week.open',
    'Abre una semana copiando una plantilla',
    'write',
    'none',
    ['Abre la semana actual'],
  ],
  [
    'week.review',
    'Cierra la semana abierta y abre la actual o siguiente según targetWeekStart, sin reabrir semanas existentes',
    'write',
    'required',
    [
      'Haz la revisión semanal',
      'Cierra el viernes y prepara el lunes siguiente',
    ],
  ],
  [
    'week.current',
    'Consulta la semana abierta y sus slots',
    'read',
    'none',
    ['Cómo está la semana'],
  ],
  [
    'week.adjust_slots',
    'Ajusta slots solo de la semana abierta',
    'write',
    'none',
    ['Quita el segundo bloque deep del viernes'],
  ],
  [
    'plan.propose',
    'Propone sin aplicar: reservas explícitas primero; vencidas y fechas de la semana, cuadrante y antigüedad después. Respeta disponibilidad por día',
    'read',
    'none',
    [
      'Propón el plan de la semana',
      'Reserva esta tarea importante en este bloque y completa el resto',
    ],
  ],
  [
    'plan.accept',
    'Acepta una propuesta de planificación',
    'write',
    'required',
    ['Acepta esa planificación'],
  ],
  [
    'block.schedule',
    'Asigna una tarea a un slot compatible',
    'write',
    'none',
    ['Pon Gemelo digital en un bloque de proyecto mañana'],
  ],
  [
    'block.execute',
    'Marca un bloque como ejecutado',
    'write',
    'none',
    ['He hecho el bloque de Gemelo digital'],
  ],
  [
    'block.cancel',
    'Cancela un bloque planificado',
    'write',
    'none',
    ['Cancela ese bloque'],
  ],
  [
    'report.nominal_time',
    'Reporta bloques y minutos nominales',
    'read',
    'none',
    ['Cuántas horas nominales llevo en Gemelo digital'],
  ],
];

const defs = {
  $id: 'https://quadrant.local/schemas/common.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $defs: {
    id: { type: 'string', minLength: 1 },
    requestId: { type: 'string', minLength: 1 },
    confirmationToken: { type: 'string', minLength: 1 },
    isoDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    channel: { type: 'string', enum: ['ui', 'api', 'mcp', 'skill', 'voice'] },
    workType: { type: 'string', enum: ['brief', 'short', 'deep', 'project'] },
    slotKind: { type: 'string', enum: ['deep', 'project'] },
    taskStatus: {
      type: 'string',
      enum: ['inbox', 'backlog', 'snoozed', 'completed', 'archived'],
    },
    blockStatus: {
      type: 'string',
      enum: ['planned', 'executed', 'cancelled', 'missed'],
    },
    quadrant: { type: 'string', enum: ['ui', 'in', 'un', 'nn'] },
    unmatchedReason: {
      type: 'string',
      enum: [
        'no_compatible_slot',
        'slot_full',
        'already_planned',
        'not_available',
      ],
    },
    task: {
      type: 'object',
      additionalProperties: false,
      required: [
        'id',
        'title',
        'status',
        'urgent',
        'important',
        'quadrant',
        'channel',
        'createdAt',
        'updatedAt',
        'consecutivePostponements',
        'suggestArchive',
        'hidden',
      ],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        notes: { type: ['string', 'null'] },
        originalText: { type: 'string' },
        channel: { $ref: '#/$defs/channel' },
        projectId: { type: ['string', 'null'] },
        categoryId: { type: ['string', 'null'] },
        effectiveCategoryId: { type: ['string', 'null'] },
        status: { $ref: '#/$defs/taskStatus' },
        urgent: { type: 'boolean' },
        important: { type: 'boolean' },
        quadrant: { $ref: '#/$defs/quadrant' },
        workType: { anyOf: [{ $ref: '#/$defs/workType' }, { type: 'null' }] },
        nominalMinutes: { type: ['integer', 'null'] },
        deadline: { type: ['string', 'null'] },
        availableOn: { type: ['string', 'null'] },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        processedAt: { type: ['string', 'null'] },
        completedAt: { type: ['string', 'null'] },
        archivedAt: { type: ['string', 'null'] },
        consecutivePostponements: { type: 'integer' },
        suggestArchive: { type: 'boolean' },
        hidden: { type: 'boolean' },
      },
    },
    category: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'name', 'archived'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        archived: { type: 'boolean' },
      },
    },
    project: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'name', 'categoryId', 'archived'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        categoryId: { type: 'string' },
        archived: { type: 'boolean' },
      },
    },
    slot: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'weekday', 'order', 'kind', 'durationMinutes'],
      properties: {
        id: { type: 'string' },
        weekday: { type: 'integer', minimum: 1, maximum: 7 },
        order: { type: 'integer' },
        kind: { $ref: '#/$defs/slotKind' },
        durationMinutes: { type: 'integer' },
        startTime: { type: ['string', 'null'] },
      },
    },
    slotDraft: {
      type: 'object',
      additionalProperties: false,
      required: ['weekday', 'order', 'kind', 'durationMinutes'],
      properties: {
        id: { type: 'string' },
        weekday: { type: 'integer', minimum: 1, maximum: 7 },
        order: { type: 'integer' },
        kind: { $ref: '#/$defs/slotKind' },
        durationMinutes: { type: 'integer' },
        startTime: { type: ['string', 'null'] },
      },
    },
    block: {
      type: 'object',
      additionalProperties: false,
      required: [
        'id',
        'weekPlanId',
        'slotId',
        'taskId',
        'status',
        'nominalMinutes',
      ],
      properties: {
        id: { type: 'string' },
        weekPlanId: { type: 'string' },
        slotId: { type: 'string' },
        taskId: { type: 'string' },
        status: { $ref: '#/$defs/blockStatus' },
        nominalMinutes: { type: 'integer' },
      },
    },
  },
};

function writeJson(file, data) {
  writeFileSync(join(schemasDir, file), `${JSON.stringify(data, null, 2)}\n`);
}

writeJson('common.json', defs);

const mutable = {
  request_id: { $ref: 'common.json#/$defs/requestId' },
  confirmation_token: { $ref: 'common.json#/$defs/confirmationToken' },
};

const inputs = {
  'inbox.capture_many': {
    type: 'object',
    additionalProperties: false,
    required: ['items'],
    properties: {
      ...mutable,
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['channel'],
          properties: {
            title: { type: 'string' },
            notes: { type: 'string' },
            originalText: { type: 'string' },
            channel: { $ref: 'common.json#/$defs/channel' },
            alreadyProcessed: { type: 'boolean' },
            urgent: { type: 'boolean' },
            important: { type: 'boolean' },
            workType: { $ref: 'common.json#/$defs/workType' },
            nominalMinutes: { type: 'integer' },
            projectId: { type: 'string' },
            categoryId: { type: 'string' },
            deadline: { $ref: 'common.json#/$defs/isoDate' },
          },
        },
      },
    },
  },
  'inbox.list': { type: 'object', additionalProperties: false, properties: {} },
  'backlog.list': {
    type: 'object',
    additionalProperties: false,
    properties: {
      categoryId: { type: 'string' },
      projectId: { type: 'string' },
      status: { type: 'string', enum: ['backlog', 'completed'] },
    },
  },
  'task.get': {
    type: 'object',
    additionalProperties: false,
    properties: {
      taskId: { type: 'string' },
      title: { type: 'string' },
    },
  },
  'task.process': {
    type: 'object',
    additionalProperties: false,
    required: ['taskId', 'urgent', 'important', 'workType'],
    properties: {
      ...mutable,
      taskId: { type: 'string' },
      urgent: { type: 'boolean' },
      important: { type: 'boolean' },
      workType: { $ref: 'common.json#/$defs/workType' },
      nominalMinutes: { type: 'integer' },
      deadline: {
        anyOf: [{ $ref: 'common.json#/$defs/isoDate' }, { type: 'null' }],
      },
      availableOn: { $ref: 'common.json#/$defs/isoDate' },
      projectId: { type: ['string', 'null'] },
      categoryId: { type: ['string', 'null'] },
      notes: { type: 'string' },
    },
  },
  'task.update': {
    type: 'object',
    additionalProperties: false,
    required: ['taskId'],
    properties: {
      ...mutable,
      taskId: { type: 'string' },
      title: { type: 'string' },
      notes: { type: ['string', 'null'] },
      urgent: { type: 'boolean' },
      important: { type: 'boolean' },
      workType: { $ref: 'common.json#/$defs/workType' },
      nominalMinutes: { type: ['integer', 'null'] },
      deadline: { type: ['string', 'null'] },
      availableOn: { type: ['string', 'null'] },
      projectId: { type: ['string', 'null'] },
      categoryId: { type: ['string', 'null'] },
    },
  },
  'task.postpone': {
    type: 'object',
    additionalProperties: false,
    required: ['taskId'],
    properties: {
      ...mutable,
      taskId: { type: 'string' },
      resumeWeekStart: { $ref: 'common.json#/$defs/isoDate' },
      weeksAhead: { type: 'integer', minimum: 1 },
    },
  },
  'task.complete': {
    type: 'object',
    additionalProperties: false,
    required: ['taskId'],
    properties: { ...mutable, taskId: { type: 'string' } },
  },
  'task.archive': {
    type: 'object',
    additionalProperties: false,
    required: ['taskId'],
    properties: { ...mutable, taskId: { type: 'string' } },
  },
  'task.unarchive': {
    type: 'object',
    additionalProperties: false,
    required: ['taskId'],
    properties: { ...mutable, taskId: { type: 'string' } },
  },
  'category.create': {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: { ...mutable, name: { type: 'string', minLength: 1 } },
  },
  'category.rename': {
    type: 'object',
    additionalProperties: false,
    required: ['categoryId', 'name'],
    properties: {
      ...mutable,
      categoryId: { type: 'string' },
      name: { type: 'string', minLength: 1 },
    },
  },
  'category.archive': {
    type: 'object',
    additionalProperties: false,
    required: ['categoryId'],
    properties: { ...mutable, categoryId: { type: 'string' } },
  },
  'category.unarchive': {
    type: 'object',
    additionalProperties: false,
    required: ['categoryId'],
    properties: { ...mutable, categoryId: { type: 'string' } },
  },
  'category.list': {
    type: 'object',
    additionalProperties: false,
    properties: { includeArchived: { type: 'boolean' } },
  },
  'project.create': {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'categoryId'],
    properties: {
      ...mutable,
      name: { type: 'string', minLength: 1 },
      categoryId: { type: 'string' },
    },
  },
  'project.rename': {
    type: 'object',
    additionalProperties: false,
    required: ['projectId', 'name'],
    properties: {
      ...mutable,
      projectId: { type: 'string' },
      name: { type: 'string', minLength: 1 },
    },
  },
  'project.move': {
    type: 'object',
    additionalProperties: false,
    required: ['projectId', 'categoryId'],
    properties: {
      ...mutable,
      projectId: { type: 'string' },
      categoryId: { type: 'string' },
    },
  },
  'project.archive': {
    type: 'object',
    additionalProperties: false,
    required: ['projectId'],
    properties: { ...mutable, projectId: { type: 'string' } },
  },
  'project.unarchive': {
    type: 'object',
    additionalProperties: false,
    required: ['projectId'],
    properties: { ...mutable, projectId: { type: 'string' } },
  },
  'project.list': {
    type: 'object',
    additionalProperties: false,
    properties: {
      includeArchived: { type: 'boolean' },
      categoryId: { type: 'string' },
    },
  },
  'template.create': {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'slots'],
    properties: {
      ...mutable,
      name: { type: 'string', minLength: 1 },
      slots: { type: 'array', items: { $ref: 'common.json#/$defs/slotDraft' } },
    },
  },
  'template.duplicate': {
    type: 'object',
    additionalProperties: false,
    required: ['templateId'],
    properties: {
      ...mutable,
      templateId: { type: 'string' },
      name: { type: 'string' },
    },
  },
  'template.update': {
    type: 'object',
    additionalProperties: false,
    required: ['templateId'],
    properties: {
      ...mutable,
      templateId: { type: 'string' },
      name: { type: 'string' },
      slots: { type: 'array', items: { $ref: 'common.json#/$defs/slotDraft' } },
    },
  },
  'template.archive': {
    type: 'object',
    additionalProperties: false,
    required: ['templateId'],
    properties: { ...mutable, templateId: { type: 'string' } },
  },
  'template.list': {
    type: 'object',
    additionalProperties: false,
    properties: { includeArchived: { type: 'boolean' } },
  },
  'week.open': {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...mutable,
      templateId: { type: 'string' },
      weekStart: { $ref: 'common.json#/$defs/isoDate' },
    },
  },
  'week.review': {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...mutable,
      templateId: { type: 'string' },
      targetWeekStart: { $ref: 'common.json#/$defs/isoDate', format: 'date' },
    },
  },
  'week.current': {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  'week.adjust_slots': {
    type: 'object',
    additionalProperties: false,
    required: ['operations'],
    properties: {
      ...mutable,
      weekPlanId: { type: 'string' },
      operations: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['op'],
          properties: {
            op: { type: 'string', enum: ['add', 'remove', 'move', 'change'] },
            slotId: { type: 'string' },
            weekday: { type: 'integer', minimum: 1, maximum: 7 },
            order: { type: 'integer' },
            kind: { $ref: 'common.json#/$defs/slotKind' },
            durationMinutes: { type: 'integer' },
            startTime: { type: ['string', 'null'] },
          },
        },
      },
    },
  },
  'plan.propose': {
    type: 'object',
    additionalProperties: false,
    properties: {
      weekPlanId: { type: 'string' },
      reservations: reservationSchema(),
    },
  },
  'plan.accept': {
    type: 'object',
    additionalProperties: false,
    required: ['proposalId'],
    properties: { ...mutable, proposalId: { type: 'string' } },
  },
  'block.schedule': {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...mutable,
      taskId: { type: 'string' },
      title: { type: 'string' },
      slotId: { type: 'string' },
      date: { $ref: 'common.json#/$defs/isoDate' },
      slotKind: { $ref: 'common.json#/$defs/slotKind' },
      weekPlanId: { type: 'string' },
    },
  },
  'block.execute': {
    type: 'object',
    additionalProperties: false,
    required: ['blockId'],
    properties: { ...mutable, blockId: { type: 'string' } },
  },
  'block.cancel': {
    type: 'object',
    additionalProperties: false,
    required: ['blockId'],
    properties: { ...mutable, blockId: { type: 'string' } },
  },
  'report.nominal_time': {
    type: 'object',
    additionalProperties: false,
    properties: {
      from: { $ref: 'common.json#/$defs/isoDate' },
      to: { $ref: 'common.json#/$defs/isoDate' },
      taskId: { type: 'string' },
      projectId: { type: 'string' },
      categoryId: { type: 'string' },
    },
  },
};

const outputs = {
  'inbox.capture_many': {
    type: 'object',
    additionalProperties: false,
    required: ['tasks'],
    properties: {
      tasks: { type: 'array', items: { $ref: 'common.json#/$defs/task' } },
    },
  },
  'inbox.list': {
    type: 'object',
    additionalProperties: false,
    required: ['tasks'],
    properties: {
      tasks: { type: 'array', items: { $ref: 'common.json#/$defs/task' } },
    },
  },
  'backlog.list': {
    type: 'object',
    additionalProperties: false,
    required: ['tasks'],
    properties: {
      tasks: { type: 'array', items: { $ref: 'common.json#/$defs/task' } },
    },
  },
  'task.get': {
    type: 'object',
    additionalProperties: false,
    required: ['task'],
    properties: { task: { $ref: 'common.json#/$defs/task' } },
  },
  'task.process': {
    type: 'object',
    additionalProperties: false,
    required: ['task'],
    properties: { task: { $ref: 'common.json#/$defs/task' } },
  },
  'task.update': {
    type: 'object',
    additionalProperties: false,
    required: ['task'],
    properties: { task: { $ref: 'common.json#/$defs/task' } },
  },
  'task.postpone': {
    type: 'object',
    additionalProperties: false,
    required: ['task', 'suggestArchive'],
    properties: {
      task: { $ref: 'common.json#/$defs/task' },
      suggestArchive: { type: 'boolean' },
    },
  },
  'task.complete': {
    type: 'object',
    additionalProperties: false,
    required: ['task'],
    properties: { task: { $ref: 'common.json#/$defs/task' } },
  },
  'task.archive': {
    type: 'object',
    additionalProperties: false,
    required: ['task'],
    properties: { task: { $ref: 'common.json#/$defs/task' } },
  },
  'task.unarchive': {
    type: 'object',
    additionalProperties: false,
    required: ['task'],
    properties: { task: { $ref: 'common.json#/$defs/task' } },
  },
  'category.create': {
    type: 'object',
    additionalProperties: false,
    required: ['category'],
    properties: { category: { $ref: 'common.json#/$defs/category' } },
  },
  'category.rename': {
    type: 'object',
    additionalProperties: false,
    required: ['category'],
    properties: { category: { $ref: 'common.json#/$defs/category' } },
  },
  'category.archive': {
    type: 'object',
    additionalProperties: false,
    required: ['category'],
    properties: { category: { $ref: 'common.json#/$defs/category' } },
  },
  'category.unarchive': {
    type: 'object',
    additionalProperties: false,
    required: ['category'],
    properties: { category: { $ref: 'common.json#/$defs/category' } },
  },
  'category.list': {
    type: 'object',
    additionalProperties: false,
    required: ['categories'],
    properties: {
      categories: {
        type: 'array',
        items: { $ref: 'common.json#/$defs/category' },
      },
    },
  },
  'project.create': {
    type: 'object',
    additionalProperties: false,
    required: ['project'],
    properties: { project: { $ref: 'common.json#/$defs/project' } },
  },
  'project.rename': {
    type: 'object',
    additionalProperties: false,
    required: ['project'],
    properties: { project: { $ref: 'common.json#/$defs/project' } },
  },
  'project.move': {
    type: 'object',
    additionalProperties: false,
    required: ['project'],
    properties: { project: { $ref: 'common.json#/$defs/project' } },
  },
  'project.archive': {
    type: 'object',
    additionalProperties: false,
    required: ['project'],
    properties: { project: { $ref: 'common.json#/$defs/project' } },
  },
  'project.unarchive': {
    type: 'object',
    additionalProperties: false,
    required: ['project'],
    properties: { project: { $ref: 'common.json#/$defs/project' } },
  },
  'project.list': {
    type: 'object',
    additionalProperties: false,
    required: ['projects'],
    properties: {
      projects: {
        type: 'array',
        items: { $ref: 'common.json#/$defs/project' },
      },
    },
  },
  'template.create': templateOutput(),
  'template.duplicate': templateOutput(),
  'template.update': templateOutput(),
  'template.archive': templateOutput(),
  'template.list': {
    type: 'object',
    additionalProperties: false,
    required: ['templates'],
    properties: {
      templates: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'name', 'isDefault', 'archived', 'slots'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            isDefault: { type: 'boolean' },
            archived: { type: 'boolean' },
            slots: {
              type: 'array',
              items: { $ref: 'common.json#/$defs/slotDraft' },
            },
          },
        },
      },
    },
  },
  'week.open': weekOutput(),
  'week.review': weekOutput(),
  'week.current': weekOutput(),
  'week.adjust_slots': weekOutput(),
  'plan.propose': proposalOutput(),
  'plan.accept': proposalOutput(),
  'block.schedule': {
    type: 'object',
    additionalProperties: false,
    required: ['block'],
    properties: { block: { $ref: 'common.json#/$defs/block' } },
  },
  'block.execute': {
    type: 'object',
    additionalProperties: false,
    required: ['block'],
    properties: { block: { $ref: 'common.json#/$defs/block' } },
  },
  'block.cancel': {
    type: 'object',
    additionalProperties: false,
    required: ['block'],
    properties: { block: { $ref: 'common.json#/$defs/block' } },
  },
  'report.nominal_time': {
    type: 'object',
    additionalProperties: false,
    required: ['totals', 'groups'],
    properties: {
      totals: reportGroup(),
      groups: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'id',
            'name',
            'kind',
            'planned',
            'executed',
            'cancelled',
            'missed',
            'executedMinutes',
          ],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            kind: { type: 'string', enum: ['task', 'project', 'category'] },
            planned: { type: 'integer' },
            executed: { type: 'integer' },
            cancelled: { type: 'integer' },
            missed: { type: 'integer' },
            executedMinutes: { type: 'integer' },
          },
        },
      },
    },
  },
};

function templateOutput() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['template'],
    properties: {
      template: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'isDefault', 'archived', 'slots'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          isDefault: { type: 'boolean' },
          archived: { type: 'boolean' },
          slots: {
            type: 'array',
            items: { $ref: 'common.json#/$defs/slotDraft' },
          },
        },
      },
    },
  };
}

function weekOutput() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['week'],
    properties: {
      week: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'weekStart', 'status', 'slots', 'blocks'],
        properties: {
          id: { type: ['string', 'null'] },
          weekStart: { type: ['string', 'null'] },
          status: { type: ['string', 'null'] },
          templateId: { type: ['string', 'null'] },
          slots: {
            type: 'array',
            items: { $ref: 'common.json#/$defs/slot' },
          },
          blocks: {
            type: 'array',
            items: { $ref: 'common.json#/$defs/block' },
          },
          resumedTaskIds: { type: 'array', items: { type: 'string' } },
          today: { type: 'string', format: 'date' },
          timezone: { type: 'string' },
          capacity: capacitySchema(),
        },
      },
    },
  };
}

function proposalOutput() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['proposal'],
    properties: {
      proposal: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'weekPlanId',
          'assignments',
          'unmatched',
          'emptySlots',
        ],
        properties: {
          id: { type: 'string' },
          weekPlanId: { type: 'string' },
          accepted: { type: 'boolean' },
          reservations: reservationSchema(),
          assignments: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['taskId', 'slotId', 'nominalMinutes'],
              properties: {
                taskId: { type: 'string' },
                slotId: { type: 'string' },
                nominalMinutes: { type: 'integer' },
              },
            },
          },
          unmatched: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['taskId', 'reason'],
              properties: {
                taskId: { type: 'string' },
                reason: { $ref: 'common.json#/$defs/unmatchedReason' },
              },
            },
          },
          emptySlots: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  };
}

function reservationSchema() {
  return {
    type: 'array',
    uniqueItems: true,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['taskId', 'slotId'],
      properties: {
        taskId: { type: 'string', minLength: 1 },
        slotId: { type: 'string', minLength: 1 },
      },
    },
  };
}

function capacitySchema() {
  const totals = {
    totalMinutes: { type: 'integer' },
    occupiedMinutes: { type: 'integer' },
    freeMinutes: { type: 'integer' },
  };
  return {
    type: 'object',
    additionalProperties: false,
    required: [...Object.keys(totals), 'days'],
    properties: {
      ...totals,
      days: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['weekday', ...Object.keys(totals)],
          properties: { weekday: { type: 'integer' }, ...totals },
        },
      },
    },
  };
}

function reportGroup() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['planned', 'executed', 'cancelled', 'missed', 'executedMinutes'],
    properties: {
      planned: { type: 'integer' },
      executed: { type: 'integer' },
      cancelled: { type: 'integer' },
      missed: { type: 'integer' },
      executedMinutes: { type: 'integer' },
    },
  };
}

const manifest = {
  name: 'quadrant',
  version: '1.1.0',
  description: 'Capacidades públicas de Quadrant',
  capabilities: CAPABILITIES.map(
    ([id, description, sideEffect, confirmation, examples]) => ({
      id,
      version: [
        'task.process',
        'week.open',
        'week.review',
        'week.current',
        'week.adjust_slots',
        'plan.propose',
        'plan.accept',
      ].includes(id)
        ? '1.1.0'
        : '1.0.0',
      description,
      inputSchema: `./schemas/${id}.input.json`,
      outputSchema: `./schemas/${id}.output.json`,
      sideEffect,
      confirmation,
      examples,
    }),
  ),
};

writeFileSync(
  join(root, 'packages/capabilities/manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

for (const [id] of CAPABILITIES) {
  writeJson(`${id}.input.json`, {
    $id: `https://quadrant.local/schemas/${id}.input.json`,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...inputs[id],
  });
  writeJson(`${id}.output.json`, {
    $id: `https://quadrant.local/schemas/${id}.output.json`,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...outputs[id],
  });
}

const envelope = {
  $id: 'https://quadrant.local/schemas/envelope.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: [
        'ok',
        'validation_error',
        'conflict',
        'needs_confirmation',
        'needs_clarification',
      ],
    },
    request_id: { type: ['string', 'null'] },
    result: { type: 'object' },
    error: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: { type: 'string' },
        code: { type: 'string' },
        details: true,
        questions: { type: 'array', items: { type: 'string' } },
      },
    },
    confirmation_token: { type: 'string' },
    summary: { type: 'string' },
    expires_at: { type: 'string' },
  },
};
writeJson('envelope.json', envelope);

const documents = {
  'common.json': defs,
  'envelope.json': envelope,
};
for (const [id] of CAPABILITIES) {
  documents[`${id}.input.json`] = {
    $id: `https://quadrant.local/schemas/${id}.input.json`,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...inputs[id],
  };
  documents[`${id}.output.json`] = {
    $id: `https://quadrant.local/schemas/${id}.output.json`,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...outputs[id],
  };
}
mkdirSync(join(root, 'packages/capabilities/src/generated'), {
  recursive: true,
});
writeFileSync(
  join(root, 'packages/capabilities/src/generated/schema-documents.ts'),
  `/* eslint-disable */\n/** Generated from JSON Schema files. */\nexport const schemaDocuments: Record<string, unknown> = ${JSON.stringify(documents, null, 2)};\n`,
);

console.log(`Wrote ${CAPABILITIES.length} capabilities`);
