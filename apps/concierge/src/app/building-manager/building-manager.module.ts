import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Route } from '@angular/router';

import { UIModule } from '../ui/ui.module';

import { SharedSpacesModule } from '@placeos/spaces';
import { SharedUsersModule } from '@placeos/users';

import { BuildingManagerComponent } from './building-manager.component';
import { MatChipsModule } from '@angular/material/chips';
import { BuildingListComponent } from './building-list.component';
import { BuildingFormComponent } from './building-form.component';
import { BuildingModalComponent } from './building-modal.component';

const ROUTES: Route[] = [
    { path: '', component: BuildingManagerComponent },
    { path: 'new', component: BuildingManagerComponent },
];

@NgModule({
    declarations: [
        BuildingManagerComponent,
        BuildingListComponent,
        BuildingFormComponent,
        BuildingModalComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        UIModule,
        SharedSpacesModule,
        SharedUsersModule,
        MatChipsModule,
        RouterModule.forChild(ROUTES),
    ],
})
export class BuildingManagerModule {}
