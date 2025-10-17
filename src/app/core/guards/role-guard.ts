import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { switchMap, take } from 'rxjs/operators';
import { AccountService } from '../services/account-service';
import { from } from 'rxjs';

export const hasUserRoleGuard = () => {
  const authService = inject(AuthService);
  const accountService = inject(AccountService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    switchMap(async (authUser) => {
      if (!authUser) {
        console.log("illegal state: not authenticated");
        router.navigate(['/authenticate']);
        return false;
      }

      const accountData = await accountService.getAccountData(authUser.uid);
      if (accountData && (accountData.role === 'user' || accountData.role === 'admin')) {
        return true;
      }

      router.navigate(['/private/access-denied']);
      return false;
    })
  );
};

export const hasAdminRoleGuard = () => {
  const authService = inject(AuthService);
  const accountService = inject(AccountService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    switchMap(async (authUser) => {
      if (!authUser) {
        console.log("illegal state: not authenticated");
        router.navigate(['/authenticate']);
        return false;
      }

      const accountData = await accountService.getAccountData(authUser.uid);
      if (accountData && accountData.role === 'admin') {
        return true;
      }

      if (accountData && accountData.role === 'user') {
        router.navigate(['']);
        return true;
      }

      router.navigate(['/private/access-denied']);
      return false;
    })
  );
};

export const hasNoRoleGuard  = () => {
  const authService = inject(AuthService);
  const accountService = inject(AccountService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    switchMap(async (authUser) => {
      if (!authUser) {
        console.log("illegal state: not authenticated");
        router.navigate(['/authenticate']);
        return false;
      }

      const accountData = await accountService.getAccountData(authUser.uid);
      if (!accountData || !accountData.role || accountData.role == 'pending') {
        return true;
      }

      router.navigate(['']);
      return false;
    })
  );
};