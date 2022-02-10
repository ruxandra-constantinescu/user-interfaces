import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import {
    MomentDateAdapter,
    MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import * as _rollupMoment from 'moment';

const moment = _rollupMoment || _moment;

@Component({
    selector: 'room-details',
    templateUrl: './room-details.component.html',
    styles: [''],

    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
        },
    ],
})
export class RoomDetailsComponent implements OnInit {
    date = new FormControl(moment());

    detailsFormGroup = new FormGroup({
        title: new FormControl('title'),
        datePicker: new FormControl('datePicker'),
        startTimePicker: new FormControl('startTimePicker'),
        endTimePicker: new FormControl('endTimePicker'),
    });
    minDate: Date = new Date();

    constructor() {}

    ngOnInit(): void {}
}
