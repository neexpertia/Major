import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogueService } from '../core/catalogue.service';
import { EtatService } from '../core/etat.service';
import { SeanceService } from '../core/seance.service';
import { couleurPct, topPourcent } from '../core/indice';
import { Barre } from '../shared/barre';

/** Progrès : Indice Major par concours, tronc commun, matières spécifiques, régularité. */
@Component({
  selector: 'mj-progres',
  imports: [RouterLink, Barre],
  template: `
    @let e = etat();
    <h1>Progrès</h1>
    <div class="grid2">
      @for (x of concours(); track x.c.id) {
        <a class="pick" [routerLink]="['/concours', x.c.id]">
          <span class="row"><b>{{ x.c.nom }}</b><span class="chip" [class.red]="x.c.joursAvantEpreuve <= 35">J-{{ x.c.joursAvantEpreuve }}</span></span>
          <span class="row"><span class="muted">Indice Major</span><span class="num"><b style="font-size:1.4rem;color:var(--green)">{{ x.i }}</b> / objectif 80</span></span>
          <div [class]="'bar ' + couleur(x.i)"><i [style.width.%]="x.i"></i></div>
          <span class="muted" style="font-size:.88rem">{{ x.d >= 0 ? '+' : '' }}{{ x.d }} depuis le début · top {{ x.top }} % des candidats Major (simulé)</span>
        </a>
      }
    </div>
    <div class="card">
      <h3>Tronc commun <span class="muted" style="font-weight:400;font-size:.9rem">compte pour tous tes concours</span></h3>
      @for (x of tronc(); track x.m) {
        <button class="pick" style="border:0;padding:6px 0;background:none" [attr.aria-label]="'S\\'entraîner en ' + x.nom" (click)="seance.demarrer(x.m)">
          <mj-barre [libelle]="x.nom" [pct]="x.pct" [detail]="x.detail" />
        </button>
      }
    </div>
    <div class="card">
      <h3>Matières de tes concours</h3>
      @for (x of specifiques(); track x.m) {
        <button class="pick" style="border:0;padding:6px 0;background:none" (click)="seance.demarrer(x.m)">
          <mj-barre [libelle]="x.nom" [pct]="x.pct" [detail]="x.detail" />
        </button>
      }
      <p class="muted" style="font-size:.85rem">Touche une matière pour lancer une séance ciblée. Vert à partir de 70 %, ocre de 50 à 70 %, rouge en dessous.</p>
    </div>
    <div class="card">
      <div class="row"><h3>Régularité</h3><span class="chip gold">Record : {{ e.best }} jour{{ e.best > 1 ? 's' : '' }}</span></div>
      <p>{{ totalReponses() }} questions répondues au total, {{ e.points.toLocaleString('fr-FR') }} points.</p>
    </div>
  `,
})
export class Progres {
  private readonly cat = inject(CatalogueService);
  private readonly etatService = inject(EtatService);
  protected readonly seance = inject(SeanceService);
  protected readonly etat = this.etatService.etat;
  protected readonly couleur = couleurPct;

  protected readonly concours = computed(() => {
    const e = this.etat();
    return this.etatService.mesConcours().map((c) => {
      const i = this.etatService.indice(c);
      const h = e.hist[c.id] ?? [];
      return { c, i, d: h.length ? i - h[0].v : 0, top: topPourcent(i) };
    });
  });

  private ligne(m: string) {
    const x = this.etatService.maitrise(m);
    return { m, nom: this.cat.nomMatiere(m), pct: x.pct, detail: x.tot ? `· ${x.tot} réponses` : '· pas encore travaillé' };
  }

  protected readonly tronc = computed(() => { this.etat(); return this.cat.tronc.map((m) => this.ligne(m)); });
  protected readonly specifiques = computed(() => {
    this.etat();
    const ms = new Set(this.etatService.mesConcours().flatMap((c) => Object.keys(c.coefficients)));
    return [...ms].filter((m) => !this.cat.tronc.includes(m)).map((m) => this.ligne(m));
  });
  protected readonly totalReponses = computed(() => Object.values(this.etat().stats).reduce((a, s) => a + s.ok + s.ko, 0));
}
