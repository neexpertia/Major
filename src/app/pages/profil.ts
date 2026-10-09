import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogueService } from '../core/catalogue.service';
import { EtatService, GRATUIT_PAR_JOUR } from '../core/etat.service';
import { UiService } from '../core/ui.service';
import { SeanceService } from '../core/seance.service';
import { ExamenService } from '../core/examen.service';

/** Profil : prénom, concours suivis, objectif quotidien, abonnement, remise à zéro. */
@Component({
  selector: 'mj-profil',
  template: `
    @let e = etat();
    <h1>Profil</h1>
    <div class="card">
      <label class="label" for="pp">Prénom affiché</label>
      <div class="row">
        <input #pp id="pp" class="input" style="flex:1;min-width:180px" [value]="e.pseudo" maxlength="20" />
        <button class="btn ghost" (click)="renommer(pp.value)">Enregistrer</button>
      </div>
    </div>
    <div class="card">
      <h3>Mes concours</h3>
      <p class="muted">Ajoute ou retire des concours à tout moment.</p>
      @for (c of cat.concours; track c.id) {
        <button class="pick" [class.on]="e.concours.includes(c.id)" [attr.aria-pressed]="e.concours.includes(c.id)" (click)="basculer(c.id)">
          <span class="row"><b>{{ c.nom }}</b><span class="muted">{{ c.domaine }} · J-{{ c.joursAvantEpreuve }}</span></span>
        </button>
      }
    </div>
    <div class="card">
      <h3>Objectif quotidien</h3>
      <div class="seg">
        @for (n of [10, 20, 40]; track n) {
          <button [class.on]="e.goal === n" (click)="objectif(n)">{{ n }} questions</button>
        }
      </div>
    </div>
    <div class="card" [class.hero]="e.plus">
      <div class="row"><h3>Abonnement</h3><span class="chip" [class.plain]="!e.plus">{{ e.plus ? 'Major+ actif' : 'Gratuit' }}</span></div>
      <p class="muted">{{ e.plus ? "Séances illimitées, examen blanc avec rang, explications de l'IA sans limite." : gratuit + ' questions gratuites par jour. La série 🔥 continue même sans payer.' }}</p>
      @if (e.plus) {
        <button class="link" (click)="versGratuit()">Revenir à la version gratuite (démo)</button>
      } @else {
        <button class="btn gold" style="justify-self:start" (click)="ui.abonnement.set('plus')">Découvrir Major+</button>
      }
    </div>
    <div class="card">
      <h3>Données de démonstration</h3>
      <p class="muted">Tes réponses sont gardées dans ce navigateur uniquement.</p>
      @if (confirmerReset()) {
        <p><b>Effacer toutes tes réponses et recommencer ?</b></p>
        <div class="row" style="justify-content:flex-start">
          <button class="btn" (click)="reinitialiser()">Tout effacer</button>
          <button class="link" (click)="confirmerReset.set(false)">Annuler</button>
        </div>
      } @else {
        <button class="btn ghost" style="justify-self:start" (click)="confirmerReset.set(true)">Tout recommencer</button>
      }
    </div>
  `,
})
export class Profil {
  protected readonly cat = inject(CatalogueService);
  private readonly etatService = inject(EtatService);
  protected readonly ui = inject(UiService);
  private readonly seance = inject(SeanceService);
  private readonly examen = inject(ExamenService);
  private readonly router = inject(Router);
  protected readonly etat = this.etatService.etat;
  protected readonly gratuit = GRATUIT_PAR_JOUR;
  protected readonly confirmerReset = signal(false);

  renommer(v: string): void {
    const p = v.trim();
    if (p) this.etatService.modifier((e) => { e.pseudo = p; });
    this.ui.message('Prénom enregistré.');
  }

  basculer(id: string): void {
    if (!this.etatService.basculerConcours(id)) this.ui.message('Garde au moins un concours.');
  }

  objectif(n: number): void {
    this.etatService.modifier((e) => { e.goal = n; });
  }

  versGratuit(): void {
    this.etatService.modifier((e) => { e.plus = false; });
  }

  reinitialiser(): void {
    this.seance.seance.set(null);
    this.examen.abandonner();
    this.etatService.reinitialiser();
    this.router.navigate(['/bienvenue']);
  }
}
