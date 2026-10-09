import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CatalogueService } from '../core/catalogue.service';
import { EtatService } from '../core/etat.service';
import { SeanceService } from '../core/seance.service';

const LETTRES = ['A', 'B', 'C', 'D'];
const BRAVOS = ['Exact !', 'Bien vu !', 'Bravo !'];

/** Une question à la fois, correction expliquée, astuce pour retenir. Touches A à D et Entrée au clavier. */
@Component({
  selector: 'mj-seance',
  template: `
    @if (s(); as s) {
      @let q = question()!;
      <div class="center" style="display:grid;gap:16px">
        <div class="topq">
          <button class="link" aria-label="Arrêter la séance" (click)="quitter.set(true)">✕</button>
          <div class="bar"><i [style.width.%]="(100 * (s.i + (s.shown ? 1 : 0))) / s.ids.length"></i></div>
          <span class="num muted">{{ s.i + 1 }} / {{ s.ids.length }}</span>
        </div>
        <div class="row" style="justify-content:flex-start">
          <span class="chip">{{ cat.nomMatiere(q.matiere) }}</span>
          @if (dejaRatee() && !s.shown) { <span class="chip red">Déjà ratée {{ dejaRatee() }} fois</span> }
          @if (s.combo >= 2 && !s.shown) { <span class="chip gold">🔥 {{ s.combo }} d'affilée</span> }
        </div>
        <p class="q">{{ q.enonce }}</p>
        <div class="opts">
          @for (c of q.choix; track $index) {
            <button class="opt" [class]="classeOption($index)" [disabled]="s.shown" [attr.aria-pressed]="$index === s.sel" (click)="seance.choisir($index)">
              <b>{{ lettres[$index] }}</b>{{ c }}
            </button>
          }
        </div>
        @if (!s.shown) {
          <button class="link" style="justify-self:center" (click)="seance.choisir(-1)">Je ne sais pas</button>
        } @else {
          @let juste = s.sel === q.reponse;
          <div class="verdict" [class.ok]="juste" [class.ko]="!juste" aria-live="polite">
            <h3>{{ juste ? bravos[s.i % 3] + ' +' + s.dernierGain + ' pts' : s.sel === -1 ? "Pas grave, on l'apprend maintenant." : 'Pas tout à fait.' }}</h3>
            <p>@if (!juste && s.sel != null && s.sel >= 0) {Tu as choisi « {{ q.choix[s.sel] }} ». }{{ q.explication }}</p>
            <p class="muted"><b>Pour retenir :</b> {{ q.astuce }}</p>
            @if (s.alt) {
              <p class="muted" style="border-top:1px solid var(--line);padding-top:8px">
                <b>Autrement dit (IA, démo) :</b> la bonne réponse est « {{ q.choix[q.reponse] }} ». {{ q.astuce }}
                Refais cette question dans {{ juste ? 'quelques jours' : 'demain' }} pour l'ancrer.
              </p>
            }
          </div>
          @if (!s.alt) { <button class="link" (click)="seance.expliquerAutrement()">Explique-moi autrement</button> }
        }
        <button class="btn block" [disabled]="!s.shown && s.sel == null" (click)="s.shown ? seance.suivante() : seance.valider()">
          {{ s.shown ? (s.i + 1 < s.ids.length ? 'Question suivante' : 'Voir mon bilan') : 'Valider' }}
        </button>
        @if (quitter()) {
          <div class="card">
            <p><b>Arrêter la séance ?</b> Tes réponses sont gardées.</p>
            <div class="row" style="justify-content:flex-start">
              <button class="btn" (click)="seance.arreter()">Arrêter</button>
              <button class="link" (click)="quitter.set(false)">Continuer</button>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="center card"><p>Aucune séance en cours.</p><button class="btn" (click)="seance.demarrer()">Commencer une séance</button></div>
    }
  `,
})
export class SeancePage {
  protected readonly cat = inject(CatalogueService);
  private readonly etat = inject(EtatService);
  protected readonly seance = inject(SeanceService);
  protected readonly lettres = LETTRES;
  protected readonly bravos = BRAVOS;
  protected readonly s = this.seance.seance;
  protected readonly quitter = signal(false);

  protected readonly question = computed(() => { const s = this.s(); return s ? this.cat.question(s.ids[s.i]) : undefined; });
  protected readonly dejaRatee = computed(() => { const q = this.question(); return q ? this.etat.etat().stats[q.id]?.ko ?? 0 : 0; });

  classeOption(k: number): string {
    const s = this.s()!;
    const q = this.question()!;
    if (s.shown) return 'opt ' + (k === q.reponse ? 'ok' : k === s.sel ? 'ko' : 'dim');
    return 'opt' + (k === s.sel ? ' sel' : '');
  }

  @HostListener('document:keydown', ['$event'])
  clavier(ev: KeyboardEvent): void {
    const s = this.s();
    const cible = ev.target as HTMLElement;
    if (!s || cible.tagName === 'INPUT') return;
    const k = 'abcd'.indexOf(ev.key.toLowerCase());
    if (k >= 0 && !s.shown) this.seance.choisir(k);
    if (ev.key === 'Enter' && !cible.closest('button')) {
      if (!s.shown && s.sel != null) this.seance.valider();
      else if (s.shown) this.seance.suivante();
    }
  }
}
