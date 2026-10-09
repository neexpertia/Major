import { describe, expect, it } from 'vitest';
import { enregistrerReponse, indiceMajor, topPourcent } from './indice';
import { Concours, Maitrise } from './models';

const douanes: Concours = {
  id: 'dou', nom: 'Contrôleur des douanes', domaine: 'Finances', niveau: 'BAC', joursAvantEpreuve: 40,
  candidatsAttendus: '≈ 95 000', coefficients: { fr: 2, eco: 3 },
};

describe('Indice Major', () => {
  it('reste prudent (35) tant que rien n\'a été travaillé', () => {
    const vide: Maitrise = { pct: null, tot: 0, est: 50 };
    expect(indiceMajor(douanes, () => vide)).toBe(35);
  });

  it('suit la maîtrise pondérée par les coefficients une fois assez de réponses', () => {
    const m: Record<string, Maitrise> = { fr: { pct: 100, tot: 10, est: 92 }, eco: { pct: 50, tot: 10, est: 50 } };
    expect(indiceMajor(douanes, (x) => m[x])).toBe(Math.round((2 * 92 + 3 * 50) / 5));
  });

  it('place un indice élevé dans le haut du classement', () => {
    expect(topPourcent(90)).toBeLessThan(topPourcent(50));
    expect(topPourcent(100)).toBeGreaterThanOrEqual(1);
  });
});

describe('Répétition espacée', () => {
  it('fait revenir une erreur le lendemain et espace les bonnes réponses', () => {
    const j = '2026-10-09';
    expect(enregistrerReponse(undefined, false, j).due).toBe('2026-10-10');
    const s1 = enregistrerReponse(undefined, true, j);
    expect(s1.due).toBe('2026-10-12');
    expect(enregistrerReponse(s1, true, j).due).toBe('2026-10-16');
  });
});
