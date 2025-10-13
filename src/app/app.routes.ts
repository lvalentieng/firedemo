import { Routes } from '@angular/router';
import { Test1 } from './features/firedemo/components/test1/test1';
import { Test2 } from './features/firedemo/components/test2/test2';
import { Authenticate } from './core/components/authenticate/authenticate';
import { isAuthenticatedGuard } from './core/guards/is-authenticated-guard';
import { isNotAuthenticatedGuard } from './core/guards/is-not-authenticated-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/private/test1',
        pathMatch: 'full'
    },
    {
        path: 'private',
        canActivate: [isAuthenticatedGuard],
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
        path: 'authenticate',
        canActivate: [isNotAuthenticatedGuard],
        component: Authenticate
    }
];
