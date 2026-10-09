import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EtatService } from '../core/etat.service';
import { SeanceService } from '../core/seance.service';
import { UiService } from '../core/ui.service';
import { couleurPct } from '../core/indice';

/** Fin de séance : score, points, évolution de l'Indice Major et place en ligue. */
@Component({
  selector: 'mj-bilan',
  imports: [RouterLink],
  template: `
    @if (seance.seance(); as s) {
      @let e = etat();
      <div class="center" style="display:grid;gap:16px">
        @if (objectifAtteint()) {
          <span class="chip gold" style="justify-self:start;font-size:1rem;padding:6px 14px">🔥 {{ e.streak }} jour{{ e.streak > 1 ? 's' : '' }} d'affilée</span>
        }
        <h1>{{ objectifAtteint() ? 'Séance terminée. Objectif du jour atteint.' : 'Séance terminée.' }}</h1>
        <div class="grid2">
          <div class="card"><div class="stat"><span class="big num">{{ s.ok }}/{{ s.ids.length }}</span><span class="muted">bonnes réponses</span></div></div>
          <div class="card"><div class="stat"><span class="big gold num">+{{ s.pts }}</span><span class="muted">points</span></div></div>
        </div>
        <div class="card">
          <h3>Ton Indice Major</h3>
          @for (x of evolution(); track x.nom) {
            <div style="display:grid;gap:5px">
              <div class="row">
                <span>{{ x.nom }}</span>
                <span class="num"><b>{{ x.avant }} → {{ x.apres }}</b>
                  <span class="chip" [class.red]="x.d < 0" [class.plain]="x.d === 0">{{ x.d > 0 ? '+' : '' }}{{ x.d }}</span></span>
              </div>
              <div [class]="'bar ' + couleur(x.apres)"><i [style.width.%]="x.apres"></i></div>
            </div>
          }
        </div>
        <div class="card">
          <div class="row"><h3>Ta ligue Bronze</h3><b>{{ ligue().rang + 1 }}e sur 30</b></div>
          <p class="muted">
            {{ ligue().rang < 5 ? "Tu es dans la zone de montée. Tiens bon jusqu'à dimanche." : 'Encore ' + ligue().manque + ' points pour entrer dans la zone de montée.' }}
          </p>
        </div>
        <button class="btn block" (click)="seance.demarrer()">Encore 10 questions</button>
        <div class="row" style="justify-content:center;gap:24px">
          <button class="link" (click)="partager()">Partager sur WhatsApp</button>
          <a class="link" routerLink="/aujourdhui">Revenir à l'accueil</a>
        </div>
      </div>
    } @else {
      <div class="center card"><p>Pas de séance terminée à afficher.</p><a class="btn" routerLink="/aujourdhui">Revenir à l'accueil</a></div>
    }
  `,
})
export class Bilan {
  private readonly etatService = inject(EtatService);
  protected readonly seance = inject(SeanceService);
  private readonly ui = inject(UiService);
  protected readonly etat = this.etatService.etat;
  protected readonly couleur = couleurPct;

  protected readonly objectifAtteint = computed(() => this.etat().day.n >= this.etat().goal);

  protected readonly evolution = computed(() => {
    this.etat();
    const s = this.seance.seance();
    return this.etatService.mesConcours().map((c) => {
      const apres = this.etatService.indice(c);
      const avant = s?.avant[c.id] ?? apres;
      return { nom: c.nom, avant, apres, d: apres - avant };
    });
  });

  protected readonly ligue = computed(() => {
    this.etat();
    const lg = this.etatService.ligue();
    const rang = lg.findIndex((x) => x.moi);
    return { rang, manque: lg[4].pts - lg[rang].pts + 1 };
  });

  partager(): void {
    const c = this.etatService.mesConcours()[0];
    const texte = `Je prépare mes concours avec Major : 🔥 ${this.etat().streak} jours d'affilée, Indice Major ${c ? this.etatService.indice(c) : ''}. Viens me défier !`;
    this.ui.copier(texte, 'Message copié. Colle-le dans WhatsApp.');
  }
}
