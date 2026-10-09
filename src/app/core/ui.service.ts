import { Injectable, signal } from '@angular/core';

/** Petits éléments d'interface partagés : message bref (toast) et fenêtre d'abonnement. */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly toast = signal<string | null>(null);
  /** null : fenêtre fermée ; 'limit' : questions gratuites épuisées ; 'plus' : découverte de Major+. */
  readonly abonnement = signal<'limit' | 'plus' | null>(null);
  private minuteur?: ReturnType<typeof setTimeout>;

  message(texte: string): void {
    this.toast.set(texte);
    clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => this.toast.set(null), 2600);
  }

  copier(texte: string, confirmation: string): void {
    navigator.clipboard?.writeText(texte).then(
      () => this.message(confirmation),
      () => this.message(texte),
    ) ?? this.message(texte);
  }
}
