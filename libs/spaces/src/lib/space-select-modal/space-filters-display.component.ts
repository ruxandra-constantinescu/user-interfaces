import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BaseClass } from '@placeos/common';
import { EventFormService } from '@placeos/events';
import { OrganisationService } from '@placeos/organisation';
import { take } from 'rxjs/operators';
import { SpaceFiltersComponent } from './space-filters.component';

@Component({
    selector: `space-filters-display`,
    template: `
        <section actions class="sm:hidden space-x-2 flex items-center p-2">
            <button
                mat-button
                filters
                class="flex-1 w-1/2"
                (click)="editFilters()"
                i18n
            >
                Filters
            </button>
            <div class="flex items-center">
                <button
                    mat-button
                    map
                    class="rounded-l rounded-r-none"
                    [class.inverse]="view !== 'map'"
                    (click)="view = 'map'; viewChange.emit(view)"
                    i18n
                >
                    Map
                </button>
                <button
                    mat-button
                    list
                    class="rounded-r rounded-l-none"
                    [class.inverse]="view !== 'list'"
                    (click)="view = 'list'; viewChange.emit(view)"
                    i18n
                >
                    List
                </button>
            </div>
        </section>
        <section filters class="flex items-center flex-wrap p-2">
            <div
                filter-item
                zone
                class="dark:border-neutral-500"
                *ngIf="location"
            >
                {{ location }}
            </div>
            <div filter-item date class="dark:border-neutral-500">
                {{ start | date: 'mediumDate' }}
            </div>
            <div filter-item time class="dark:border-neutral-500">
                {{ start | date: 'shortTime' }} &mdash;
                {{ end | date: 'shortTime' }}
            </div>
            <div filter-item count class="dark:border-neutral-500" i18n>
                Min. {{ (options | async)?.capcaity || 2 }} People
            </div>
            <div filter-item *ngFor="let feat of (options | async)?.features">
                <p>{{ feat }}</p>
                <button
                    mat-icon-button
                    class="-mr-4 dark:border-neutral-500"
                    (click)="removeFeature(feat)"
                >
                    <app-icon>close</app-icon>
                </button>
            </div>
        </section>
    `,
    styles: [
        `
            [filter-item] {
                display: flex;
                align-items: center;
                padding: 0 1rem;
                height: 2rem;
                font-size: 0.875rem;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 1.25rem;
                margin-right: 0.5rem;
                margin-bottom: 0.5rem;
            }

            [filter-item]:hover {
                background: rgba(0, 0, 0, 0.1);
            }

            [filter-item] > * + * {
                margin-left: 0.5rem;
            }
        `,
    ],
})
export class SpaceFiltersDisplayComponent extends BaseClass {
    @Input() public view: 'map' | 'list' = 'list';
    @Output() public viewChange = new EventEmitter<'map' | 'list'>();
    public readonly options = this._event_form.options;
    public location: string = '';

    public get start() {
        return this._event_form.form.value.date;
    }

    public get end() {
        const { date, duration } = this._event_form.form.value;
        return date + duration * 60 * 1000;
    }

    public readonly editFilters = () =>
        this._bsheet.open(SpaceFiltersComponent);

    constructor(
        private _bsheet: MatBottomSheet,
        private _event_form: EventFormService,
        private _org: OrganisationService
    ) {
        super();
    }

    public ngOnInit() {
        this.subscription(
            'opts',
            this.options.subscribe(({ zone_ids }) =>
                this._updateLocation(zone_ids)
            )
        );
    }

    public async removeFeature(feat: string) {
        const value = await this._event_form.options.pipe(take(1)).toPromise();
        this._event_form.setOptions({
            ...value,
            features: (value.features || []).filter((_) => _ !== feat),
        });
    }

    private _updateLocation(zone_ids: string[] = []) {
        const level = this._org.levelWithID(zone_ids);
        const item = level || this._org.building;
        this.location = item?.display_name || item?.name || '';
    }
}
