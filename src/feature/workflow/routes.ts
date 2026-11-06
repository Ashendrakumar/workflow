import { Routes } from "@angular/router";


export const FEATURE_ROUTES: Routes =[
    {
        path: '',
        loadComponent:()=> import('./components/workflow-dashboard/workflow-dashboard.component').then(m => m.WorkflowDashboardComponent)
    },
    {
        path:':id',
        loadComponent:()=> import('./components/editor/editor.component').then(m => m.EditorComponent)
    },
    // {
    //     path:'monitor/:id',
    //     loadComponent:()=> import('./components/monitor/monitor.component').then(m => m.MonitorComponent)
    // }
    
]