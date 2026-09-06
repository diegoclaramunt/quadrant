import { Route } from '@angular/router';
import { InboxPage } from './pages/inbox.page';
import { ProcessPage } from './pages/process.page';
import { BacklogPage } from './pages/backlog.page';
import { MatrixPage } from './pages/matrix.page';
import { WeekPage } from './pages/week.page';
import { TemplatesPage } from './pages/templates.page';
import { ReportsPage } from './pages/reports.page';
import { CatalogPage } from './pages/catalog.page';
import { TodayPage } from './pages/today.page';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'today' },
  { path: 'today', component: TodayPage },
  { path: 'inbox', component: InboxPage },
  { path: 'process', component: ProcessPage },
  { path: 'backlog', component: BacklogPage },
  { path: 'matrix', component: MatrixPage },
  { path: 'week', component: WeekPage },
  { path: 'templates', component: TemplatesPage },
  { path: 'reports', component: ReportsPage },
  { path: 'catalog', component: CatalogPage },
];
