import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { EtatService } from './core/etat.service';
import { UiService } from './core/ui.service';
import { Icone } from './shared/icone';
import { Abonnement } from './shared/abonnement';

/** Coque de l'application : barre latérale sur ordinateur, barre d'onglets en bas sur téléphone. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icone, Abonnement],
  template: `
    <div class="app">
      <aside class="side">
        <div class="logo">Major</div>
        @if (inscrit()) {
          @for (o of onglets; track o.lien) {
            <a class="nav" [routerLink]="'/' + o.lien" [class.on]="actif() === o.lien"><mj-icone [nom]="o.lien" />{{ o.libelle }}</a>
          }
          <a class="nav" routerLink="/examen" routerLinkActive="on"><mj-icone nom="examen" />Examen blanc</a>
        }
        <div class="foot">
          @if (inscrit()) {
            <span class="chip gold">🔥 {{ etat().streak }} jour{{ etat().streak > 1 ? 's' : '' }}</span>
            <span class="muted num" style="font-size:.85rem">{{ etat().points.toLocaleString('fr-FR') }} points</span>
          }
          <span class="muted" style="font-size:.78rem">Démo : données d'exemple</span>
        </div>
      </aside>
      <main><div class="view"><router-outlet /></div></main>
      @if (inscrit() && !concentration()) {
        <nav class="tabbar" aria-label="Navigation">
          @for (o of onglets; track o.lien) {
            <a class="nav" [routerLink]="'/' + o.lien" [class.on]="actif() === o.lien"><mj-icone [nom]="o.lien" />{{ o.libelle }}</a>
          }
        </nav>
      }
    </div>
    <mj-abonnement />
    @if (ui.toast(); as t) { <div class="toast" role="status">{{ t }}</div> }
  `,
})
export class App {
  private readonly etatService = inject(EtatService);
  protected readonly ui = inject(UiService);
  protected readonly etat = this.etatService.etat;
  protected readonly inscrit = computed(() => this.etat().onboarded);

  protected readonly onglets = [
    { lien: 'aujourdhui', libelle: "Aujourd'hui" },
    { lien: 'progres', libelle: 'Progrès' },
    { lien: 'classement', libelle: 'Classement' },
    { lien: 'profil', libelle: 'Profil' },
  ];

  private readonly url = toSignal(
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd), map((e) => e.urlAfterRedirects)),
    { initialValue: '/' },
  );
  /** Onglet à mettre en avant : les écrans secondaires se rattachent à leur onglet. */
  protected readonly actif = computed(() => {
    const seg = this.url().split(/[/?]/)[1] ?? '';
    return ({ seance: 'aujourdhui', bilan: 'aujourdhui', examen: 'aujourdhui', concours: 'progres' } as Record<string, string>)[seg] ?? seg;
  });
  /** Pendant une séance ou un examen, on cache la barre d'onglets. */
  protected readonly concentration = computed(() => /^\/(seance|examen)/.test(this.url()));
}
