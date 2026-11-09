import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly primaryLinks = [
    { path: '/board', label: 'Tablero' },
    { path: '/catalog', label: 'Proyectos' },
  ];
  /** Planificación por bloques: se conserva, fuera del recorrido diario. */
  protected readonly planningLinks = [
    { path: '/today', label: 'Hoy' },
    { path: '/week', label: 'Semana' },
    { path: '/templates', label: 'Plantillas' },
    { path: '/backlog', label: 'Lista de tareas' },
    { path: '/reports', label: 'Historial' },
  ];
  protected moreOpen = false;
}
