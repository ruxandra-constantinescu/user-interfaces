import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { SettingsService } from "@placeos/common";
import { OrganisationService } from "@placeos/organisation";

@Component({
    selector: 'parking-form-details',
    template: `
    <div *ngIf="form" [formGroup]="form">
        <div class="flex items-center flex-wrap sm:space-x-2">
            <div class="flex-1 min-w-[256px]">
                <label for="title">Building<span>*</span></label>
                <mat-form-field appearance="outline" class="w-full">
                    <mat-select [ngModel]="building | async" (ngModelChange)="setBuilding($event)" [ngModelOptions]="{ standalone: true }">
                        <mat-option *ngFor="let bld of building_list | async" [value]="bld">
                            {{ bld.display_name || bld.name }}
                        </mat-option>
                    </mat-select>
                    <mat-error>Building is required</mat-error>
                </mat-form-field>
            </div>
        </div>
        <div class="flex items-center flex-wrap sm:space-x-2">
            <div class="flex-1 min-w-[256px]">
                <label for="title">Add Title<span>*</span></label>
                <mat-form-field appearance="outline" class="w-full">
                    <input
                        matInput
                        name="title"
                        formControlName="title"
                        placeholder="e.g. Team Meeting"
                    />
                    <mat-error>Meeting title is required.</mat-error>
                </mat-form-field>
            </div>
            <div class="flex-1 min-w-[256px]">
                <label for="date">Date<span>*</span></label>
                <a-date-field name="date" formControlName="date">
                    Date and time must be in the future
                </a-date-field>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <div class="flex-1 w-1/3">
                <label for="start-time">Start Time<span>*</span></label>
                <a-time-field
                    name="start-time"
                    [ngModel]="form.value.date"
                    (ngModelChange)="form.patchValue({ date: $event })"
                    [ngModelOptions]="{ standalone: true }"
                ></a-time-field>
            </div>
            <div class="flex-1 w-1/3 relative">
                <label for="end-time">End Time<span>*</span></label>
                <a-duration-field
                    name="end-time"
                    formControlName="duration"
                    [time]="form?.value?.date"
                    [max]="max_duration"
                >
                </a-duration-field>
                <mat-checkbox
                    formControlName="all_day"
                    *ngIf="allow_all_day"
                    class="absolute top-0 right-0"
                >
                    All Day
                </mat-checkbox>
            </div>
        </div>
    </div>
    `,
    styles: [``]
})
export class ParkingFormDetailsComponent {
    @Input() public form: FormGroup;

    public readonly building = this._org.active_building;
    public readonly building_list = this._org.building_list;

    public get max_duration() {
        return this._settings.get('app.bookings.max_duration') || 480;
    }

    public get allow_all_day() {
        return this._settings.get('app.bookings.allow_all_day');
    }

    public readonly setBuilding = (bld) => this._org.building = bld;

    constructor(private _settings: SettingsService, private _org: OrganisationService) {}
}