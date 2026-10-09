import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogueService } from '../core/catalogue.service';
import { EtatService } from '../core/etat.service';
import { ExamenService } from '../core/examen.service';
import { couleurPct } from '../core/indice';

const LETTRES = ['A', 'B', 'C', 'D'];

/** Examen blanc : consignes, épreuve chronométrée, puis note, rang et erreurs. */
@Component({
  selector: 'mj-examen',
  imports: [RouterLink],
  template: `
    @let ex = examen();
    @if (!ex) {
      <div class="center" style="display:grid;gap:16px">
        <span class="label">Examen blanc</span>
        <h1>Dans les conditions du jour J</h1>
        <div class="card">
          <h3>Pour quel concours ?</h3>
          <div class="seg">
            @for (c of mesConcours(); track c.id) {
              <button [class.on]="c.id === cid()" (click)="choix.set(c.id)">{{ c.nom }}</button>
            }
          </div>
        </div>
        <div class="card">
          <h3>Consignes</h3>
          <ul class="list">
            <li>12 questions, 10 minutes (version courte pour la démo ; le vrai examen blanc suivra la durée officielle).</li>
            <li>Pas de correction pendant l'épreuve. Tu peux revenir en arrière et marquer une question ⚑.</li>
            <li>Note sur 20 selon les coefficients du concours, puis rang parmi les candidats.</li>
            <li>Dans l'application, l'épreuve se télécharge : une coupure de réseau ne fait rien perdre.</li>
          </ul>
        </div>
        <button class="btn block" (click)="service.demarrer(cid())">Commencer l'épreuve</button>
      </div>
    } @else if (!ex.done) {
      @let q = question()!;
      <div class="center" style="display:grid;gap:16px">
        <div class="row"><span class="label">Examen blanc · {{ nom(ex.cid) }}</span><span class="timer num">{{ chrono() }}</span></div>
        <div class="topq">
          <div class="bar"><i [style.width.%]="(100 * repondues()) / ex.ids.length"></i></div>
          <span class="num muted">{{ ex.i + 1 }} / {{ ex.ids.length }}</span>
        </div>
        <div class="row" style="justify-content:flex-start;gap:6px">
          @for (id of ex.ids; track $index) {
            <button class="chip plain" (click)="service.aller($index)"
              [style.border]="$index === ex.i ? '1.5px solid var(--green)' : '0'"
              [style.background]="ex.ans[$index] != null ? 'var(--green-soft)' : null"
              [style.color]="ex.ans[$index] != null ? 'var(--green)' : null">{{ $index + 1 }}{{ ex.flag[$index] ? ' ⚑' : '' }}</button>
          }
        </div>
        <p class="q">{{ q.enonce }}</p>
        <div class="opts">
          @for (c of q.choix; track $index) {
            <button class="opt" [class.sel]="ex.ans[ex.i] === $index" [attr.aria-pressed]="ex.ans[ex.i] === $index" (click)="service.repondre($index)">
              <b>{{ lettres[$index] }}</b>{{ c }}
            </button>
          }
        </div>
        <div class="row">
          <button class="link" [style.visibility]="ex.i ? 'visible' : 'hidden'" (click)="service.aller(ex.i - 1)">← Précédente</button>
          <button class="link" (click)="service.marquer()">{{ ex.flag[ex.i] ? 'Retirer ⚑' : 'Marquer ⚑' }}</button>
          <button class="link" [style.visibility]="ex.i + 1 < ex.ids.length ? 'visible' : 'hidden'" (click)="service.aller(ex.i + 1)">Suivante →</button>
        </div>
        @if (ex.confirm) {
          <div class="card" style="border-color:var(--gold)">
            <p><b>{{ vides() ? 'Il reste ' + vides() + ' question' + (vides() > 1 ? 's' : '') + ' sans réponse.' : 'Toutes les questions ont une réponse.' }}</b> Terminer l'épreuve ?</p>
            <div class="row" style="justify-content:flex-start">
              <button class="btn" (click)="service.terminer()">Terminer et voir ma note</button>
              <button class="link" (click)="service.maj(confirmer(false))">Continuer l'épreuve</button>
            </div>
          </div>
        } @else {
          <button class="btn ghost block" (click)="service.maj(confirmer(true))">Terminer l'épreuve</button>
        }
      </div>
    } @else {
      @let r = ex.res!;
      <div class="center" style="display:grid;gap:16px">
        <span class="label">Résultat · {{ nom(ex.cid) }}</span>
        <h1>{{ r.note >= 14 ? 'Très bonne épreuve.' : r.note >= 10 ? 'Épreuve correcte, on continue.' : 'On a trouvé quoi travailler.' }}</h1>
        <div class="grid2">
          <div class="card"><div class="stat"><span class="big num">{{ virgule(r.note) }}</span><span class="muted">sur 20</span></div></div>
          <div class="card"><div class="stat"><span class="big gold num">{{ r.rang.toLocaleString('fr-FR') }}e</span><span class="muted">sur {{ r.sur.toLocaleString('fr-FR') }} candidats (simulé)</span></div></div>
        </div>
        @if (precedent(); as p) {
          <div class="card" [class.hero]="r.note >= p.note"><b>{{ r.note >= p.note ? '+' : '' }}{{ virgule(+(r.note - p.note).toFixed(1)) }} point par rapport au dernier examen blanc</b></div>
        }
        <div class="card">
          <h3>Par matière</h3>
          @for (x of parMatiere(); track x.m) {
            <div class="row"><span>{{ x.nom }} <span class="muted">×{{ x.k }}</span></span><span [class]="'chip ' + x.couleur">{{ x.ok }} / {{ x.n }}</span></div>
          }
        </div>
        @if (r.ko.length) {
          <div class="card">
            <h3>Tes erreurs</h3>
            @for (id of r.ko; track id) {
              @let qk = cat.question(id)!;
              <div style="border-bottom:1px solid var(--line);padding-bottom:8px;display:grid;gap:4px">
                <b>{{ qk.enonce }}</b><span class="muted">Bonne réponse : {{ qk.choix[qk.reponse] }}. {{ qk.explication }}</span>
              </div>
            }
            <p class="muted" style="font-size:.88rem">Ces questions reviendront dans tes prochaines séances.</p>
          </div>
        }
        <a class="btn block" routerLink="/aujourdhui" style="text-align:center;text-decoration:none">Revenir à l'accueil</a>
      </div>
    }
  `,
})
export class ExamenPage implements OnDestroy {
  protected readonly cat = inject(CatalogueService);
  private readonly etat = inject(EtatService);
  protected readonly service = inject(ExamenService);
  protected readonly lettres = LETTRES;
  protected readonly examen = this.service.examen;
  protected readonly mesConcours = this.etat.mesConcours;
  protected readonly choix = signal<string | null>(null);

  protected readonly cid = computed(() => this.choix() ?? this.mesConcours()[0]?.id);
  protected readonly question = computed(() => { const ex = this.examen(); return ex ? this.cat.question(ex.ids[ex.i]) : undefined; });
  protected readonly repondues = computed(() => this.examen()?.ans.filter((x) => x != null).length ?? 0);
  protected readonly vides = computed(() => (this.examen()?.ids.length ?? 0) - this.repondues());
  protected readonly chrono = computed(() => {
    const t = this.service.restant();
    return Math.floor(t / 60000) + ':' + String(Math.floor(t / 1000) % 60).padStart(2, '0');
  });
  protected readonly precedent = computed(() => {
    const ex = this.examen();
    const l = this.etat.etat().exams;
    const p = l.length > 1 ? l[l.length - 2] : null;
    return p && ex && p.cid === ex.cid ? p : null;
  });
  protected readonly parMatiere = computed(() => {
    const ex = this.examen();
    if (!ex?.res) return [];
    const c = this.cat.concoursParId(ex.cid)!;
    return Object.entries(ex.res.parM).map(([m, x]) => ({ m, nom: this.cat.nomMatiere(m), k: c.coefficients[m] || 1, ...x, couleur: couleurPct((100 * x.ok) / x.n) }));
  });

  nom(id: string): string {
    return this.cat.concoursParId(id)?.nom ?? '';
  }

  virgule(n: number): string {
    return n.toString().replace('.', ',');
  }

  /** Un examen terminé ne doit pas réapparaître : la prochaine visite repart des consignes. */
  ngOnDestroy(): void {
    if (this.examen()?.done) this.service.abandonner();
  }

  confirmer(v: boolean) {
    return () => ({ confirm: v });
  }
}
