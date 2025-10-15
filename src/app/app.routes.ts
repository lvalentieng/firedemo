import { Routes } from '@angular/router';
import { Test1 } from './features/firedemo/components/test1/test1';
import { Test2 } from './features/firedemo/components/test2/test2';
import { Authenticate } from './core/components/authenticate/authenticate';
import { isAuthenticatedGuard } from './core/guards/is-authenticated-guard';
import { isNotAuthenticatedGuard } from './core/guards/is-not-authenticated-guard';
import { Private } from './core/components/private/private';
import { hasAdminRoleGuard, hasUserRoleGuard, hasNoRoleGuard } from './core/guards/role-guard';
import { AdminPanel } from './features/firedemo/components/admin-panel/admin-panel';
import { AccessDenied } from './features/firedemo/components/access-denied/access-denied';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/private/app/test1',
        pathMatch: 'full'
    },
    {
        path: 'private',
        component: Private,
        canActivate: [isAuthenticatedGuard],
        children: [
            {
                path: 'app',
                canActivate: [hasUserRoleGuard],
                children: [
                    {
                        path: 'test1',
                        component: Test1
                    },
                    {
                        path: 'test2',
                        component: Test2
                    }
                ]
            },
            {
                path: 'admin-panel',
                canActivate: [hasAdminRoleGuard],
                component: AdminPanel
            },
            {
                path: 'access-denied',
                canActivate: [hasNoRoleGuard],
                component: AccessDenied
            }
        ]
    },
    {
        path: 'authenticate',
        canActivate: [isNotAuthenticatedGuard],
        component: Authenticate
    }
];
