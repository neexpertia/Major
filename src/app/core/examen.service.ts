import { Injectable, inject, signal } from '@angular/core';
import { CatalogueService } from './catalogue.service';
import { EtatService } from './etat.service';
import { ConcoursId, MatiereId } from './models';
import { aujourdHui } from './dates';
import { topPourcent } from './indice';

const DUREE_MS = 10 * 60_000;
const NB_QUESTIONS = 12;

export interface Examen {
  cid: ConcoursId;
  ids: string[];
  i: number;
  ans: (number | null)[];
  flag: boolean[];
  fin: number;
  done: boolean;
  confirm: boolean;
  res?: { note: number; rang: number; sur: number; parM: Record<MatiereId, { ok: number; n: number }>; ko: string[] };
}

const melanger = <T>(t: T[]) => [...t].sort(() => Math.random() - 0.5);

/** Examen blanc chronométré, sans correction pendant l'épreuve. Version courte pour la démo. */
@Injectable({ providedIn: 'root' })
export class ExamenService {
  private readonly cat = inject(CatalogueService);
  private readonly etat = inject(EtatService);

  readonly examen = signal<Examen | null>(null);
  readonly restant = signal(0);
  private minuteur?: ReturnType<typeof setInterval>;

  demarrer(cid: ConcoursId): void {
    const c = this.cat.concoursParId(cid)!;
    const ids = melanger(
      Object.keys(c.coefficients).flatMap((m) =>
        melanger(this.cat.questions.filter((q) => this.cat.questionPourConcours(q, c) && q.matiere === m)).slice(0, 3),
      ),
    ).slice(0, NB_QUESTIONS).map((q) => q.id);
    this.examen.set({ cid, ids, i: 0, ans: ids.map(() => null), flag: ids.map(() => false), fin: Date.now() + DUREE_MS, done: false, confirm: false });
    this.restant.set(DUREE_MS);
    clearInterval(this.minuteur);
    this.minuteur = setInterval(() => {
      const ex = this.examen();
      if (!ex || ex.done) { clearInterval(this.minuteur); return; }
      const reste = ex.fin - Date.now();
      if (reste <= 0) this.terminer();
      else this.restant.set(reste);
    }, 1000);
  }

  maj(fn: (e: Examen) => Partial<Examen>): void {
    const ex = this.examen();
    if (ex) this.examen.set({ ...ex, ...fn(ex) });
  }

  repondre(k: number): void {
    this.maj((ex) => {
      const ans = [...ex.ans];
      ans[ex.i] = k;
      return { ans, i: ex.i + 1 < ex.ids.length ? ex.i + 1 : ex.i };
    });
  }

  aller(k: number): void {
    this.maj((ex) => (k >= 0 && k < ex.ids.length ? { i: k } : {}));
  }

  marquer(): void {
    this.maj((ex) => { const flag = [...ex.flag]; flag[ex.i] = !flag[ex.i]; return { flag }; });
  }

  abandonner(): void {
    clearInterval(this.minuteur);
    this.examen.set(null);
  }

  /** Note sur 20 selon les coefficients du concours, puis rang simulé. */
  terminer(): void {
    clearInterval(this.minuteur);
    const ex = this.examen();
    if (!ex || ex.done) return;
    const c = this.cat.concoursParId(ex.cid)!;
    const parM: Record<MatiereId, { ok: number; n: number }> = {};
    const ko: string[] = [];
    ex.ids.forEach((id, k) => {
      const q = this.cat.question(id)!;
      const juste = ex.ans[k] === q.reponse;
      const p = (parM[q.matiere] ??= { ok: 0, n: 0 });
      p.n++;
      p.ok += juste ? 1 : 0;
      this.etat.repondre(q, ex.ans[k] ?? -1);
      if (!juste) ko.push(id);
    });
    let num = 0;
    let den = 0;
    for (const [m, x] of Object.entries(parM)) {
      const k = c.coefficients[m] || 1;
      num += (k * x.ok) / x.n;
      den += k;
    }
    const note = Math.round((40 * num) / den) / 2;
    const sur = 3120;
    const rang = Math.max(1, Math.round((sur * topPourcent(note * 5)) / 100));
    this.examen.set({ ...ex, done: true, confirm: false, res: { note, rang, sur, parM, ko } });
    this.etat.modifier((e) => { e.exams.push({ d: aujourdHui(), cid: ex.cid, note, rang, sur }); });
    this.etat.noterIndices();
  }
}
