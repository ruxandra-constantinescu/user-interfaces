import { Component } from '@angular/core';
import { LandingStateService } from './landing-state.service';

@Component({
    selector: 'landing-availability',
    template: `
        <div class="py-2">
            <div class="sm:text-lg font-medium mb-2 sm:mb-4 px-4">Available Now</div>
            <div class="text-sm sm:text-base px-4">Spaces</div>
            <div class="w-full overflow-auto flex items-center space-x-4 px-4 py-2">
                <button
                    matRipple
                    *ngFor="let lvl of levels_free | async"
                    class="flex items-center h-24 min-w-[12.5rem] rounded-lg bg-white shadow p-4 space-x-2"
                    [routerLink]="['/explore']"
                    [queryParams]="{ level: lvl.id }"
                >
                    <div
                        class="min-w-[4.5rem] h-[4.5rem] rounded bg-gray-200"
                    ></div>
                    <div class="text-left">
                        <div class="max-w-full truncate px-1.5">
                        {{ lvl.display_name || lvl.name }}
                        </div>
                        <div class="max-w-full truncate text-sm opacity-60 flex items-center">
                            <app-icon class="text-blue-500 text-lg">place</app-icon>
                            <span>Unknown Building</span>
                        </div>
                    </div>
                </button>
                <span
                    *ngIf="!(levels_free | async).length"
                    class="text-dark-fade text-sm mb-2"
                >
                    No free spaces
                </span>
            </div>
            <div class="text-sm sm:text-base my-2 px-4">Rooms</div>
            <div class="w-full overflow-auto flex items-center space-x-4 px-4 py-2">
                <button
                    matRipple
                    *ngFor="let space of space_list | async"
                    class="flex items-center h-24 min-w-[12.5rem] rounded-lg bg-white shadow p-4 space-x-2"
                    [routerLink]="['/explore']"
                    [queryParams]="{ space: space.email }"
                >
                    <div
                        class="min-w-[4.5rem] h-[4.5rem] rounded bg-gray-200"
                    ></div>
                    <div class="text-left">
                        <div class="max-w-full truncate px-1.5">
                            {{ space.display_name || space.name }}
                        </div>
                        <div class="max-w-full truncate text-sm opacity-60 flex items-center">
                            <app-icon class="text-blue-500 text-lg">place</app-icon>
                            <span>{{ space.level.display_name || space.level.name }}</span>
                        </div>
                    </div>
                </button>
                <span
                    *ngIf="!(space_list | async).length"
                    class="text-dark-fade text-sm mb-2"
                >
                    No free rooms
                </span>
            </div>
        </div>
    `,
    styles: [`
        * {
            flex-shrink: 0;
        }
    `],
})
export class LandingAvailabilityComponent {
    public readonly space_list = this._state.free_spaces;
    public readonly levels_free = this._state.level_occupancy;

    constructor(private _state: LandingStateService) {}

    public async ngOnInit() {
        this._state.pollFreeSpaces();
    }

    public ngOnDestroy() {
        this._state.stopPollingFreeSpaces();
    }
}