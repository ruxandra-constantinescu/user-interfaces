import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingStateService } from '@placeos/bookings';
import { BaseClass } from '@placeos/common';

@Component({
    selector: 'placeos-book-desk-flow',
    template: `
        <div class="bg-white h-full w-full">
            <ng-container [ngSwitch]="view">
                <ng-container *ngSwitchCase="'map'">
                    <desk-flow-map></desk-flow-map>
                </ng-container>
                <ng-container *ngSwitchCase="'confirm'">
                    <desk-flow-confirm></desk-flow-confirm>
                </ng-container>
                <ng-container *ngSwitchCase="'success'">
                    <flow-success
                        type="desk"
                        route="desks"
                        [calendar]="last_success?.user_email"
                    ></flow-success>
                </ng-container>
                <ng-container *ngSwitchDefault>
                    <desk-flow-form></desk-flow-form>
                </ng-container>
            </ng-container>
        </div>
    `,
    styles: [
        `
            :host {
                height: 100%;
                width: 100%;
            }
        `,
    ],
})
export class BookDeskFlowComponent extends BaseClass implements OnInit {
    public get view() {
        return this._state.view;
    }
    public get last_success() {
        return this._state.last_success;
    }

    constructor(
        private _state: BookingStateService,
        private _route: ActivatedRoute
    ) {
        super();
    }

    public ngOnInit() {
        this._state.loadForm();
        if (!this._state.form) this._state.newForm();
        this.subscription(
            'route.params',
            this._route.paramMap.subscribe((param) => {
                if (param.has('step'))
                    this._state.setView(param.get('step') as any);
            })
        );
        this.subscription(
            'route.query',
            this._route.queryParamMap.subscribe((param) => {
                if (param.has('success'))
                    this._state.setView(param.get('success') as any);
            })
        );
    }
}
