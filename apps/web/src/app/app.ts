import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly links = [
    { path: '/inbox', label: 'Bandeja' },
    { path: '/process', label: 'Procesar' },
    { path: '/backlog', label: 'Backlog' },
    { path: '/matrix', label: 'Matriz' },
    { path: '/week', label: 'Semana' },
    { path: '/templates', label: 'Plantillas' },
    { path: '/catalog', label: 'Catálogo' },
    { path: '/reports', label: 'Reportes' },
  ];
}
