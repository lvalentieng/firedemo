import { Routes } from '@angular/router';
import { Test1 } from './features/firedemo/components/test1/test1';
import { Test2 } from './features/firedemo/components/test2/test2';
import { Authenticate } from './core/components/authenticate/authenticate';
import { isAuthenticatedGuard } from './core/guards/is-authenticated-guard';
import { isNotAuthenticatedGuard } from './core/guards/is-not-authenticated-guard';
import { Private } from './core/components/private/private';
import { hasAdminRoleGuard, hasUserRoleGuard, hasNoRoleGuard } from './core/guards/role-guard';
import { UserManagement } from './features/admin-panel/components/user-management/user-management';
import { AccessDenied } from './features/firedemo/components/access-denied/access-denied';
import { TmdbNavigator } from './features/admin-panel/components/tmdb-navigator/tmdb-navigator';
import { AdminPanel } from './features/admin-panel/admin-panel';
import { FstoreMovieNavigator } from './features/admin-panel/components/fstore-movie-navigator/fstore-movie-navigator';
import { FstoreImageNavigator } from './features/admin-panel/components/fstore-image-navigator/fstore-image-navigator';

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
                path: 'admin',
                component: AdminPanel,
                canActivate: [hasAdminRoleGuard],
                children: [
                    {
                        path: 'user',
                        component: UserManagement
                    },
                    {
                        path: 'tmdb',
                        component: TmdbNavigator
                    },
                    {
                        path: 'movies',
                        component: FstoreMovieNavigator
                    },
                    {
                        path: 'movies/:id/images',
                        component: FstoreImageNavigator
                    },
                    {
                        path: '',
                        redirectTo: '/private/admin/movies',
                        pathMatch: 'full'
                    }
                ]
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
