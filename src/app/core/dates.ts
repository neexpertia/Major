/** Dates au format AAAA-MM-JJ, comme dans le prototype. */

export const aujourdHui = (): string => new Date().toISOString().slice(0, 10);

export function ajouterJours(date: string, n: number): string {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export function idSemaine(d = new Date()): string {
  const debut = new Date(d.getFullYear(), 0, 1);
  return d.getFullYear() + '-' + Math.ceil(((d.getTime() - debut.getTime()) / 864e5 + debut.getDay() + 1) / 7);
}

/** Jour de la semaine de 1 (lundi) à 7 (dimanche). */
export const jourSemaine = (d = new Date()): number => d.getDay() || 7;
