import { Component } from '@angular/core';
import { LevelManagementService } from './level-management.service';

@Component({
    selector: 'level-list',
    template: `
        <div class="absolute inset-0 overflow-auto px-4">
            <custom-table
                class="block min-w-[28rem] w-full h-full"
                [dataSource]="levels"
                [columns]="['display_name', 'building', 'parking', 'actions']"
                [display_column]="['Name', 'Building', 'Parking', ' ']"
                [column_size]="['flex', '12r', '4r', '3.75r']"
                [template]="{
                    actions: action_template,
                    parking: parking_template
                }"
                empty="No levels"
            ></custom-table>
        </div>
        <ng-template #parking_template let-row="row">
            <div
                *ngIf="row.tags?.includes('parking')"
                class="rounded h-8 w-8 flex items-center justify-center text-2xl bg-success text-success-content mx-auto"
            >
                <app-icon>done</app-icon>
            </div>
        </ng-template>
        <ng-template #action_template let-row="row">
            <div class="w-full flex justify-end space-x-2">
                <button btn icon matRipple [matMenuTriggerFor]="menu">
                    <app-icon>more_vert</app-icon>
                </button>
                <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="editLevel(row)">
                        <div class="flex items-center space-x-2">
                            <app-icon>edit</app-icon>
                            <span>Edit Level</span>
                        </div>
                    </button>
                    <button mat-menu-item (click)="removeLevel(row)">
                        <div class="flex items-center space-x-2 text-red-500">
                            <app-icon>delete</app-icon>
                            <span>Delete Level</span>
                        </div>
                    </button>
                </mat-menu>
            </div>
        </ng-template>
    `,
    styles: [``],
})
export class LevelListComponent {
    public readonly levels = this._manager.filtered_levels;

    public readonly editLevel = (level) => this._manager.editLevel(level);
    public readonly removeLevel = (level) => this._manager.removeLevel(level);

    constructor(private _manager: LevelManagementService) {}
}
