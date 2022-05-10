import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseClass } from '@placeos/common';
import { EventFormService } from '@placeos/events';

@Component({
    selector: 'placeos-book-meeting-flow',
    template: `
        <div class="bg-white h-full w-full" [ngSwitch]="view">
            <meeting-flow-success *ngSwitchCase="'success'">
            </meeting-flow-success>
            <meeting-flow-confirm *ngSwitchCase="'confirm'">
            </meeting-flow-confirm>
            <meeting-flow-form *ngSwitchDefault></meeting-flow-form>
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
export class BookMeetingFlowComponent extends BaseClass implements OnInit {
    public get view() {
        return this._state.view;
    }
    public get last_success() {
        return this._state.last_success;
    }

    constructor(
        private _state: EventFormService,
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
                if (param.has('success')) this._state.setView('success');
            })
        );
    }
}