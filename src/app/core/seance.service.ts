import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogueService } from './catalogue.service';
import { EtatService, GRATUIT_PAR_JOUR } from './etat.service';
import { UiService } from './ui.service';
import { ConcoursId, MatiereId } from './models';
import { ajouterJours, aujourdHui } from './dates';

export interface Seance {
  ids: string[];
  i: number;
  sel: number | null;
  shown: boolean;
  ok: number;
  pts: number;
  combo: number;
  dernierGain: number;
  /** Indice de chaque concours au début de la séance, pour afficher le gain. */
  avant: Record<ConcoursId, number>;
  alt: boolean;
}

/** Déroulé d'une séance d'entraînement : questions, correction, points, série. */
@Injectable({ providedIn: 'root' })
export class SeanceService {
  private readonly cat = inject(CatalogueService);
  private readonly etat = inject(EtatService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);

  readonly seance = signal<Seance | null>(null);

  demarrer(seulement?: MatiereId): void {
    const e = this.etat.etat();
    if (!e.plus && e.day.free >= GRATUIT_PAR_JOUR) { this.ui.abonnement.set('limit'); return; }
    const n = e.day.n >= e.goal ? 10 : Math.min(10, e.goal - e.day.n);
    const avant = Object.fromEntries(this.etat.mesConcours().map((c) => [c.id, this.etat.indice(c)]));
    this.seance.set({ ids: this.etat.composerSeance(n, seulement), i: 0, sel: null, shown: false, ok: 0, pts: 0, combo: 0, dernierGain: 0, avant, alt: false });
    this.router.navigate(['/seance']);
  }

  choisir(k: number): void {
    const s = this.seance();
    if (!s || s.shown) return;
    this.seance.set({ ...s, sel: k });
    if (k === -1) this.valider();
  }

  valider(): void {
    const s = this.seance();
    if (!s || s.shown || s.sel == null) return;
    const q = this.cat.question(s.ids[s.i])!;
    const juste = this.etat.repondre(q, s.sel);
    const combo = juste ? s.combo + 1 : 0;
    const gain = juste ? 10 + 2 * Math.max(0, combo - 1) : 0;
    const jour = aujourdHui();
    this.etat.modifier((e) => {
      e.points += gain; e.week.points += gain; e.day.pts += gain; e.day.n++; e.day.ok += juste ? 1 : 0;
      if (!e.plus) e.day.free++;
      if (e.day.n === e.goal && e.lastGoal !== jour) {
        e.streak = (e.lastGoal === ajouterJours(jour, -1) ? e.streak : 0) + 1;
        e.best = Math.max(e.best, e.streak);
        e.lastGoal = jour;
      }
    });
    this.seance.set({ ...s, shown: true, combo, dernierGain: gain, ok: s.ok + (juste ? 1 : 0), pts: s.pts + gain });
  }

  suivante(): void {
    const s = this.seance();
    if (!s) return;
    const e = this.etat.etat();
    if (s.i + 1 >= s.ids.length) { this.terminer(); return; }
    if (!e.plus && e.day.free >= GRATUIT_PAR_JOUR) { this.terminer(); setTimeout(() => this.ui.abonnement.set('limit'), 300); return; }
    this.seance.set({ ...s, i: s.i + 1, sel: null, shown: false, alt: false });
  }

  /** « Explique-moi autrement » : 3 fois par jour en gratuit. */
  expliquerAutrement(): void {
    const s = this.seance();
    if (!s) return;
    const e = this.etat.etat();
    if (!e.plus && e.day.ia >= 3) { this.ui.abonnement.set('plus'); return; }
    this.etat.modifier((x) => { x.day.ia++; });
    this.seance.set({ ...s, alt: true });
  }

  arreter(): void {
    this.etat.noterIndices();
    this.seance.set(null);
    this.router.navigate(['/aujourdhui']);
  }

  private terminer(): void {
    this.etat.noterIndices();
    this.router.navigate(['/bilan']);
  }
}
