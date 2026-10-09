import { Component, input } from '@angular/core';

/** Icônes de la navigation, dessinées en SVG. */
@Component({
  selector: 'mj-icone',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      @switch (nom()) {
        @case ('aujourdhui') { <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /> }
        @case ('progres') { <path d="M4 19V10M10 19V5M16 19v-6M22 19H2" /> }
        @case ('classement') { <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /> }
        @case ('profil') { <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /> }
        @case ('examen') { <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /> }
      }
    </svg>
  `,
  styles: `:host { display: contents } svg { width: 20px; height: 20px; flex: none }`,
})
export class Icone {
  readonly nom = input.required<string>();
}
