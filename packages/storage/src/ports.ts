import type {
  AuditEvent,
  Category,
  CommandReceipt,
  ConfirmationToken,
  PlanningProposal,
  Postponement,
  PostponementReset,
  Project,
  Settings,
  Task,
  TemplateSlot,
  WeekPlan,
  WeekSlot,
  WeekTemplate,
  WorkBlock,
} from '@quadrant/domain';

export interface QuadrantRepositories {
  categories: {
    list(includeArchived: boolean): Category[];
    get(id: string): Category | null;
    findByName(name: string): Category[];
    insert(category: Category): void;
    update(category: Category): void;
  };
  projects: {
    list(includeArchived: boolean): Project[];
    get(id: string): Project | null;
    findByName(name: string): Project[];
    insert(project: Project): void;
    update(project: Project): void;
  };
  tasks: {
    list(): Task[];
    get(id: string): Task | null;
    findByTitle(title: string): Task[];
    insert(task: Task): void;
    update(task: Task): void;
  };
  templates: {
    list(includeArchived: boolean): WeekTemplate[];
    get(id: string): WeekTemplate | null;
    default(): WeekTemplate | null;
    insert(template: WeekTemplate): void;
    update(template: WeekTemplate): void;
    slots(templateId: string): TemplateSlot[];
    insertSlot(slot: TemplateSlot): void;
    deleteSlots(templateId: string): void;
  };
  weeks: {
    list(): WeekPlan[];
    get(id: string): WeekPlan | null;
    getByStart(weekStart: string): WeekPlan | null;
    open(): WeekPlan | null;
    insert(plan: WeekPlan): void;
    update(plan: WeekPlan): void;
    slots(weekPlanId: string): WeekSlot[];
    insertSlot(slot: WeekSlot): void;
    updateSlot(slot: WeekSlot): void;
    deleteSlot(id: string): void;
  };
  blocks: {
    list(): WorkBlock[];
    forWeek(weekPlanId: string): WorkBlock[];
    forSlot(slotId: string): WorkBlock[];
    forTask(taskId: string): WorkBlock[];
    get(id: string): WorkBlock | null;
    insert(block: WorkBlock): void;
    update(block: WorkBlock): void;
  };
  postponements: {
    forTask(taskId: string): Postponement[];
    pending(): Postponement[];
    insert(item: Postponement): void;
    update(item: Postponement): void;
    resets(taskId: string): PostponementReset[];
    insertReset(item: PostponementReset): void;
  };
  proposals: {
    get(id: string): PlanningProposal | null;
    insert(proposal: PlanningProposal): void;
    update(proposal: PlanningProposal): void;
  };
  receipts: {
    get(requestId: string): CommandReceipt | null;
    insert(receipt: CommandReceipt): void;
    deleteOlderThan(iso: string): void;
  };
  confirmations: {
    get(token: string): ConfirmationToken | null;
    insert(token: ConfirmationToken): void;
    update(token: ConfirmationToken): void;
  };
  settings: {
    get(): Settings;
    setTimezone(timezone: string): void;
  };
  audit: {
    insert(event: AuditEvent): void;
  };
}

export interface UnitOfWork {
  repos: QuadrantRepositories;
  transaction<T>(fn: () => T): T;
}
