import { Component, OnInit, Inject } from '@angular/core';
import {
    MatBottomSheetRef,
    MAT_BOTTOM_SHEET_DATA,
} from '@angular/material/bottom-sheet';
import { Observable, of } from 'rxjs';
import { Space } from '@placeos/spaces';
import { scan } from 'rxjs/operators';

@Component({
    selector: 'placeos-room-details',
    templateUrl: './room-details.component.html',
    styles: [``],
})
export class RoomDetailsComponent implements OnInit {
    space: Space;
    roomAdded: Boolean = false;

    constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
        private _bottomSheetRef: MatBottomSheetRef<RoomDetailsComponent>
    ) {}

    ngOnInit() {
        this.space = this.data;
    }

    selectRoom() {
        this.roomAdded = !this.roomAdded;
        console.log('button pressed');

        // this._bottomSheetRef.dismiss(this.space);
    }

    back() {
        if (this.roomAdded) {
            this._bottomSheetRef.dismiss(this.space);
        } else {
            this._bottomSheetRef.dismiss('cancel');
        }
    }
}
