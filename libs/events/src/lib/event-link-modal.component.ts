import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SettingsService } from 'libs/common/src/lib/settings.service';
import {
    generateCalendarFileLink,
    generateGoogleCalendarLink,
    generateMicrosoftCalendarLink,
} from 'libs/common/src/lib/calendar-links';
import { CalendarEvent } from './event.class';

@Component({
    selector: 'event-link-modal',
    template: `
        <div class="p-4 w-full pb-2">
            Add event to your calendar
        </div>
        <div class="flex flex-col items-center space-y-4 p-4 relative">
            <a
                button
                matRipple
                class="flex items-center p-2 space-x-2 pr-4 w-64 rounded inverse"
                [href]="outlook_link | sanitize:'url'"
                target="_blank"
                rel="noopener noreferer"
            >
                <img src="assets/icons/outlook.svg" class="w-6" />
                <span>Create in Outlook</span>
            </a>
            <a
                button
                matRipple
                class="flex items-center p-2 space-x-2 pr-4 w-64 rounded inverse"
                [href]="google_link | sanitize:'url'"
                target="_blank"
                rel="noopener noreferer"
            >
                <img src="assets/icons/gcal.svg" class="w-6" />
                <span>Create in Google Calendar</span>
            </a>
            <a
                button
                matRipple
                class="flex items-center p-2 space-x-2 pr-4 w-64 rounded inverse"
                [href]="ical_link | safe:'url'"
                target="_blank"
                rel="noopener noreferer"
            >
                <app-icon class="text-xl">download</app-icon>
                <span>Download iCal File</span>
            </a>
        </div>
        <button mat-icon-button mat-dialog-close class="absolute top-2 right-0">
            <app-icon>close</app-icon>
        </button>
    `,
    styles: [
        `
            :host {
                position: relative;
            }
        `,
    ],
})
export class EventLinkModalComponent {
    public readonly outlook_link = generateMicrosoftCalendarLink(
        this._event as any
    );
    public readonly google_link = generateGoogleCalendarLink(
        this._event as any
    );
    public readonly ical_link = generateCalendarFileLink(this._event as any);

    constructor(
        @Inject(MAT_DIALOG_DATA) private _event: CalendarEvent,
        private _settings: SettingsService
    ) {}
}