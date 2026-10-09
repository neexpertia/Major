import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router, Routes } from '@angular/router';
import { EtatService } from './core/etat.service';
import { ExamenService } from './core/examen.service';

/** Les écrans principaux demandent d'avoir fini le premier lancement. */
const inscrit: CanActivateFn = () =>
  inject(EtatService).etat().onboarded || inject(Router).createUrlTree(['/bienvenue']);

const pasInscrit: CanActivateFn = () =>
  !inject(EtatService).etat().onboarded || inject(Router).createUrlTree(['/aujourdhui']);

/** Quitter un examen blanc en cours fait perdre les réponses : on demande confirmation. */
const quitterExamen: CanDeactivateFn<unknown> = () => {
  const ex = inject(ExamenService);
  const e = ex.examen();
  if (!e || e.done) return true;
  if (!confirm("Quitter l'examen blanc ? Tes réponses seront perdues.")) return false;
  ex.abandonner();
  return true;
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'aujourdhui' },
  { path: 'bienvenue', canActivate: [pasInscrit], loadComponent: () => import('./pages/bienvenue').then((m) => m.Bienvenue) },
  {
    path: '',
    canActivate: [inscrit],
    children: [
      { path: 'aujourdhui', title: "Major · Aujourd'hui", loadComponent: () => import('./pages/aujourdhui').then((m) => m.Aujourdhui) },
      { path: 'seance', title: 'Major · Séance', loadComponent: () => import('./pages/seance').then((m) => m.SeancePage) },
      { path: 'bilan', title: 'Major · Bilan', loadComponent: () => import('./pages/bilan').then((m) => m.Bilan) },
      { path: 'progres', title: 'Major · Progrès', loadComponent: () => import('./pages/progres').then((m) => m.Progres) },
      { path: 'concours/:id', title: 'Major · Concours', loadComponent: () => import('./pages/detail-concours').then((m) => m.DetailConcours) },
      { path: 'examen', title: 'Major · Examen blanc', canDeactivate: [quitterExamen], loadComponent: () => import('./pages/examen').then((m) => m.ExamenPage) },
      { path: 'classement', title: 'Major · Classement', loadComponent: () => import('./pages/classement').then((m) => m.Classement) },
      { path: 'profil', title: 'Major · Profil', loadComponent: () => import('./pages/profil').then((m) => m.Profil) },
    ],
  },
  { path: '**', redirectTo: 'aujourdhui' },
];
