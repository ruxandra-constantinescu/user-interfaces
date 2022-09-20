import { Component } from '@angular/core';
import { startOfMinute } from 'date-fns';

import { generateQRCode } from 'libs/common/src/lib/qr-code';

import { PanelStateService } from '../panel-state.service';

@Component({
    selector: 'panel-view-details',
    template: `
        <div class="h-full w-full bg-black relative text-white">
            <div
                class="bg-cover bg-center absolute inset-0"
                [style.background-image]="'url(' + room_image + ')'"
            ></div>
            <div class="absolute inset-0 bg-black/60"></div>
            <div name class="absolute top-4 left-4 text-4xl font-medium">
                {{
                    (system | async)?.display_name ||
                        (system | async)?.name ||
                        '&lt;Unknown Space&gt;'
                }}
            </div>
            <div
                qr-checkin
                *ngIf="checkin"
                class="absolute top-4 right-4 text-xl w-40 space-y-4 z-50"
            >
                <img class="w-full" [src]="qr_code" />
                <div class="w-full text-lg" *ngIf="!custom_qr">
                    Scan QR code to book this room or view details
                </div>
            </div>
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 font-normal space-y-4 text-center"
            >
                <p class="text-3xl">
                    {{ time | date: 'EEE, MMM d, y h:mm a' }}
                </p>
                <p
                    class="text-4xl"
                    *ngIf="(current | async) && !hide_meeting_details"
                >
                    Host:
                    {{
                        (current | async).organiser?.name ||
                            (current | async).host
                    }}
                </p>
            </div>
            <div
                *ngIf="(current | async) && !hide_meeting_details"
                class="absolute bottom-0 inset-x-0 bg-black/20 text-white p-4 text-center text-3xl"
            >
                {{ (current | async).title }}
                <span class="font-light">is currently in progress</span>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
            }
        `,
    ],
})
export class PanelViewDetailsComponent {
    public readonly system = this._state.space;
    public readonly current = this._state.current;
    public qr_code: any;

    public get time() {
        return startOfMinute(Date.now());
    }

    public get hide_meeting_details() {
        return this._state.setting('hide_meeting_details');
    }

    public get room_image() {
        return this._state.setting('room_image');
    }

    public get checkin() {
        return this._state.setting('show_qr_code') !== false;
    }

    public get custom_qr() {
        return !!this._state.setting('custom_qr_url');
    }

    constructor(private _state: PanelStateService) {}

    public async ngOnInit() {
        this._state.current.subscribe((v) => console.log('Current:', v));
        this._state.settings.subscribe(({ custom_qr_url, custom_qr_color }) => {
            if (custom_qr_url) {
                this.qr_code = generateQRCode(
                    custom_qr_url,
                    '#fff0',
                    custom_qr_color || '#fff'
                );
            } else if (!this.qr_code) {
                const url = `${location.origin}${location.pathname}#/checkin/${this._state.system}`;
                this.qr_code = generateQRCode(
                    url,
                    '#fff0',
                    custom_qr_color || '#fff'
                );
            }
        });
    }
}
