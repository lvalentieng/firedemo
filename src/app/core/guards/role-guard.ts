import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { map, take } from 'rxjs/operators';

/**
 * Guard che verifica se l'utente ha un ruolo valido (admin o user)
 * Reindirizza a /access-denied se l'utente non ha un ruolo assegnato
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getRole$().pipe(
    take(1),
    map(role => {
      // Se non ha un ruolo, reindirizza alla pagina di accesso negato
      if (!role) {
        return router.createUrlTree(['/private/access-denied']);
      }

      // Verifica se il ruolo è tra quelli richiesti (se specificati nella route)
      const allowedRoles = route.data['roles'] as string[] | undefined;
      if (allowedRoles && !allowedRoles.includes(role)) {
        return router.createUrlTree(['/private/access-denied']);
      }

      return true;
    })
  );
};

/**
 * Guard specifico per verificare che l'utente sia un admin
 * Reindirizza a /access-denied se l'utente non è admin
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getRole$().pipe(
    take(1),
    map(role => {
      if (role !== 'admin') {
        return router.createUrlTree(['/private/access-denied']);
      }
      return true;
    })
  );
};

/**
 * Guard specifico per verificare che l'utente sia user o admin
 * Reindirizza a /access-denied se l'utente non ha un ruolo valido
 */
export const userGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getRole$().pipe(
    take(1),
    map(role => {
      if (role !== 'user' && role !== 'admin') {
        return router.createUrlTree(['/private/access-denied']);
      }
      return true;
    })
  );
};
