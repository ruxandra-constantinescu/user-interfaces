import { Component } from '@angular/core';
import { downloadFile, jsonToCsv } from '@placeos/common';
import { User } from '@placeos/users';
import { formatDuration } from 'date-fns';
import { combineLatest } from 'rxjs';
import { debounceTime, map, shareReplay, take } from 'rxjs/operators';
import { ReportsStateService } from '../reports-state.service';

@Component({
    selector: 'report-spaces-user-listing',
    template: `
        <div class="m-4 rounded bg-base-100 shadow overflow-hidden">
            <div class="border-b border-base-200 px-4 py-2 flex items-center">
                <h3 class="font-bold text-xl flex-1">Meeting Organisers</h3>
                <button icon (click)="download()">
                    <app-icon>download</app-icon>
                </button>
            </div>
            <custom-table
                [dataSource]="user_list"
                [pagination]="true"
                [columns]="[
                    'name',
                    'booking_count',
                    'avg_attendees',
                    'total_time',
                    'no_shows'
                ]"
                [display_column]="[
                    'Name',
                    'Bookings',
                    'Avg. Invitees per Booking',
                    'Total Booked Time',
                    'No Shows'
                ]"
                [column_size]="['flex']"
            ></custom-table>
        </div>
    `,
    styles: [``],
})
export class ReportSpacesUserListingComponent {
    public readonly user_list = combineLatest([this._reports.stats]).pipe(
        debounceTime(300),
        map(([stats]) => {
            let list = [];
            for (const booking of stats.events) {
                const host = booking.attendees?.find(
                    (_) =>
                        _.email === booking.extension_data?.host_override ||
                        _.email === booking.host
                );
                if (!host) continue;
                const capacity = Math.max(
                    booking.resources.reduce((c, s) => c + s.capacity, 0) || 1,
                    1
                );
                let details = list.find(
                    (_) => _.id?.toLowerCase() === host.email.toLowerCase()
                );
                if (!details) {
                    details = {
                        id: host.email,
                        name: host.name,
                        capacity,
                        booking_count: 0,
                        attendees: 0,
                        avg_attendees: 0,
                        no_shows: 0,
                        occupancy: 0,
                        total_time: 0,
                    };
                    list.push(details);
                }
                if (booking.extension_data?.people_count?.max === 0) {
                    details.no_shows += 1;
                }
                details.booking_count += 1;
                details.attendees += booking.attendees.length;
                details.total_time += booking.duration || 15;
            }
            for (const space of list) {
                space.avg_attendees =
                    Math.floor((space.attendees / space.booking_count) * 100) /
                    100;
                space.occupancy =
                    Math.floor((space.avg_attendees / space.capacity) * 100) /
                    100;
                space.total_time = formatDuration({
                    hours: Math.floor(space.total_time / 60),
                    minutes: space.total_time % 60,
                });
            }
            return list;
        }),
        shareReplay(1)
    );

    public readonly download = async () => {
        const data = await this.user_list.pipe(take(1)).toPromise();
        for (const item of data) {
            delete item.attendance;
            delete item.avg_attendance;
            delete item.min_attendance;
            delete item.max_attendance;
            delete item.occupancy;
        }
        downloadFile('report-space-attendee-usage.csv', jsonToCsv(data));
    };

    constructor(private _reports: ReportsStateService) {}
}
