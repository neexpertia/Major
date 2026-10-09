import { Component, inject, signal } from '@angular/core';
import { UiService } from '../core/ui.service';
import { EtatService } from '../core/etat.service';

/** Fenêtre Major+ : offre, choix de la formule et paiement mobile (simulé). */
@Component({
  selector: 'mj-abonnement',
  template: `
    @if (ui.abonnement(); as raison) {
      <div class="overlay" (click)="fermer()">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pwt" (click)="$event.stopPropagation()">
          <h2 id="pwt">{{ raison === 'limit' ? 'Tu as fini tes questions gratuites du jour' : 'Passe à Major+' }}</h2>
          <p class="muted">Avec Major+, continue autant que tu veux, pour tous tes concours, jusqu'au jour J.</p>
          <ul class="list">
            <li>Séances illimitées</li>
            <li>Examen blanc avec rang et correction détaillée</li>
            <li>Explications de l'IA sans limite</li>
            <li>Séances téléchargeables hors ligne</li>
          </ul>
          <button class="pick" [class.on]="formule() === '4m'" (click)="formule.set('4m')">
            <span class="row"><b>Pack concours · 4 mois</b><span class="chip gold">Le plus choisi</span></span>
            <span class="num"><b>5 000 F</b> <span class="muted">soit 1 250 F par mois</span></span>
          </button>
          <button class="pick" [class.on]="formule() === '1m'" (click)="formule.set('1m')">
            <span class="row"><b>1 mois</b><span class="num">1 500 F</span></span>
          </button>
          @if (operateur(); as op) {
            <div class="card" style="border-color:var(--gold)">
              <b>Confirme le paiement sur ton téléphone</b>
              <p class="muted">{{ op }} t'envoie une demande. Saisis ton code secret pour valider. Cette fenêtre se met à jour toute seule.</p>
              <button class="btn block" (click)="confirmer()">Simuler la confirmation</button>
            </div>
          } @else {
            <div style="display:grid;gap:8px">
              <button class="btn block" (click)="operateur.set('Orange Money')">Payer avec Orange Money</button>
              <button class="btn ghost block" (click)="operateur.set('Moov Money')">Payer avec Moov Money</button>
            </div>
          }
          <button class="link" style="justify-self:center" (click)="fermer()">Revenir demain gratuitement</button>
          <p class="muted" style="font-size:.8rem;text-align:center">Démo : aucun paiement réel. Prix à tester.</p>
        </div>
      </div>
    }
  `,
})
export class Abonnement {
  protected readonly ui = inject(UiService);
  private readonly etat = inject(EtatService);
  protected readonly formule = signal<'4m' | '1m'>('4m');
  protected readonly operateur = signal<string | null>(null);

  fermer(): void {
    this.operateur.set(null);
    this.ui.abonnement.set(null);
  }

  confirmer(): void {
    this.etat.modifier((e) => { e.plus = true; });
    this.fermer();
    this.ui.message('Major+ est actif. Bonne préparation !');
  }
}
