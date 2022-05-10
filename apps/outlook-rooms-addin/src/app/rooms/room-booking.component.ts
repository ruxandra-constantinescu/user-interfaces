import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { EventFormService } from '@placeos/events';

@Component({
    selector: 'room-booking',
    templateUrl: './room-booking.component.html',
    styles: [
        `
            .button-text {
                color: var(--secondary);
            }

            ::ng-deep.mat-form-field-appearance-outline
                .mat-form-field-outline-start,
            ::ng-deep.mat-form-field-appearance-outline
                .mat-form-field-outline-gap,
            ::ng-deep.mat-form-field-appearance-outline
                .mat-form-field-outline-end {
                background-color: white;
            }
        `,
    ],
})
export class RoomBookingComponent implements OnInit {
    public show_spaces = false;
    public show_people = false;
    public loading = false;

    minDate: Date = new Date();

    public get form(): FormGroup {
        return this._state.form;
    }

    public readonly clearForm = () => {
        this._state.clearForm();
    };

    constructor(private router: Router, private _state: EventFormService) {}

    ngOnInit(): void {
        this._state.newForm();
        this._state.form.patchValue({ booking_type: 'room' });
    }

    async findSpace() {
        this.form.markAllAsTouched();
        if (
            !this.form?.controls?.title.valid ||
            !this.form?.controls?.date.valid ||
            !this.form?.controls?.duration.valid
        )
            return;

        await this._state.storeForm();

        this.router.navigate(['/schedule/view']);
    }
}