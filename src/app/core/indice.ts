import { Concours, Maitrise, MatiereId, Question, StatQuestion } from './models';
import { ajouterJours } from './dates';

/**
 * Calculs de l'Indice Major. Fonctions pures, faciles à tester et à ajuster
 * quand on connaîtra les vraies règles des épreuves (points négatifs, notes éliminatoires...).
 */

/** Maîtrise d'une matière à partir des réponses données. */
export function maitrise(m: MatiereId, stats: Record<string, StatQuestion>, question: (id: string) => Question | undefined): Maitrise {
  let ok = 0;
  let tot = 0;
  for (const [id, s] of Object.entries(stats)) {
    if (question(id)?.matiere === m) {
      ok += s.ok;
      tot += s.ok + s.ko;
    }
  }
  return { pct: tot ? Math.round((100 * ok) / tot) : null, tot, est: Math.round((100 * (ok + 1)) / (tot + 2)) };
}

/**
 * Indice Major d'un concours, de 0 à 100 : moyenne des maîtrises pondérée par les coefficients.
 * Tant qu'une matière a peu de réponses (moins de 6), on la tire vers 35 pour ne pas surestimer.
 * C'est une estimation, jamais une garantie d'admission.
 */
export function indiceMajor(c: Concours, m: (id: MatiereId) => Maitrise): number {
  let num = 0;
  let den = 0;
  for (const [mat, k] of Object.entries(c.coefficients)) {
    const x = m(mat);
    const confiance = Math.min(1, x.tot / 6);
    num += k * (x.est * confiance + 35 * (1 - confiance));
    den += k;
  }
  return den ? Math.round(num / den) : 0;
}

/** Position estimée parmi les candidats (en % du haut). Courbe simulée tant qu'il n'y a pas de vrais candidats. */
export function topPourcent(indice: number): number {
  return Math.max(1, Math.round(100 / (1 + Math.exp((indice - 55) / 9))));
}

/** Répétition espacée : une erreur revient le lendemain, une bonne réponse dans 3, 7 puis 14 jours. */
export function enregistrerReponse(s: StatQuestion | undefined, juste: boolean, jour: string): StatQuestion {
  const r = s ? { ...s } : { ok: 0, ko: 0, due: jour };
  if (juste) {
    r.ok++;
    r.due = ajouterJours(jour, r.ok >= 3 ? 14 : r.ok === 2 ? 7 : 3);
  } else {
    r.ko++;
    r.due = ajouterJours(jour, 1);
  }
  return r;
}

/** Couleur d'une barre de progression : vert à partir de 70 %, ocre de 50 à 70 %, rouge en dessous. */
export function couleurPct(p: number | null): string {
  return p == null ? 'plain' : p >= 70 ? '' : p >= 50 ? 'gold' : 'red';
}
