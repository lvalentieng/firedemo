import { Routes } from '@angular/router';
import { Test1 } from './features/firedemo/components/test1/test1';
import { Test2 } from './features/firedemo/components/test2/test2';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/private/test1',
        pathMatch: 'full'
    },
    {
        path: 'private',
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
    }
];
