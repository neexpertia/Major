import { Component, computed, inject, signal } from '@angular/core';
import { EtatService, graine } from '../core/etat.service';
import { UiService } from '../core/ui.service';
import { topPourcent } from '../core/indice';
import { jourSemaine } from '../core/dates';
import { NOMS_DEMO } from '../data/noms-demo';

type Onglet = 'ligue' | 'concours' | 'prog' | 'equipe';

/** Classements : ligue de la semaine, par concours, par progression, et mode équipe. Autres candidats simulés. */
@Component({
  selector: 'mj-classement',
  template: `
    <h1>Classement</h1>
    <div class="seg" role="tablist">
      @for (o of onglets; track o[0]) {
        <button role="tab" [attr.aria-selected]="onglet() === o[0]" [class.on]="onglet() === o[0]" (click)="onglet.set(o[0])">{{ o[1] }}</button>
      }
    </div>

    @switch (onglet()) {
      @case ('ligue') {
        <div class="row"><h2>Ligue Bronze</h2><span class="muted">Fin dans {{ finSemaine }} jour{{ finSemaine > 1 ? 's' : '' }} · dimanche soir</span></div>
        <p class="muted">30 candidats. Les 5 premiers montent en ligue Argent, les 5 derniers descendent. Points de la semaine.</p>
        <div class="card" style="gap:0">
          @for (x of ligue(); track x.nom; let k = $index) {
            @if (k === 5) { <div class="zone">▲ Zone de montée : top 5</div> }
            @if (k === 25) { <div class="zone down">▼ Zone de descente</div> }
            <div class="lb" [class.me]="x.moi">
              <span class="r">{{ k + 1 }}</span>
              <span>{{ k < 3 ? medailles[k] + ' ' : '' }}@if (x.moi) {<b>{{ x.nom }}</b>} @else {{{ x.nom }}}</span>
              <b class="num">{{ x.pts.toLocaleString('fr-FR') }}</b>
            </div>
          }
        </div>
      }
      @case ('concours') {
        <p class="muted">Ton rang parmi les candidats Major de chaque concours, selon l'Indice Major. Les autres candidats sont simulés pour la démo.</p>
        <div class="grid2">
          @for (x of parConcours(); track x.nom) {
            <div class="card">
              <b>{{ x.nom }}</b>
              <div class="row" style="justify-content:flex-start"><span class="big gold num">{{ x.rang.toLocaleString('fr-FR') }}e</span><span class="muted">sur {{ x.tot.toLocaleString('fr-FR') }}<br />top {{ x.tp }} %</span></div>
              <p class="muted" style="font-size:.88rem">
                {{ x.tp <= 2 ? 'Tu es dans la zone des admissibles probables.' : "Pour viser l'admission, il faut être dans le top 1 à 2 %. Indice visé : environ " + x.vise + '.' }}
              </p>
            </div>
          }
        </div>
      }
      @case ('prog') {
        <p class="muted">Ceux dont l'Indice Major a le plus augmenté cette semaine. Tout le monde peut y être premier, même en partant de loin.</p>
        <div class="card" style="gap:0">
          @for (x of progression(); track x.nom; let k = $index) {
            <div class="lb" [class.me]="x.moi"><span class="r">{{ k + 1 }}</span><span>@if (x.moi) {<b>{{ x.nom }}</b>} @else {{{ x.nom }}}</span><b class="num" style="color:var(--green)">+{{ x.d }}</b></div>
          }
        </div>
      }
      @case ('equipe') {
        <div class="row"><h2>{{ etat().team }}</h2><span class="chip gold">3e équipe sur 41</span></div>
        <div class="card hero">
          <div class="row"><h3>Défi de la semaine</h3><span class="num">{{ defi() }} / 500 questions</span></div>
          <div class="bar gold"><i [style.width.%]="defi() / 5"></i></div>
          <p class="muted">500 questions à vous tous avant dimanche.</p>
        </div>
        <div class="card" style="gap:0">
          <h3 style="padding-bottom:8px">Membres</h3>
          @for (x of membres(); track x.nom) {
            <div class="lb" [class.me]="x.moi">
              <span class="r">{{ x.fait ? '✓' : '·' }}</span>
              <span>@if (x.moi) {<b>{{ x.nom }} (toi)</b>} @else {{{ x.nom }}} <span class="muted" style="font-size:.85rem">· {{ x.fait ? '🔥 ' + x.s : "pas encore aujourd'hui" }}</span></span>
              <b class="num">{{ x.i }}</b>
            </div>
          }
        </div>
        <div class="row" style="justify-content:flex-start">
          <button class="btn" (click)="inviter()">Inviter par WhatsApp</button>
          <button class="btn ghost" (click)="ui.message('Examen blanc d\\'équipe prévu dimanche à 9 h (démo).')">Examen blanc ensemble dimanche</button>
        </div>
      }
    }
  `,
})
export class Classement {
  private readonly etatService = inject(EtatService);
  protected readonly ui = inject(UiService);
  protected readonly etat = this.etatService.etat;
  protected readonly onglets: [Onglet, string][] = [['ligue', 'Ligue'], ['concours', 'Concours'], ['prog', 'Progression'], ['equipe', 'Équipe']];
  protected readonly onglet = signal<Onglet>('ligue');
  protected readonly medailles = ['🥇', '🥈', '🥉'];
  protected readonly finSemaine = 7 - jourSemaine();

  protected readonly ligue = computed(() => { this.etat(); return this.etatService.ligue(); });

  protected readonly parConcours = computed(() => {
    this.etat();
    return this.etatService.mesConcours().map((c) => {
      const i = this.etatService.indice(c);
      const tp = topPourcent(i);
      const tot = 4200 + c.joursAvantEpreuve * 37;
      return { nom: c.nom, tp, tot, rang: Math.max(1, Math.round((tot * tp) / 100)), vise: Math.min(95, i + Math.round(9 * Math.log(tp / 2))) };
    });
  });

  protected readonly progression = computed(() => {
    const e = this.etat();
    const autres = NOMS_DEMO.slice(0, 9).map((nom, k) => ({ nom, d: Math.round(2 + 12 * graine(k * 7 + 3)), moi: false }));
    const moi = this.etatService.mesConcours().reduce((a, c) => {
      const h = e.hist[c.id] ?? [];
      return Math.max(a, h.length ? this.etatService.indice(c) - h[0].v : 0);
    }, 0);
    return [...autres, { nom: e.pseudo + ' (toi)', d: moi, moi: true }].sort((a, b) => b.d - a.d);
  });

  protected readonly defi = computed(() => Math.min(500, 362 + this.etat().day.n));

  protected readonly membres = computed(() => {
    const e = this.etat();
    const c = this.etatService.mesConcours()[0];
    return [
      { nom: e.pseudo, s: e.streak, i: c ? this.etatService.indice(c) : 0, fait: e.day.n >= e.goal, moi: true },
      { nom: 'Rasmané O.', s: 8, i: 59, fait: true, moi: false },
      { nom: 'Salimata D.', s: 0, i: 52, fait: false, moi: false },
      { nom: 'Abdoul S.', s: 15, i: 66, fait: true, moi: false },
      { nom: 'Awa C.', s: 3, i: 48, fait: false, moi: false },
    ];
  });

  inviter(): void {
    this.ui.copier(`Rejoins notre équipe « ${this.etat().team} » sur Major pour préparer les concours ensemble.`, 'Invitation copiée. Colle-la dans ton groupe WhatsApp.');
  }
}
