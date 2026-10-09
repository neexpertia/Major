import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogueService } from '../core/catalogue.service';
import { EtatService } from '../core/etat.service';
import { SeanceService } from '../core/seance.service';
import { topPourcent } from '../core/indice';
import { Barre } from '../shared/barre';

const L = 300;
const H = 70;

/** Fiche d'un concours : indice, courbe d'évolution, matières classées par gain possible. */
@Component({
  selector: 'mj-detail-concours',
  imports: [RouterLink, Barre],
  template: `
    @if (c(); as c) {
      <a class="link" routerLink="/progres">← Progrès</a>
      <div class="row">
        <h1>{{ c.nom }}</h1>
        <span class="chip" [class.red]="c.joursAvantEpreuve <= 35" style="font-size:.95rem">Concours dans {{ c.joursAvantEpreuve }} jours</span>
      </div>
      <div class="grid2">
        <div class="card">
          <span class="muted">Indice Major</span>
          <div class="row" style="justify-content:flex-start"><span class="big num">{{ indice() }}</span><span class="muted">objectif 80<br />top {{ top() }} % (simulé)</span></div>
        </div>
        <div class="card">
          <span class="muted">Évolution</span>
          <svg class="spark" [attr.viewBox]="'0 0 ' + largeur + ' ' + hauteur" preserveAspectRatio="none" aria-label="Évolution de l'indice">
            <line x1="0" [attr.x2]="largeur" [attr.y1]="y(80)" [attr.y2]="y(80)" stroke="var(--gold)" stroke-dasharray="5 5" fill="none" />
            <polyline [attr.points]="courbe().points" fill="none" stroke="var(--green)" stroke-width="2.5" />
            <circle [attr.cx]="courbe().dx" [attr.cy]="courbe().dy" r="4" fill="var(--green)" />
          </svg>
          <span class="muted" style="font-size:.82rem">Pointillé : ton objectif</span>
        </div>
      </div>
      <div class="card">
        <h3>Où gagner des points</h3>
        <p class="muted" style="font-size:.9rem">Classé par gain possible : coefficient × ce qui reste à maîtriser.</p>
        @for (o of matieres(); track o.m) {
          <div class="row" style="border-bottom:1px solid var(--line);padding-bottom:10px">
            <div style="flex:1;min-width:180px"><mj-barre [libelle]="o.nom + ' ×' + o.k" [pct]="o.pct" /></div>
            <button class="btn ghost" (click)="seance.demarrer(o.m)">S'entraîner</button>
          </div>
        }
      </div>
      <p class="muted" style="font-size:.85rem">{{ c.candidatsAttendus }} candidats attendus (exemple). Matières et coefficients d'exemple.</p>
    } @else {
      <p>Concours introuvable. <a class="link" routerLink="/progres">Revenir aux progrès</a></p>
    }
  `,
})
export class DetailConcours {
  private readonly cat = inject(CatalogueService);
  private readonly etatService = inject(EtatService);
  protected readonly seance = inject(SeanceService);
  readonly id = input.required<string>();
  protected readonly largeur = L;
  protected readonly hauteur = H;

  protected readonly c = computed(() => this.cat.concoursParId(this.id()));
  protected readonly indice = computed(() => { this.etatService.etat(); const c = this.c(); return c ? this.etatService.indice(c) : 0; });
  protected readonly top = computed(() => topPourcent(this.indice()));

  y(v: number): number {
    return H - 6 - (v / 100) * (H - 12);
  }

  protected readonly courbe = computed(() => {
    const h = this.etatService.etat().hist[this.id()] ?? [{ v: this.indice() }];
    const pts = h.slice(-8).map((x) => x.v);
    if (pts.length === 1) pts.unshift(pts[0]);
    const x = (k: number) => 6 + (k * (L - 12)) / (pts.length - 1);
    return { points: pts.map((v, k) => x(k) + ',' + this.y(v)).join(' '), dx: x(pts.length - 1), dy: this.y(pts[pts.length - 1]) };
  });

  protected readonly matieres = computed(() => {
    this.etatService.etat();
    const c = this.c();
    if (!c) return [];
    return Object.entries(c.coefficients)
      .map(([m, k]) => { const x = this.etatService.maitrise(m); return { m, k, nom: this.cat.nomMatiere(m), pct: x.pct, gain: k * (100 - x.est) }; })
      .sort((a, b) => b.gain - a.gain);
  });
}
