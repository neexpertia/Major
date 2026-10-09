import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogueService } from '../core/catalogue.service';
import { EtatService, GRATUIT_PAR_JOUR } from '../core/etat.service';
import { SeanceService } from '../core/seance.service';
import { couleurPct } from '../core/indice';

/** Écran d'accueil quotidien : objectif du jour, série, concours et examen blanc. */
@Component({
  selector: 'mj-aujourdhui',
  imports: [RouterLink],
  template: `
    @let e = etat();
    <div class="row">
      <div><span class="label">{{ date }}</span><h1>Bonjour {{ e.pseudo }}</h1></div>
      <span class="chip gold" style="font-size:.95rem;padding:6px 12px">
        🔥 {{ e.streak ? e.streak + ' jour' + (e.streak > 1 ? 's' : '') + " d'affilée" : 'Atteins ton objectif pour lancer ta série' }}
      </span>
    </div>

    <div class="card hero">
      <div class="row">
        <h2>{{ fait() ? 'Objectif du jour atteint' : 'Ta séance du jour' }}</h2>
        <span class="num"><b>{{ e.day.n }}</b> / {{ e.goal }} questions</span>
      </div>
      <div class="bar"><i [style.width.%]="pct()"></i></div>
      <p>
        @if (fait()) {
          Bravo. Tu peux continuer pour gagner des points de ligue.
        } @else if (proche(); as c) {
          Aujourd'hui, on insiste sur <b>{{ cat.nomMatiere(faible()) }}</b>, pour le concours {{ c.nom }} dans {{ c.joursAvantEpreuve }} jours.
        }
      </p>
      <div class="row" style="justify-content:flex-start">
        <button class="btn" (click)="seance.demarrer()">{{ e.day.n ? (fait() ? 'Encore 10 questions' : 'Continuer ma séance') : 'Commencer ma séance' }}</button>
        @if (!e.plus) {
          <span class="muted" style="font-size:.88rem">{{ gratuitRestant() }} questions gratuites restantes aujourd'hui</span>
        } @else {
          <span class="chip">Major+</span>
        }
      </div>
    </div>

    <div style="display:grid;gap:10px">
      <h2>Mes concours</h2>
      <div class="grid2">
        @for (x of concours(); track x.c.id) {
          <a class="pick" [routerLink]="['/concours', x.c.id]">
            <span class="row"><b>{{ x.c.nom }}</b><span class="chip" [class.red]="x.c.joursAvantEpreuve <= 35">J-{{ x.c.joursAvantEpreuve }}</span></span>
            <span class="row"><span class="muted">Indice Major</span><span class="num"><b style="font-size:1.4rem;color:var(--green)">{{ x.i }}</b> / 100</span></span>
            <div [class]="'bar ' + couleur(x.i)"><i [style.width.%]="x.i"></i></div>
          </a>
        }
      </div>
    </div>

    <div class="card" style="border-style:dashed">
      <div class="row"><h3>Examen blanc de la semaine</h3><span class="chip gold">12 questions · 10 min</span></div>
      <p class="muted">
        @if (dernierExamen(); as x) {
          Dernier résultat : {{ x.note.toString().replace('.', ',') }} / 20, {{ x.rang }}e sur {{ x.sur.toLocaleString('fr-FR') }}.
        } @else {
          Dans les conditions du jour J : chronométré, sans correction pendant l'épreuve.
        }
        (Version courte pour la démo.)
      </p>
      <a class="btn ghost" routerLink="/examen" style="justify-self:start;text-decoration:none">Passer l'examen blanc</a>
    </div>
  `,
})
export class Aujourdhui {
  protected readonly cat = inject(CatalogueService);
  private readonly etatService = inject(EtatService);
  protected readonly seance = inject(SeanceService);
  protected readonly etat = this.etatService.etat;
  protected readonly couleur = couleurPct;
  protected readonly date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  protected readonly fait = computed(() => this.etat().day.n >= this.etat().goal);
  protected readonly pct = computed(() => Math.min(100, Math.round((100 * this.etat().day.n) / this.etat().goal)));
  protected readonly gratuitRestant = computed(() => Math.max(0, GRATUIT_PAR_JOUR - this.etat().day.free));
  protected readonly proche = computed(() => this.etatService.mesConcours()[0]);
  protected readonly concours = computed(() => { this.etat(); return this.etatService.mesConcours().map((c) => ({ c, i: this.etatService.indice(c) })); });
  protected readonly dernierExamen = computed(() => this.etat().exams.at(-1));

  /** Matière où il y a le plus à gagner pour le concours le plus proche. */
  protected readonly faible = computed(() => {
    this.etat();
    const c = this.proche();
    if (!c) return 'ma';
    return Object.keys(c.coefficients)
      .map((m) => [m, this.etatService.maitrise(m).est * c.coefficients[m]] as const)
      .sort((a, b) => a[1] - b[1])[0][0];
  });
}
