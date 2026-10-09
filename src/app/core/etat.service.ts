import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CatalogueService } from './catalogue.service';
import { Concours, ConcoursId, EtatCandidat, Maitrise, MatiereId, Question } from './models';
import { ajouterJours, aujourdHui, idSemaine, jourSemaine } from './dates';
import { enregistrerReponse, indiceMajor, maitrise } from './indice';
import { NOMS_DEMO } from '../data/noms-demo';

const CLE = 'major-v1';
export const GRATUIT_PAR_JOUR = 20;

function nouvelEtat(): EtatCandidat {
  return {
    pseudo: '', concours: [], onboarded: false, stats: {}, points: 0,
    week: { id: idSemaine(), points: 0 }, goal: 20,
    day: { date: aujourdHui(), n: 0, ok: 0, pts: 0, free: 0, ia: 0 },
    streak: 0, best: 0, lastGoal: null, plus: false, exams: [], hist: {},
    team: 'Les Lions de Gounghin',
  };
}

function charger(): EtatCandidat {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...nouvelEtat(), ...JSON.parse(brut) } : nouvelEtat();
  } catch {
    return nouvelEtat();
  }
}

/** Valeur pseudo-aléatoire stable, pour simuler les autres candidats. */
export const graine = (n: number) => { const x = Math.sin(n) * 10000; return x - Math.floor(x); };

/**
 * État du candidat : profil, réponses, série, points.
 * Gardé dans le navigateur (localStorage) pour la V1 ; sera synchronisé avec un serveur à l'étape 3.
 */
@Injectable({ providedIn: 'root' })
export class EtatService {
  private readonly cat = inject(CatalogueService);
  private readonly _etat = signal<EtatCandidat>(charger());
  readonly etat = this._etat.asReadonly();

  readonly mesConcours = computed<Concours[]>(() =>
    this.etat().concours
      .map((id) => this.cat.concoursParId(id))
      .filter((c): c is Concours => !!c)
      .sort((a, b) => a.joursAvantEpreuve - b.joursAvantEpreuve),
  );

  constructor() {
    this.nouvelleJournee();
    effect(() => {
      const e = this.etat();
      try { localStorage.setItem(CLE, JSON.stringify(e)); } catch { /* stockage indisponible : on continue sans sauvegarde */ }
    });
  }

  /** Modifie l'état puis notifie l'interface. */
  modifier(fn: (e: EtatCandidat) => void): void {
    this._etat.update((e) => { const copie = structuredClone(e); fn(copie); return copie; });
  }

  reinitialiser(): void {
    this._etat.set(nouvelEtat());
  }

  /** Change de jour et de semaine si besoin ; la série tombe si l'objectif d'hier n'a pas été atteint. */
  nouvelleJournee(): void {
    const e = this.etat();
    const jour = aujourdHui();
    if (e.day.date === jour && e.week.id === idSemaine()) return;
    this.modifier((s) => {
      if (s.day.date !== jour) {
        if (s.lastGoal && s.lastGoal < ajouterJours(jour, -1)) s.streak = 0;
        s.day = { date: jour, n: 0, ok: 0, pts: 0, free: 0, ia: 0 };
      }
      if (s.week.id !== idSemaine()) s.week = { id: idSemaine(), points: 0 };
    });
  }

  // ---------- Calculs ----------

  maitrise(m: MatiereId): Maitrise {
    return maitrise(m, this.etat().stats, (id) => this.cat.question(id));
  }

  indice(c: Concours): number {
    return indiceMajor(c, (m) => this.maitrise(m));
  }

  /** Enregistre une réponse (k = -1 pour « Je ne sais pas ») et renvoie vrai si elle est juste. */
  repondre(q: Question, k: number): boolean {
    const juste = k === q.reponse;
    this.modifier((s) => { s.stats[q.id] = enregistrerReponse(s.stats[q.id], juste, aujourdHui()); });
    return juste;
  }

  /** Note l'Indice Major du jour de chaque concours, pour tracer son évolution. */
  noterIndices(): void {
    const valeurs = this.mesConcours().map((c) => [c.id, this.indice(c)] as const);
    const jour = aujourdHui();
    this.modifier((s) => {
      for (const [id, v] of valeurs) {
        const h = (s.hist[id] ??= []);
        if (!h.length || h[h.length - 1].d !== jour) h.push({ d: jour, v });
        else h[h.length - 1].v = v;
      }
    });
  }

  /**
   * Compose une séance : d'abord les questions ratées à revoir, puis les jamais vues, puis le reste.
   * Les matières du concours le plus proche passent en priorité.
   */
  composerSeance(n: number, seulement?: MatiereId): string[] {
    const e = this.etat();
    const cs = this.mesConcours();
    const proche = cs[0];
    const tronc = this.cat.tronc;
    const poids = (m: MatiereId) =>
      (tronc.includes(m) ? 1 : 0) + (proche?.coefficients[m] ?? 0) + (cs.some((c) => c.coefficients[m]) ? 0.5 : 0);
    const jour = aujourdHui();
    const pool = this.cat.questions.filter((q) =>
      seulement ? q.matiere === seulement : tronc.includes(q.matiere) || cs.some((c) => this.cat.questionPourConcours(q, c)),
    );
    const score = (q: Question) => {
      const s = e.stats[q.id];
      const b = Math.random() * 0.8 + poids(q.matiere) * 0.3;
      if (!s) return b + 2;
      if (s.ko > s.ok && s.due <= jour) return b + 4;
      if (s.due <= jour) return b + 1;
      return b - 2;
    };
    return pool.map((q) => [score(q), q.id] as const).sort((a, b) => b[0] - a[0]).slice(0, n).map((x) => x[1]);
  }

  /** Ligue de la semaine : 29 candidats simulés + le candidat. */
  ligue(): { nom: string; pts: number; moi?: boolean }[] {
    const e = this.etat();
    const sem = parseInt(e.week.id.split('-')[1]) || 1;
    const avancement = jourSemaine() / 7;
    const autres = NOMS_DEMO.map((nom, k) => ({ nom, pts: Math.round((200 + 1100 * graine(k * 13 + sem)) * avancement) }));
    return [...autres, { nom: e.pseudo + ' (toi)', pts: e.week.points, moi: true }].sort((a, b) => b.pts - a.pts);
  }

  basculerConcours(id: ConcoursId): boolean {
    const e = this.etat();
    if (e.concours.includes(id)) {
      if (e.concours.length <= 1) return false;
      this.modifier((s) => { s.concours = s.concours.filter((x) => x !== id); });
    } else {
      this.modifier((s) => { s.concours.push(id); });
    }
    this.noterIndices();
    return true;
  }
}
