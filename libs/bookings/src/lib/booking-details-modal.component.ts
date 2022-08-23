import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { notifySuccess } from '@placeos/common';
import { MapPinComponent } from '@placeos/components';
import { OrganisationService } from '@placeos/organisation';
import { addMinutes, format, formatDuration } from 'date-fns';
import { Booking } from './booking.class';
import { checkinBooking } from './bookings.fn';

@Component({
    selector: 'booking-details-modal',
    template: `
        <div
            class="absolute inset-0 sm:relative sm:inset-auto sm:w-[24rem] sm:max-h-[80vh] bg-white dark:bg-neutral-600 sm:rounded overflow-auto space-y-2 pb-4"
        >
            <div class="bg-black/20 dark:bg-white/20 w-full h-64">
                <image-carousel
                    [images]="booking?.extension_data?.images"
                    class="w-full h-64"
                ></image-carousel>
            </div>
            <h3 title class="px-3 mt-2 text-xl font-medium">{{ booking.title }}</h3>
            <div class="flex m-2">
                <div
                    class="flex items-center bg-opacity-30 rounded-2xl p-1 text-sm space-x-2 pr-2 font-medium"
                    [class.bg-green-600]="
                        !booking.is_done && booking?.status === 'approved'
                    "
                    [class.bg-yellow-500]="
                        !booking.is_done && booking?.status === 'tentative'
                    "
                    [class.bg-red-600]="
                        !booking.is_done && booking?.status === 'declined'
                    "
                    [class.bg-gray-300]="booking.is_done"
                >
                    <div
                        class="rounded-full h-5 w-5 flex items-center justify-center text-white"
                        [class.bg-success]="
                            !booking.is_done && booking?.status === 'approved'
                        "
                        [class.text-pending]="
                            !booking.is_done && booking?.status === 'tentative'
                        "
                        [class.bg-error]="
                            !booking.is_done && booking?.status === 'declined'
                        "
                        [class.text-neutral-600]="booking.is_done"
                    >
                        <app-icon>
                            {{
                                booking.is_done
                                    ? 'not_interested'
                                    : booking?.status === 'approved'
                                    ? 'done'
                                    : booking?.status === 'tentative'
                                    ? 'warning'
                                    : 'close'
                            }}
                        </app-icon>
                    </div>
                    <div class="pr-1">{{ period }}</div>
                </div>
            </div>
            <div
                actions
                class="flex items-center space-x-2 px-2"
                *ngIf="!booking.is_done"
            >
                <button
                    mat-button
                    class="flex-1 h-10"
                    [class.inverse]="booking.checked_in"
                    [disabled]="checking_in"
                    (click)="toggleCheckedIn()"
                >
                    <div class="flex items-center space-x-2 justify-center" *ngIf="!checking_in; else loading_state">
                        <app-icon>{{
                            booking.checked_in ? 'done' : 'arrow_back'
                        }}</app-icon>
                        <div class="mr-2">
                            {{
                                booking.checked_in
                                    ? 'Checked in'
                                    : 'Not checked in'
                            }}
                        </div>
                    </div>
                    <ng-template #loading_state>
                        <mat-spinner class="mx-auto" [diameter]="32"></mat-spinner>
                    </ng-template>
                </button>
                <button
                    mat-icon-button
                    [matMenuTriggerFor]="menu"
                    class="bg-primary rounded text-white h-10 w-10"
                >
                    <app-icon>more_horiz</app-icon>
                </button>
            </div>
            <h3 class="px-3 mt-2 text-lg font-medium">Details</h3>
            <div class="flex items-center px-2 space-x-2">
                <app-icon>event</app-icon>
                <div>{{ booking.date | date: 'EEEE, dd LLLL y' }}</div>
            </div>
            <div class="flex items-center px-2 space-x-2">
                <app-icon>schedule</app-icon>
                <div>{{ period }}</div>
            </div>
            <div class="flex items-center px-2 space-x-2">
                <app-icon>map</app-icon>
                <div>
                    {{ level?.display_name || level?.name }},
                    {{ booking.asset_name || booking.asset_id }}
                </div>
            </div>
            <div class="flex items-center px-2 space-x-2">
                <app-icon>place</app-icon>
                <div>
                    {{ building?.display_name || building?.name }},
                    {{ building?.address }}
                </div>
            </div>
            <div
                map
                class="mx-4 h-64 sm:h-48 relative border border-gray-200 overflow-hidden rounded"
            >
                <interactive-map
                    class="pointer-events-none"
                    [src]="level?.map_id"
                    [features]="features"
                    [options]="{ disable_pan: true, disable_zoom: true }"
                ></interactive-map>
            </div>
            <button
                mat-icon-button
                mat-dialog-close
                class="absolute top-2 left-2 bg-black/30 text-white"
            >
                <app-icon>close</app-icon>
            </button>
        </div>
        <mat-menu #menu="matMenu" xPosition="before">
            <!-- <button mat-menu-item mat-dialog-close class="flex items-center space-x-2 text-base" (click)="edit.emit()">
                <app-icon>edit</app-icon>
                <div>Edit booking</div>
            </button> -->
            <button mat-menu-item class="flex items-center space-x-2 text-base" (click)="remove.emit()">
                <app-icon>delete</app-icon>
                <div>Delete booking</div>
            </button>
        </mat-menu>
    `,
    styles: [``],
})
export class BookingDetailsModalComponent {
    @Output() public edit = new EventEmitter();
    @Output() public remove = new EventEmitter();
    public readonly booking = this._booking;
    public checking_in = false;
    public readonly features = [
        {
            location: this.booking?.asset_id,
            content: MapPinComponent,
        },
    ];

    public get level() {
        return this._org.levelWithID(this.booking?.zones || []);
    }

    public get building() {
        return this._org.buildings.find((bld) =>
            (this.booking?.zones || []).includes(bld.id)
        );
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) private _booking: Booking,
        private _org: OrganisationService
    ) {}

    public get period() {
        const start = this.booking?.date || Date.now();
        const duration = this.booking?.duration || 60;
        const end = addMinutes(start, duration);
        const dur = formatDuration({
            hours: Math.floor(duration / 60),
            minutes: duration % 60,
        })
            .replace(' hour', 'hr')
            .replace(' minute', 'min');
        return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')} (${dur})`;
    }

    public async toggleCheckedIn() {
        this.checking_in = true;
        await checkinBooking(this.booking.id, !this.booking.checked_in);
        (this.booking as any).checked_in = !this.booking.checked_in;
        notifySuccess(`Successfully ${this.booking.checked_in ? 'checked in' : 'checked out'}`);
        this.checking_in = false;
    }
}