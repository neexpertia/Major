/** Modèle de données de Major. */

export type MatiereId = string;
export type ConcoursId = string;

export interface Matiere {
  id: MatiereId;
  nom: string;
  /** Vrai pour le tronc commun (français, culture générale, maths et logique), utile à tous les concours. */
  troncCommun: boolean;
}

export interface Concours {
  id: ConcoursId;
  nom: string;
  domaine: string;
  niveau: string;
  /** Démo : nombre de jours avant l'épreuve. À remplacer par la date officielle. */
  joursAvantEpreuve: number;
  candidatsAttendus: string;
  /** Coefficient de chaque matière de l'épreuve. */
  coefficients: Record<MatiereId, number>;
}

export type TypeQuestion = 'calcul' | 'definition' | 'actualite' | 'piege';

export interface Question {
  id: string;
  matiere: MatiereId;
  /** Classement prévu par l'étude terrain : matière > chapitre > notion. */
  chapitre: string | null;
  notion: string | null;
  /** Concours concernés. Vide : tous les concours qui ont cette matière. */
  concours: ConcoursId[];
  /** 1 facile, 2 moyen, 3 difficile. */
  difficulte: 1 | 2 | 3;
  type: TypeQuestion | null;
  enonce: string;
  choix: string[];
  /** Indice de la bonne réponse dans `choix`. */
  reponse: number;
  explication: string;
  astuce: string;
}

/** Suivi d'une question pour la répétition espacée. */
export interface StatQuestion {
  ok: number;
  ko: number;
  /** Date (AAAA-MM-JJ) à laquelle la question doit revenir. */
  due: string;
}

export interface Journee {
  date: string;
  n: number;
  ok: number;
  pts: number;
  free: number;
  ia: number;
}

export interface ResultatExamen {
  d: string;
  cid: ConcoursId;
  note: number;
  rang: number;
  sur: number;
}

export interface EtatCandidat {
  pseudo: string;
  concours: ConcoursId[];
  onboarded: boolean;
  stats: Record<string, StatQuestion>;
  points: number;
  week: { id: string; points: number };
  goal: number;
  day: Journee;
  streak: number;
  best: number;
  lastGoal: string | null;
  plus: boolean;
  exams: ResultatExamen[];
  /** Historique de l'Indice Major par concours. */
  hist: Record<ConcoursId, { d: string; v: number }[]>;
  team: string;
}

export interface Maitrise {
  /** Pourcentage de bonnes réponses, null si la matière n'a pas été travaillée. */
  pct: number | null;
  tot: number;
  /** Estimation lissée (règle de Laplace), utilisable même avec peu de réponses. */
  est: number;
}
