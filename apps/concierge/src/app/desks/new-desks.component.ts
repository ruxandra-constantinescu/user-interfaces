import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AsyncHandler } from '@placeos/common';
import { DesksStateService } from './desks-state.service';

@Component({
    selector: '[app-new-desks]',
    template: `
        <app-topbar></app-topbar>
        <div class="flex flex-1 h-px">
            <app-sidebar></app-sidebar>
            <main class="flex flex-col flex-1 w-1/2 h-full">
                <desks-topbar class="w-full"></desks-topbar>
                <div class="flex-1 h-1/2 w-full relative overflow-auto">
                    <router-outlet></router-outlet>
                </div>
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
export class NewDesksComponent
    extends AsyncHandler
    implements OnInit, OnDestroy
{
    public readonly loading = this._state.loading;
    public path: string;

    constructor(private _state: DesksStateService, private _router: Router) {
        super();
    }

    public ngOnInit() {
        this._state.startPolling();
        this.subscription(
            'router.events',
            this._router.events.subscribe((e) => {
                if (e instanceof NavigationEnd) {
                    const url_parts = this._router.url?.split('/') || [''];
                    this.path = url_parts[parts.length - 1].split('?')[0];
                }
            })
        );
        const parts = this._router.url?.split('/') || [''];
        this.path = parts[parts.length - 1].split('?')[0];
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        this._state.stopPolling();
    }
}