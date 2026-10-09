import { Injectable } from '@angular/core';
import { Concours, ConcoursId, Matiere, MatiereId, Question } from './models';
import matieresJson from '../data/matieres.json';
import concoursJson from '../data/concours.json';
import questionsJson from '../data/questions.json';

/**
 * Catalogue en lecture seule : matières, concours et banque de questions.
 * Les données viennent des fichiers JSON de src/app/data ; plus tard, d'un serveur.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  readonly matieres = matieresJson as unknown as Matiere[];
  readonly concours = concoursJson as unknown as Concours[];
  readonly questions = questionsJson as unknown as Question[];

  readonly tronc: MatiereId[] = this.matieres.filter((m) => m.troncCommun).map((m) => m.id);

  private readonly parId = new Map(this.questions.map((q) => [q.id, q]));
  private readonly nomsMatieres = new Map(this.matieres.map((m) => [m.id, m.nom]));

  question(id: string): Question | undefined {
    return this.parId.get(id);
  }

  nomMatiere(id: MatiereId): string {
    return this.nomsMatieres.get(id) ?? id;
  }

  concoursParId(id: ConcoursId): Concours | undefined {
    return this.concours.find((c) => c.id === id);
  }

  /** Une question compte pour un concours si sa matière y a un coefficient et qu'elle n'est pas réservée à d'autres concours. */
  questionPourConcours(q: Question, c: Concours): boolean {
    return !!c.coefficients[q.matiere] && (q.concours.length === 0 || q.concours.includes(c.id));
  }
}
