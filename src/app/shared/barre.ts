import { Component, computed, input } from '@angular/core';
import { couleurPct } from '../core/indice';

/** Ligne « libellé + pourcentage » avec sa barre colorée. */
@Component({
  selector: 'mj-barre',
  template: `
    <div style="display:grid;gap:5px">
      <div class="row">
        <span>{{ libelle() }} @if (detail()) {<span class="muted" style="font-size:.85rem">{{ detail() }}</span>}</span>
        <span class="num">{{ pct() == null ? '—' : pct() + ' %' }}</span>
      </div>
      <div class="bar" [class]="couleur()"><i [style.width.%]="pct() ?? 0"></i></div>
    </div>
  `,
})
export class Barre {
  readonly libelle = input.required<string>();
  readonly pct = input<number | null>(null);
  readonly detail = input<string>('');
  protected readonly couleur = computed(() => 'bar ' + couleurPct(this.pct()));
}
