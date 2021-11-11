import { Component } from '@angular/core';
import { LandingStateService } from './landing-state.service';

@Component({
    selector: 'landing-colleagues',
    template: `
        <div
            class="flex flex-col w-[18rem] h-full overflow-hidden bg-white border-r border-gray-200"
        >
            <div class="flex items-center justify-between px-4 py-2">
                <h2 class="font-medium">Colleagues</h2>
                <button mat-button class="inverse">Add</button>
            </div>
            <div class="flex-1 h-1/2 w-full space-y-4 overflow-auto pt-4">
                <div
                    class="flex items-center px-4 space-x-4"
                    *ngFor="let user of contacts | async"
                >
                    <div class="text-xl relative">
                        <a-user-avatar [user]="user"></a-user-avatar>
                        <div
                            class="rounded-full h-3 w-3 border border-white absolute bottom-1 right-1"
                            [class.bg-error]="!user.location"
                            [class.bg-success]="user.location"
                        ></div>
                    </div>
                    <div class="leading-tight">
                        <div class="truncate">{{ user.name }}</div>
                        <div class="text-sm truncate">
                            {{ user.organisation }}
                        </div>
                        <div class="text-xs opacity-60 truncate">
                            {{ user.location }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class LandingColleaguesComponent {
    public readonly contacts = this._state.contacts;

    public readonly search_results = this._state.search_results;

    public readonly addUser = (u) => this._state.addContact(u);

    public readonly removeUser = (u) => this._state.removeContact(u);

    public readonly updateSearch = (s) => this._state.setOptions({ search: s });

    constructor(private _state: LandingStateService) {}
}