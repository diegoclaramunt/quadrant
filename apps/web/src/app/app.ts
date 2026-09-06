import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CapturePanel } from './capture-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CapturePanel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly primaryLinks = [
    {
      path: '/today',
      label: 'Hoy',
      icon: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    },
    {
      path: '/inbox',
      label: 'Bandeja',
      icon: 'M4 4h16v16H4zM4 13h5l1 3h4l1-3h5',
    },
    {
      path: '/week',
      label: 'Semana',
      icon: 'M4 5h16v15H4zM8 3v4m8-4v4M4 10h16M8 14h2m4 0h2',
    },
  ];
  protected readonly secondaryLinks = [
    { path: '/backlog', label: 'Tareas · Lista' },
    { path: '/matrix', label: 'Tareas · Matriz' },
    { path: '/templates', label: 'Plantillas' },
    { path: '/catalog', label: 'Proyectos y categorías' },
    { path: '/reports', label: 'Historial' },
  ];
  protected moreOpen = false;
}
