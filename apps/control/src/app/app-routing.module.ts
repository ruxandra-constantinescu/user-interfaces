import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BootstrapComponent } from './bootstrap.component';
import { ControlMainViewComponent } from './main-view.component';
import { ControlVideoCallViewComponent } from './video-call/video-call-view.component';

const routes: Routes = [
    {
        path: 'bootstrap',
        component: BootstrapComponent,
    },
    {
        path: 'panel/:system',
        component: ControlMainViewComponent,
    },
    {
        path: 'panel/:system/call',
        component: ControlVideoCallViewComponent,
    },
    { path: '**', redirectTo: 'bootstrap' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
