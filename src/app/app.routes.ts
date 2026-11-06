import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'workflow',
        loadChildren: () => import('../feature/workflow/routes').then(m => m.FEATURE_ROUTES)    
    },
    {
        path:'',
        redirectTo:'workflow',
        pathMatch:'full'
    }
];
