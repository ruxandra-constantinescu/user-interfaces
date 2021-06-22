import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BookingStateService } from '@placeos/bookings';
import { OrganisationService } from '@placeos/organisation';

@Component({
    selector: 'detailed-book-desks-form',
    template: `
        <form *ngIf="form" [formGroup]="form">
            <section class="mb-4 border-b border-gray-300">
                <div class="w-[640px] max-w-[calc(100%-2rem)] mx-auto mb-4">
                    <mat-button-toggle-group
                        class="w-full"
                        [ngModel]="
                            (options | async)?.group ? 'group' : 'single'
                        "
                        (ngModelChange)="
                            setOptions({
                                group: $event === 'group'
                            })
                        "
                        [ngModelOptions]="{ standalone: true }"
                    >
                        <mat-button-toggle class="w-1/2" value="single">
                            Single
                        </mat-button-toggle>
                        <mat-button-toggle class="w-1/2" value="group">
                            Group
                        </mat-button-toggle>
                    </mat-button-toggle-group>
                </div>
                <div
                    class="flex flex-col sm:flex-row space-x-0 sm:space-x-2 w-[640px] max-w-[calc(100%-2rem)] mx-auto"
                >
                    <div class="flex flex-col flex-1 w-full sm:w-1/3">
                        <label>Date</label>
                        <a-date-field formControlName="date">
                            Date and time must be in the future
                        </a-date-field>
                    </div>
                    <div
                        class="flex flex-col flex-1 w-full sm:w-1/3"
                        *ngIf="(buildings | async)?.length > 1"
                    >
                        <label>Building</label>
                        <mat-form-field appearance="outline">
                            <mat-select
                                placeholder="Select building"
                                [(ngModel)]="building"
                                (ngModelChange)="
                                    setOptions({
                                        zone_id: $event?.id
                                    })
                                "
                                [ngModelOptions]="{ standalone: true }"
                            >
                                <mat-option
                                    *ngFor="let bld of buildings | async"
                                    [value]="bld"
                                >
                                    {{ bld.display_name || bld.name }}
                                </mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                    <div
                        class="flex flex-col flex-1 w-full sm:w-1/3"
                        *ngIf="(levels | async)?.length > 1"
                    >
                        <label>Level</label>
                        <mat-form-field appearance="outline">
                            <mat-select
                                placeholder="Any Level"
                                ngModel
                                [disabled]="!building"
                                (ngModelChange)="
                                    setOptions({
                                        zone_id: $event || building.id
                                    })
                                "
                                [ngModelOptions]="{ standalone: true }"
                            >
                                <mat-option
                                    *ngFor="let lvl of levels | async"
                                    [value]="lvl.id"
                                >
                                    {{ lvl.display_name || lvl.name }}
                                </mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                </div>
                <div
                    class="flex flex-col flex-1 w-[640px] max-w-[calc(100%-2rem)] mx-auto"
                >
                    <label>Reason</label>
                    <mat-form-field class="w-full" appearance="outline">
                        <input
                            matInput
                            formControlName="description"
                            placeholder="Reason for booking..."
                        />
                    </mat-form-field>
                </div>
                <div
                    class="flex flex-col sm:flex-row space-x-0 sm:space-x-2 w-[640px] max-w-[calc(100%-2rem)] mx-auto"
                >
                    <div class="flex flex-col flex-1 w-full sm:w-1/3">
                        <label>Recurrence Period</label>
                        <mat-form-field appearance="outline">
                            <mat-select
                                [ngModel]="
                                    (options | async)?.recurrence_pattern
                                "
                                (ngModelChange)="
                                    setOptions({ pattern: $event })
                                "
                                [ngModelOptions]="{ standalone: true }"
                                placeholder="None"
                            >
                                <mat-option value="none">None</mat-option>
                                <mat-option
                                    *ngFor="let opt of recurrence_options"
                                    [value]="opt"
                                >
                                    <span class="capitalize">{{ opt }}</span>
                                </mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                    <div class="flex flex-col flex-1 w-full sm:w-1/3">
                        <label>Recurrence End</label>
                        <a-date-field
                            [disabled]="
                                !(options | async)?.pattern ||
                                (options | async)?.pattern === 'none'
                            "
                            [ngModel]="
                                (options | async)?.recurr_end ||
                                form?.value?.date
                            "
                            (ngModelChange)="
                                setOptions({
                                    recurr_end: $event
                                })
                            "
                            [ngModelOptions]="{ standalone: true }"
                        >
                            Date and time must be in the future
                        </a-date-field>
                    </div>
                </div>
                <div
                    class="flex flex-col flex-1 w-[640px] max-w-[calc(100%-2rem)] mx-auto"
                    *ngIf="(options | async)?.features?.length"
                >
                    <label>Desk Features</label>
                    <mat-form-field class="w-full" appearance="outline">
                        <mat-select
                            multiple
                            [ngModel]="(options | async)?.features || []"
                            (ngModelChange)="
                                setOptions({
                                    features: $event || []
                                })
                            "
                            [ngModelOptions]="{ standalone: true }"
                        >
                            <mat-option
                                *ngFor="let opt of (options | async)?.features"
                                class="capitalize"
                            >
                                {{ opt }}
                            </mat-option>
                        </mat-select>
                    </mat-form-field>
                </div>
            </section>
        </form>
    `,
    styles: [``],
})
export class DeskFlowDetailedFormComponent {
    @Input() public form: FormGroup;
    /** List of available buildings to select */
    public readonly buildings = this._org.building_list;
    /** List of available levels for the selected building */
    public readonly levels = this._org.active_levels;
    /** List of set options for desk booking */
    public readonly options = this._state.options;

    public readonly recurrence_options = ['daily', 'weekly', 'monthly'];

    public get building() {
        return this._org.building;
    }
    public set building(bld) {
        this._org.building = bld;
    }

    public readonly setOptions = (o) => this._state.setOptions(o);

    constructor(
        private _state: BookingStateService,
        private _org: OrganisationService
    ) {}
}
