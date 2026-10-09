import { Component, computed, inject, signal } from '@angular/core';
import { CatalogueService } from '../core/catalogue.service';
import { EtatService } from '../core/etat.service';
import { SeanceService } from '../core/seance.service';
import { Barre } from '../shared/barre';

const LETTRES = ['A', 'B', 'C', 'D'];
const melanger = <T>(t: T[]) => [...t].sort(() => Math.random() - 0.5);

/** Premier lancement : prénom, choix des concours, test de niveau, point de départ. */
@Component({
  selector: 'mj-bienvenue',
  imports: [Barre],
  template: `
    @switch (etape()) {
      @case (0) {
        <div class="center" style="display:grid;gap:22px;padding-top:6vh">
          <div class="big" style="font-size:3.4rem">Major</div>
          <h1>Entraîne-toi chaque jour. Monte au classement. Deviens major.</h1>
          <p class="muted" style="font-size:1.1rem">Questions comme au vrai concours, correction expliquée, examen blanc chaque semaine. Un seul compte pour tous tes concours.</p>
          <div style="display:grid;gap:8px">
            <label for="pseudo" class="label">Ton prénom (affiché au classement)</label>
            <input #p id="pseudo" class="input" placeholder="Ex. Aminata" maxlength="20" autocomplete="given-name" [value]="pseudo()" (keydown.enter)="commencer(p.value)" />
          </div>
          <button class="btn block" (click)="commencer(p.value)">Commencer</button>
          <p class="demo">Démonstration web. Dans l'application, l'inscription se fera avec le numéro de téléphone et un code SMS. Ici, tes résultats restent dans ce navigateur.</p>
        </div>
      }
      @case (1) {
        <div class="center" style="display:grid;gap:16px">
          <span class="label">Étape 1 sur 2</span>
          <h1>À quels concours es-tu inscrit ?</h1>
          <p class="muted">Coche tous ceux que tu prépares. Le tronc commun (français, culture générale, maths et logique) sert à tous.</p>
          @for (c of cat.concours; track c.id) {
            <button class="pick" [class.on]="choix().includes(c.id)" [attr.aria-pressed]="choix().includes(c.id)" (click)="basculer(c.id)">
              <span class="row"><b>{{ c.nom }}</b>@if (choix().includes(c.id)) {<span class="chip">✓ choisi</span>}</span>
              <span class="muted" style="font-size:.9rem">{{ c.domaine }} · niveau {{ c.niveau }} · {{ coefs(c.coefficients) }}</span>
            </button>
          }
          <p class="muted" style="font-size:.85rem">Liste et coefficients d'exemple. Dans la vraie version, ils viennent des communiqués officiels.</p>
          <button class="btn block" [disabled]="!choix().length" (click)="lancerTest()">
            {{ choix().length ? 'Continuer avec ' + choix().length + ' concours' : 'Choisis au moins un concours' }}
          </button>
        </div>
      }
      @case (2) {
        @let q = questionTest()!;
        <div class="center" style="display:grid;gap:16px">
          <div class="topq">
            <span class="label">Test de niveau</span>
            <div class="bar"><i [style.width.%]="(100 * i()) / test().length"></i></div>
            <span class="num muted">{{ i() + 1 }} / {{ test().length }}</span>
          </div>
          <span class="chip" style="justify-self:start">{{ cat.nomMatiere(q.matiere) }}</span>
          <p class="q">{{ q.enonce }}</p>
          <div class="opts">
            @for (c of q.choix; track $index) {
              <button class="opt" (click)="repondreTest($index)"><b>{{ lettres[$index] }}</b>{{ c }}</button>
            }
          </div>
          <button class="link" style="justify-self:center" (click)="repondreTest(-1)">Je ne sais pas</button>
          <p class="muted" style="font-size:.85rem;text-align:center">Pas de correction pendant le test : on mesure ton point de départ.</p>
        </div>
      }
      @default {
        <div class="center" style="display:grid;gap:16px">
          <span class="label">Ton point de départ</span>
          <h1>Bravo {{ etat().pseudo }}, voici où tu en es.</h1>
          <div class="grid2">
            @for (c of etatService.mesConcours(); track c.id) {
              <div class="card">
                <span class="muted">{{ c.nom }}</span>
                <div class="row" style="justify-content:flex-start"><span class="big num">{{ etatService.indice(c) }}</span><span class="muted">Indice Major<br />sur 100</span></div>
              </div>
            }
          </div>
          @if (bilan().forts.length) {
            <div class="card"><h3>Tes points forts</h3>
              @for (x of bilan().forts; track x.m) { <mj-barre [libelle]="cat.nomMatiere(x.m)" [pct]="x.pct" /> }
            </div>
          }
          @if (bilan().faibles.length) {
            <div class="card"><h3>À travailler en priorité</h3>
              @for (x of bilan().faibles; track x.m) { <mj-barre [libelle]="cat.nomMatiere(x.m)" [pct]="x.pct" /> }
            </div>
          }
          <div class="card hero">
            <h3>Ton objectif quotidien</h3>
            <div class="seg" role="group" aria-label="Objectif quotidien">
              @for (n of [10, 20, 40]; track n) {
                <button [class.on]="etat().goal === n" (click)="objectif(n)">{{ n }} questions</button>
              }
            </div>
            <p class="muted">L'Indice Major est une estimation de ta préparation, pas une garantie d'admission. Il devient plus précis à chaque séance.</p>
          </div>
          <button class="btn block" (click)="terminer()">Commencer ma première séance</button>
        </div>
      }
    }
  `,
})
export class Bienvenue {
  protected readonly cat = inject(CatalogueService);
  protected readonly etatService = inject(EtatService);
  private readonly seance = inject(SeanceService);
  protected readonly etat = this.etatService.etat;
  protected readonly lettres = LETTRES;

  protected readonly etape = signal(0);
  protected readonly pseudo = signal('');
  protected readonly choix = signal<string[]>([]);
  protected readonly test = signal<string[]>([]);
  protected readonly i = signal(0);
  protected readonly questionTest = computed(() => this.cat.question(this.test()[this.i()]));

  protected readonly bilan = computed(() => {
    this.etat();
    const ms = [...new Set([...this.cat.tronc, ...this.etatService.mesConcours().flatMap((c) => Object.keys(c.coefficients))])]
      .map((m) => ({ m, ...this.etatService.maitrise(m) }))
      .filter((x) => x.tot)
      .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
    return { forts: ms.filter((x) => (x.pct ?? 0) >= 60), faibles: ms.filter((x) => (x.pct ?? 0) < 60) };
  });

  coefs(c: Record<string, number>): string {
    return Object.entries(c).map(([m, k]) => this.cat.nomMatiere(m) + ' ×' + k).join(', ');
  }

  commencer(valeur: string): void {
    const p = valeur.trim() || 'Candidat';
    this.pseudo.set(p);
    this.etatService.modifier((e) => { e.pseudo = p; });
    this.etape.set(1);
  }

  basculer(id: string): void {
    this.choix.update((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  /** Test de 12 questions réparties sur le tronc commun et les matières des concours choisis. */
  lancerTest(): void {
    const ids = this.choix();
    this.etatService.modifier((e) => { e.concours = [...ids]; });
    const ms = [...new Set([...this.cat.tronc, ...ids.flatMap((id) => Object.keys(this.cat.concoursParId(id)!.coefficients))])];
    const parMatiere = Math.max(2, Math.ceil(12 / ms.length));
    this.test.set(melanger(ms.flatMap((m) => melanger(this.cat.questions.filter((q) => q.matiere === m)).slice(0, parMatiere))).slice(0, 12).map((q) => q.id));
    this.i.set(0);
    this.etape.set(2);
  }

  repondreTest(k: number): void {
    this.etatService.repondre(this.questionTest()!, k);
    if (this.i() + 1 >= this.test().length) {
      this.etatService.noterIndices();
      this.etape.set(3);
    } else {
      this.i.update((x) => x + 1);
    }
  }

  objectif(n: number): void {
    this.etatService.modifier((e) => { e.goal = n; });
  }

  terminer(): void {
    this.etatService.modifier((e) => { e.onboarded = true; });
    this.seance.demarrer();
  }
}
