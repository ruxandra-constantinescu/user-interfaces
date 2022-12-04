import { Injectable } from '@angular/core';
import { Booking, queryBookings } from '@placeos/bookings';
import { BaseClass, SettingsService } from '@placeos/common';
import {
    CalendarEvent,
    newCalendarEventFromBooking,
    queryEvents,
} from '@placeos/events';
import { endOfDay, getUnixTime, startOfDay } from 'date-fns';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { catchError, debounceTime, map, shareReplay, switchMap, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ScheduleStateService extends BaseClass {
    private _poll = new BehaviorSubject(0);
    private _loading = new BehaviorSubject(false);
    private _filters = new BehaviorSubject({
        shown_types: ['event', 'desk', 'parking', 'visitor'],
    });
    private _date = new BehaviorSubject(Date.now());
    private _update = combineLatest([this._date, this._poll]).pipe(
        debounceTime(500),
        tap((_) => this._loading.next(true))
    );
    /** List of calendar events for the selected date */
    public readonly events: Observable<CalendarEvent[]> = this._update.pipe(
        switchMap(([date]) => {
            const query = {
                period_start: getUnixTime(startOfDay(date)),
                period_end: getUnixTime(endOfDay(date)),
            };
            return this._settings.get('app.no_user_calendar')
                ? queryBookings({ ...query, type: 'room' }).pipe(
                      map((_) => _.map((i) => newCalendarEventFromBooking(i))),
                      catchError((_) => [])
                  )
                : queryEvents({ ...query }).pipe(catchError((_) => []));
        }),
        tap(() => this.timeout('end_loading', () => this._loading.next(false))),
        shareReplay(1)
    );
    /** List of desk bookings for the selected date */
    public readonly visitors: Observable<Booking[]> = this._update.pipe(
        switchMap(([date]) =>
            queryBookings({
                period_start: getUnixTime(startOfDay(date)),
                period_end: getUnixTime(endOfDay(date)),
                type: 'visitor',
            }).pipe(catchError((_) => {
                console.error(_);
                return [];
            }))
        ),
        tap(() => this.timeout('end_loading', () => this._loading.next(false))),
        shareReplay(1)
    );
    /** List of desk bookings for the selected date */
    public readonly desks: Observable<Booking[]> = this._update.pipe(
        switchMap(([date]) =>
            queryBookings({
                period_start: getUnixTime(startOfDay(date)),
                period_end: getUnixTime(endOfDay(date)),
                type: 'desk',
            }).pipe(catchError((_) => {
                console.error(_);
                return [];
            }))
        ),
        tap(() => this.timeout('end_loading', () => this._loading.next(false))),
        shareReplay(1)
    );
    /** List of parking bookings for the selected date */
    public readonly parking: Observable<Booking[]> = this._update.pipe(
        switchMap(([date]) =>
            queryBookings({
                period_start: getUnixTime(startOfDay(date)),
                period_end: getUnixTime(endOfDay(date)),
                type: 'parking',
            }).pipe(catchError((_) => []))
        ),
        tap(() => this.timeout('end_loading', () => this._loading.next(false))),
        shareReplay(1)
    );

    /** List of events and bookings for the selected date */
    public readonly bookings = combineLatest([
        this.events,
        this.visitors,
        this.desks,
        this.parking,
    ]).pipe(
        map(([e, v, d, p]) => [...e, ...v, ...d, ...p].sort((a, b) => a.date - b.date))
    );
    /** Filtered list of events and bookings for the selected date */
    public readonly filtered_bookings = combineLatest([
        this.bookings,
        this._filters,
    ]).pipe(
        map(([bkns, filters]) =>
            bkns.filter(
                (_) =>
                    (_ instanceof CalendarEvent &&
                        filters?.shown_types?.includes('event')) ||
                    filters?.shown_types?.includes((_ as any).booking_type)
            )
        )
    );
    /** Currently selected date */
    public readonly filters = this._filters.asObservable();
    /** Currently selected date */
    public readonly date = this._date.asObservable();
    /** Whether events and bookings are loading */
    public readonly loading = this._loading.asObservable();

    constructor(private _settings: SettingsService) {
        super();
    }

    public triggerPoll(){
        this._poll.next(Date.now());
    }

    public startPolling(delay = 60 * 1000) {
        this.interval('poll', () => {
            document.visibilityState === 'visible' 
                ? this._poll.next(Date.now()) 
                : '';
        }, delay);
        return () => this.stopPolling();
    }

    public stopPolling() {
        this.clearInterval('poll');
    }

    public setDate(date: number) {
        this._date.next(date);
    }

    public removeItem(item) {
        this._poll.next(Date.now());
    }

    public async toggleType(name: string, clear: boolean = false) {
        const filters = this._filters.getValue() || { shown_types: [] };
        const { shown_types } = filters;
        if (shown_types && (shown_types.includes(name) || clear)) {
            this._filters.next({
                ...filters,
                shown_types: shown_types.filter((_) => _ !== name),
            });
        } else {
            this._filters.next({
                ...filters,
                shown_types: [...shown_types, name],
            });
        }
    }
}
