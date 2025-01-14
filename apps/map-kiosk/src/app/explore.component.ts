import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
    AsyncHandler,
    InjectMapApiService,
    notifyError,
    SettingsService,
    unique,
} from '@placeos/common';
import {
    MapPinComponent,
    MapRadiusComponent,
    VirtualKeyboardComponent,
} from '@placeos/components';
import {
    ExploreDesksService,
    ExploreParkingService,
    ExploreSpacesService,
    ExploreStateService,
    ExploreZonesService,
} from '@placeos/explore';
import { OrganisationService } from '@placeos/organisation';
import { SpacesService } from '@placeos/spaces';
import { Point } from '@placeos/svg-viewer';
import { getModule } from '@placeos/ts-client';
import { MapLocation, showStaff, User } from '@placeos/users';
import { startOfMinute } from 'date-fns';
import { SpacePipe } from 'libs/spaces/src/lib/space.pipe';
import { first, take } from 'rxjs/operators';

@Component({
    selector: '[app-explore]',
    template: `
        <a
            class="absolute top-0 left-0 bg-base-100 rounded-br-2xl p-4 z-10 shadow border-b border-r border-base-200"
            [routerLink]="['/']"
        >
            <img class="w-32" [src]="logo?.src" />
        </a>
        <div
            class="absolute top-0 left-1/2 -translate-x-1/2 bg-base-100 rounded-b-2xl px-4 pb-4 pt-3 z-10 shadow border-b border-r border-base-200 text-base-content"
        >
            {{ time | date: 'fullDate' }}
        </div>
        <!-- <explore-map-stack class="z-0"></explore-map-stack> -->
        <div class="absolute inset-0">
            <i-map
                *ngIf="!(use_mapsindoors$ | async)"
                [src]="url | async"
                [zoom]="(positions | async)?.zoom"
                [center]="(positions | async)?.center"
                (zoomChange)="updateZoom($event)"
                (centerChange)="updateCenter($event)"
                [styles]="styles | async"
                [features]="features | async"
                [actions]="actions | async"
                [labels]="labels | async"
            ></i-map>
            <indoor-maps
                *ngIf="use_mapsindoors$ | async"
                [styles]="styles | async"
                [actions]="actions | async"
            ></indoor-maps>
        </div>
        <explore-zoom-controls
            *ngIf="!(use_mapsindoors$ | async)"
            class="absolute top-1/2 transform -translate-y-1/2 right-0"
        ></explore-zoom-controls>
        <explore-level-select
            *ngIf="!(use_mapsindoors$ | async)"
            class="absolute left-1 top-1/2 transform -translate-y-1/2 z-10"
        ></explore-level-select>
        <explore-search
            *ngIf="can_search && !(use_mapsindoors$ | async)"
            class="absolute top-1 right-1"
        ></explore-search>
        <div
            name="zones"
            class="p-2 bg-base-100 border border-base-200 absolute right-1 m-2 rounded flex flex-col items-center space-y-2"
            [class.top-2]="!can_search"
            [class.top-16]="can_search"
            *ngIf="!hide_zones"
        >
            <div class="flex items-center">
                Zones
                <mat-slide-toggle
                    class="ml-2"
                    [ngModel]="!(options | async)?.disable?.includes('zones')"
                    (ngModelChange)="toggleZones($event)"
                ></mat-slide-toggle>
            </div>
            <div
                zone-legend
                *ngIf="!(options | async)?.disable?.includes('zones')"
                class="space-y-2"
            >
                <div class="font-medium">
                    Zone Usage
                    <div class="flex items-center space-x-2">
                        <div class="h-3 w-3 rounded-full bg-success"></div>
                        <div class="w-20 text-center">0 ~ 50%</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="h-3 w-3 rounded-full bg-warning"></div>
                        <div class="w-20 text-center">51 ~ 75%</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="h-3 w-3 rounded-full bg-error"></div>
                        <div class="w-20 text-center">76 ~ 100%</div>
                    </div>
                </div>
            </div>
        </div>
        <div
            class="absolute bottom-2 right-2 p-2 rounded bg-base-100 shadow border border-base-200"
        >
            <div class="font-medium">Legend</div>
            <div class="flex items-center space-x-2 p-2">
                <div class="h-3 w-3 rounded-full bg-success"></div>
                <div class="text-center">Space Available</div>
            </div>
            <div class="flex items-center space-x-2 rounded bg-base-200 p-2">
                <div class="h-3 w-3 rounded-full bg-error"></div>
                <div class="text-center">Space In Use</div>
            </div>
            <div class="flex items-center space-x-2 rounded bg-base-200 p-2">
                <div class="h-3 w-3 rounded-full bg-warning"></div>
                <div class="text-center">Space Pending</div>
            </div>
            <div class="flex items-center space-x-2 p-2">
                <div class="h-3 w-3 rounded-full bg-base-300"></div>
                <div class="text-center">Space Not-bookable</div>
            </div>
        </div>
        <!-- <footer-menu class="w-full"></footer-menu> -->
    `,
    styles: [
        `
            :host {
                position: absolute;
                display: flex;
                flex-direction: column;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--b2);
            }

            @media screen and (max-height: 640px) {
                explore-level-select {
                    transform: translateY(0) !important;
                    top: auto !important;
                    bottom: 0 !important;
                }
            }

            @media screen and (orientation: landscape) {
                explore-level-select {
                    transform: translateY(0) !important;
                    top: auto !important;
                    bottom: 0 !important;
                }
            }
        `,
    ],
    providers: [
        ExploreSpacesService,
        ExploreDesksService,
        ExploreZonesService,
        ExploreParkingService,
        SpacePipe,
    ],
})
export class ExploreComponent extends AsyncHandler implements OnInit {
    /** Number of seconds after a user action to reset the kiosk state */
    public reset_delay = 180;

    /** Application logo to display */
    public get logo() {
        return this._settings.get('theme') === 'dark'
            ? this._settings.get('app.logo_dark')
            : this._settings.get('app.logo_light');
    }

    public get time() {
        return startOfMinute(Date.now());
    }

    public get hide_zones() {
        return this._settings.get('app.hide_zones');
    }
    /** Observable for the active map */
    public readonly url = this._state.map_url;
    /** Observable for the active map */
    public readonly styles = this._state.map_styles;
    /** Observable for the active map */
    public readonly positions = this._state.map_positions;
    /** Observable for the active map */
    public readonly features = this._state.map_features;
    /** Observable for the active map */
    public readonly actions = this._state.map_actions;
    /** Observable for the labels map */
    public readonly labels = this._state.map_labels;
    /** Observable for the active map */
    public readonly options = this._state.options;

    @HostListener('window:mousedown') public onMouse = () =>
        this.timeout('reset', () => this.resetKiosk(), this.reset_delay * 1000);
    @HostListener('window:touchstart') public onTouch = () =>
        this.timeout('reset', () => this.resetKiosk(), this.reset_delay * 1000);

    public readonly setOptions = (o) => this._state.setOptions(o);

    public updateZoom(zoom: number) {
        this._state.setPositions(zoom, this._state.positions.center);
    }

    public updateCenter(center: Point) {
        this._state.setPositions(this._state.positions.zoom, center);
    }

    public async toggleZones(enabled: boolean) {
        const options = await this.options.pipe(take(1)).toPromise();
        const disable = !enabled
            ? unique([...(options.disable || []), 'zones', 'devices'])
            : options.disable.filter((_) => _ !== 'zones' && _ !== 'devices') ||
              [];
        this.setOptions({ disable });
    }

    public get can_search() {
        return !!this._settings.get('app.explore.search_enabled');
    }

    public readonly use_mapsindoors$ = this._maps.use_mapspeople$;

    constructor(
        private _state: ExploreStateService,
        private _s: ExploreSpacesService,
        private _desks: ExploreDesksService,
        private _zones: ExploreZonesService,
        private _parking: ExploreParkingService,
        private _settings: SettingsService,
        private _org: OrganisationService,
        private _spaces: SpacesService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _router: Router,
        private _space_pipe: SpacePipe,
        private _maps: InjectMapApiService
    ) {
        super();
    }

    public async ngOnInit() {
        await this._spaces.initialised.pipe(first((_) => _)).toPromise();
        this._desks.setOptions({ custom: true });
        this.reset_delay =
            this._settings.get('app.inactivity_timeout_secs') || 180;
        this.resetKiosk();
        VirtualKeyboardComponent.enabled =
            localStorage.getItem('OSK.enabled') === 'true';
        this.subscription(
            'level',
            this._state.level.subscribe(() =>
                this.timeout('update_location', () => {
                    this._state.setFeatures('_located', []);
                })
            )
        );
        this.subscription(
            'route.query',
            this._route.queryParamMap.subscribe(async (params) => {
                if (params.has('level')) {
                    this._state.setLevel(params.get('level'));
                }
                this._state.setFeatures('_located', []);
                if (params.has('space')) {
                    this.locateSpace(params.get('space'));
                } else if (params.has('user')) {
                    let user = this._settings.value('last_search');
                    if (!user || params.get('user') !== user.email) {
                        user = null;
                        user = await showStaff(params.get('user')).toPromise();
                    }
                    if (!user)
                        return notifyError(
                            `Unable to user details for ${params.get('user')}`
                        );
                    this.locateUser(
                        user instanceof Array ? user[0] : user
                    ).catch((_) => {
                        notifyError(`Unable to locate ${params.get('user')}`);
                        this._router.navigate([], {
                            relativeTo: this._route,
                            queryParams: {},
                        });
                    });
                } else if (params.has('feature')) {
                    this.timeout('update_location', () => {
                        this._state.setFeatures('_located', [
                            {
                                location: params.get('feature'),
                                content: MapPinComponent,
                                data: {},
                            },
                        ]);
                    });
                } else {
                    this.timeout('update_location', () => {
                        this._state.setFeatures('_located', []);
                    });
                }
            })
        );
    }

    private async locateSpace(id: string) {
        const space = await this._space_pipe.transform(id);
        if (!space) return;
        this._state.setLevel(this._org.levelWithID(space.zones)?.id);
        const feature: any = {
            location: space.map_id,
            content: MapPinComponent,
            data: {
                message: `${space.display_name || space.name} is here`,
            },
        };
        this.timeout('update_location', () =>
            this._state.setFeatures('_located', [feature])
        );
    }

    private async locateUser(user: User) {
        let locate_details: any = this._org.binding('location_services');
        if (!locate_details) return;
        if (typeof locate_details === 'string') {
            locate_details = {
                system_id: locate_details,
                module: 'LocationServices',
            };
        }
        const mod = getModule(locate_details.system_id, locate_details.module);
        const locations: MapLocation[] = (
            await mod.execute('locate_user', [
                user.email,
                user.username || user.id,
            ])
        ).map((i) => new MapLocation(i));
        locations.sort(
            (a, b) =>
                locate_details.priority.indexOf(a.type) -
                locate_details.priority.indexOf(b.type)
        );
        if (!locations?.length) {
            throw 'No locations for the given user';
        }
        this._state.setLevel(this._org.levelWithID([locations[0]?.level])?.id);
        const pos: any = locations[0].position;
        const { coordinates_from } = locations[0];
        const feature: any = {
            location:
                locations[0].type === 'wireless'
                    ? {
                          x: coordinates_from?.includes('right')
                              ? 1 - pos.x
                              : pos.x,
                          y: coordinates_from?.includes('bottom')
                              ? 1 - pos.y
                              : pos.y,
                      }
                    : pos,
            content:
                locations[0].type === 'wireless'
                    ? MapRadiusComponent
                    : MapPinComponent,
            z_index: 99,
            data: {
                message: `${user.name} is here`,
                radius: locations[0].variance,
                last_seen: locations[0].last_seen,
            },
        };
        this.timeout('update_location', () => {
            this._state.setFeatures('_located', [feature]);
        });
    }

    public resetKiosk() {
        if ((document.activeElement as any)?.blur)
            (document.activeElement as any)?.blur();
        const level = localStorage.getItem('KIOSK.level');
        this._state.setPositions(1, { x: 0.5, y: 0.5 });
        if (level) this._state.setLevel(level);
        this._dialog.closeAll();
    }
}
