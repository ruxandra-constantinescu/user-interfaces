import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AsyncHandler, SettingsService } from '@placeos/common';

@Component({
    selector: 'app-welcome',
    template: `
        <div
            class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-center bg-cover"
            [style.background-image]="'url(' + background + ')'"
        >
            <a-topbar-header class="w-full z-10"></a-topbar-header>
            <div class="absolute inset-0 z-0 bg-black opacity-60"></div>
            <div
                class="flex flex-col flex-1 w-full items-center justify-center space-y-4 z-10"
            >
                <h3 class="text-2xl mb-4 text-white">
                    Welcome to PlaceOS Self Service Kiosk
                </h3>
                <a
                    matRipple
                    [routerLink]="['/checkin']"
                    class="text-xl py-2 px-8 mt-4 border-2 border-white text-white w-40 whitespace-nowrap flex items-center justify-center"
                >
                    Check In
                </a>
                <a
                    *ngIf="level"
                    matRipple
                    [routerLink]="['/explore', level]"
                    class="text-xl py-2 px-8 mt-4 border-2 border-white text-white w-40 whitespace-nowrap flex items-center justify-center"
                >
                    Explore
                </a>
            </div>
        </div>
    `,
    styles: [
        `
            a {
                height: 3.5rem;
                background-color: rgba(255, 255, 255, 0.25);
            }
        `,
    ],
})
export class WelcomeComponent
    extends AsyncHandler
    implements OnInit, OnDestroy
{
    /** Level to initially load on explore */
    public level = '';

    public get background() {
        return this._settings.get('app.home.background');
    }

    constructor(
        private route: ActivatedRoute,
        private _settings: SettingsService
    ) {
        super();
    }

    public ngOnInit() {
        this.subscription(
            'level',
            this._settings
                .listen('KIOSK.level')
                .subscribe((lvl) => (this.level = lvl))
        );
        this.level = localStorage?.getItem('KIOSK.level');
        this.subscription(
            'route.params',
            this.route.paramMap.subscribe((params) => {
                if (params.has('level')) {
                    this.level = params.get('level');
                }
            })
        );
    }
}
