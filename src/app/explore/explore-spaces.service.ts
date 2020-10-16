import { Injectable } from '@angular/core';
import { listen } from '@placeos/ts-client';
import { ViewAction, ViewerFeature } from '@yuion/svg-viewer';

import { BaseClass } from '../common/base.class';
import { SettingsService } from '../common/settings.service';
import { HashMap } from '../common/types';
import { Space } from '../spaces/space.class';
import { CalendarEvent } from '../events/event.class';
import { ExploreStateService } from './explore-state.service';

import { ExploreSpaceInfoComponent } from './explore-space-info.component';

export const DEFAULT_COLOURS = {
    'free': '#43a047',
    'pending': '#ffb300',
    'reserved': '#3949ab',
    'busy': '#e53935',
    'not-bookable': '#757575',
    'unknown': '#757575',
};

@Injectable()
export class ExploreSpacesService extends BaseClass {
    private _spaces: Space[] = [];
    private _bookings: HashMap<CalendarEvent[]> = {};
    private _statuses: HashMap<string> = {};

    constructor(private _state: ExploreStateService, private _settings: SettingsService) {
        super();
        this.subscription(
            'spaces',
            this._state.spaces.subscribe((list) => {
                this.clearBindings();
                this._spaces = list;
                this.bindToSpaces();
            })
        );
    }

    public clearBindings() {
        if (!this._spaces) return;
        for (const space of this._spaces) {
            this.unsub(`bookings-${space.id}`);
            this.unsub(`status-${space.id}`);
        }
        this._statuses = {};
    }

    public bindToSpaces() {
        if (!this._spaces) return;
        for (const space of this._spaces) {
            this.subscription(
                `bookings-${space.id}`,
                listen({
                    sys: space.id,
                    mod: 'Bookings',
                    index: 1,
                    name: 'bookings',
                }).subscribe((d) => this.handleBookingsChange(space, d))
            );
            this.subscription(
                `status-${space.id}`,
                listen({
                    sys: space.id,
                    mod: 'Bookings',
                    index: 1,
                    name: 'status',
                }).subscribe((d) => this.handleStatusChange(space, d))
            );
        }
        this.timeout('update_hover_els', () => {
            this.updateActions();
            this.updateHoverElements();
        }, 100);
    }

    public bookSpace(space: Space) {
        console.log('Book Space:', space);
    }

    private handleBookingsChange(space: Space, bookings: HashMap[]) {
        if (!bookings) return;
        this._bookings[space.id] = bookings.map((i) => new CalendarEvent(i));
        this.timeout('update_hover_els', () => this.updateHoverElements(), 100);

    }

    private handleStatusChange(space: Space, status: string) {
        this._statuses[space.id] = space.bookable ? status || 'free' : 'not-bookable';
        this.timeout('update_statuses', () => {
            this.clearTimeout('update_hover_els');
            this.updateStatus();
            this.updateHoverElements();
        }, 100);
    }

    private updateStatus() {
        const style_map = {};
        const colours = this._settings.get('app.explore.colors') || DEFAULT_COLOURS;
        for (const space of this._spaces) {
            style_map[`#${space.map_id}`] = {
                fill: colours[`space-${this._statuses[space.id]}`] || colours[`${this._statuses[space.id]}`],
                opacity: 0.6,
            };
        }
        this._state.setStyles('spaces', style_map);
    }

    private updateHoverElements() {
        const features: ViewerFeature[] = [];
        for (const space of this._spaces) {
            features.push({
                location: space.map_id,
                hover: true,
                content: ExploreSpaceInfoComponent,
                data: {
                    space,
                    events: this._bookings[space.id],
                    status: this._statuses[space.id]
                }
            } as any);
        }
        this._state.setFeatures('spaces', features);
    }

    private updateActions() {
        const actions: ViewAction[] = [];
        for (const space of this._spaces) {
            actions.push({
                id: space.map_id,
                action: 'click',
                callback: () => this.bookSpace(space)
            });
        }
        this._state.setActions('spaces', actions);
    }
}
