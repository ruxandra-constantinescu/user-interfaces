import { Component, OnDestroy, OnInit } from '@angular/core';
import { VisitorsStateService } from './visitors-state.service';

@Component({
    selector: '[app-new-visitors]',
    template: `
        <app-topbar></app-topbar>
        <div class="flex flex-1 h-px">
            <app-sidebar></app-sidebar>
            <main class="flex flex-col flex-1 w-1/2 h-full">
                <visitors-topbar class="w-full"></visitors-topbar>
                <visitor-listings
                    *ngIf="!(filters | async)?.show_guests"
                    class="w-full flex-1 h-0"
                ></visitor-listings>
                <guest-listings
                    *ngIf="(filters | async)?.show_guests"
                    class="w-full flex-1 h-0"
                ></guest-listings>
                <mat-progress-bar
                    class="w-full"
                    *ngIf="loading | async"
                    mode="indeterminate"
                ></mat-progress-bar>
            </main>
        </div>
    `,
    styles: [
        `
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background-color: #fff;
            }
        `,
    ],
})
export class NewVisitorsComponent implements OnInit, OnDestroy {
    public readonly loading = this._state.loading;
    public readonly filters = this._state.filters;

    constructor(private _state: VisitorsStateService) {}

    public ngOnInit() {
        this._state.startPolling();
    }

    public ngOnDestroy() {
        this._state.stopPolling();
    }
}