import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { SettingsService, currentUser } from '@placeos/common';
import { addMinutes, format, formatDuration, isSameDay } from 'date-fns';

import { Booking } from './booking.class';
import { BookingDetailsModalComponent } from './booking-details-modal.component';
import { AsyncHandler } from 'libs/common/src/lib/async-handler.class';
import { OrganisationService } from 'libs/organisation/src/lib/organisation.service';

@Component({
    selector: 'booking-card',
    template: `
        <h4 class="mb-2 flex items-center" *ngIf="booking">
            <span *ngIf="show_day" day>{{ day }},&nbsp;</span>
            {{ booking?.date | date: time_format }}
            <span class="text-xs px-2">({{ booking?.date | date: 'z' }})</span>
        </h4>
        <a
            name="view-booking-details"
            class="w-full cursor-pointer overflow-hidden relative"
            [routerLink]="['./']"
            [queryParams]="{ booking: booking?.id }"
            (click)="viewDetails()"
            *ngIf="booking"
        >
            <div
                class="w-full bg-base-100 border border-base-300 rounded-xl shadow py-4 relative"
            >
                <h4 class="px-4 text-lg">{{ booking?.title }}</h4>
                <div class="flex mx-4 my-2">
                    <status-pill [status]="status">{{ period }}</status-pill>
                </div>
                <div
                    class="flex flex-wrap flex-col sm:flex-row sm:divide-x divide-base-200-500 py-2 space-y-2 sm:space-y-0"
                >
                    <div class="flex items-center px-4">
                        <app-icon *ngIf="type !== 'desk'; else desk_icon">{{
                            type
                        }}</app-icon>
                        <div class="mx-2 truncate">
                            {{ booking?.description || booking?.asset_id }}
                        </div>
                    </div>
                    <div class="flex items-center px-4" *ngIf="location">
                        <app-icon>place</app-icon>
                        <div class="mx-2 truncate">{{ location }}</div>
                    </div>
                </div>
                <app-icon
                    class="absolute top-1/2 right-1 text-4xl -translate-y-1/2"
                >
                    chevron_right
                </app-icon>
                <div
                    class="absolute top-2 right-2 bg-warning/50 rounded-xl px-2 py-1 text-xs"
                    *ngIf="!for_current_user"
                >
                    Associate
                </div>
            </div>
        </a>
        <ng-template #desk_icon>
            <img src="assets/icons/desk-outline.svg" class="w-5 h-5" />
        </ng-template>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                position: relative;
            }
        `,
    ],
})
export class BookingCardComponent extends AsyncHandler {
    @Input() public booking: Booking;
    @Input() public show_day: boolean = false;
    @Output() public edit = new EventEmitter();
    @Output() public remove = new EventEmitter();
    @Output() public end = new EventEmitter();

    public get for_current_user() {
        return (
            this.booking?.user_email.toLowerCase() ===
            currentUser()?.email.toLowerCase()
        );
    }

    public get time_format() {
        return this._settings.time_format;
    }

    public get status() {
        if (this.booking?.is_done) return 'neutral';
        if (this.booking?.status === 'approved') return 'success';
        if (this.booking?.status === 'declined') return 'error';
        if (this.booking?.status === 'cancelled') return 'error';
        if (this.booking?.status === 'tentative') return 'warning';
        return 'warning';
    }

    constructor(
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _org: OrganisationService,
        private _settings: SettingsService
    ) {
        super();
    }

    public ngOnInit() {
        this.subscription(
            'route.query',
            this._route.queryParamMap.subscribe((params) =>
                params.has('booking') &&
                this.booking?.id === params.get('event')
                    ? this.viewDetails()
                    : ''
            )
        );
    }

    public get type() {
        if (this.booking?.type === 'desk') return 'desk';
        if (this.booking?.type === 'parking') return 'drive_eta';
        return 'book';
    }

    public get day() {
        const date = this.booking?.date || Date.now();
        const is_today = isSameDay(Date.now(), date);
        return `${is_today ? 'Today' : format(date, 'EEEE')}`;
    }

    public get location() {
        const level = this._org.levelWithID(this.booking?.zones || []);
        return `${level?.display_name || level?.name || ''}`;
    }

    public get period() {
        if (this.booking?.is_all_day) return 'All Day';
        const start = this.booking?.date || Date.now();
        const duration = this.booking?.duration || 60;
        const end = addMinutes(start, duration);
        const dur = formatDuration({
            hours: Math.floor(duration / 60),
            minutes: duration % 60,
        })
            .replace(' hour', 'hr')
            .replace(' minute', 'min');
        return `${format(start, this.time_format)} - ${format(
            end,
            this.time_format
        )} (${dur})`;
    }

    public viewDetails() {
        if (!this.booking) return;
        this.timeout('open', () => {
            const ref = this._dialog.open(BookingDetailsModalComponent, {
                data: this.booking,
            });
            this.subscription(
                'edit',
                ref.componentInstance.edit.subscribe(() => this.edit.emit())
            );
            this.subscription(
                'remove',
                ref.componentInstance.remove.subscribe(() => this.remove.emit())
            );
            this.subscription(
                'end',
                ref.componentInstance.end.subscribe(() => this.end.emit())
            );
        });
    }
}
