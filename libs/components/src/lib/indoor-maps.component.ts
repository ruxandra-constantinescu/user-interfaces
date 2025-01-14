import {
    Component,
    ViewChild,
    ElementRef,
    OnInit,
    Input,
    SimpleChanges,
} from '@angular/core';
import {
    AsyncHandler,
    HashMap,
    InjectMapApiService,
    log,
    notifyError,
} from '@placeos/common';
import { ViewerStyles, ViewAction } from '@placeos/svg-viewer';
import { ExploreStateService } from '../../../explore/src/lib/explore-state.service';
import { Building, OrganisationService } from '@placeos/organisation';
import { combineLatest } from 'rxjs';
import { filter, map, first, take } from 'rxjs/operators';
import { MapService } from 'libs/common/src/lib/inject-map-api.service';

declare let mapsindoors: any;
declare let google: any;
declare let mapboxgl: any;

interface GeolocationCoordinates {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
}

interface GeolocationPosition {
    coords: GeolocationCoordinates;
    timestamp: number;
}

interface CustomCoordinates {
    latitude: number;
    longitude: number;
}

@Component({
    selector: 'indoor-maps',
    template: `
        <div
            id="maps-indoors"
            class="absolute inset-0 flex items-center justify-center"
        >
            <mat-spinner
                *ngIf="loading"
                class="absolute"
                [diameter]="48"
            ></mat-spinner>
            <div
                *ngIf="geolocation_error_message"
                class="flex flex-col items-center z-50"
            >
                <img
                    src="assets/icons/not-found.svg"
                    alt="graphic of magnifying glass"
                    width="200px"
                    class="items-center"
                />
                <p class="opacity-60 text-sm text-center mt-10">
                    {{ geolocation_error_message | translate }}
                </p>
            </div>
        </div>
        <div
            class="absolute flex flex-col h-min w-min top-2 left-2 bg-base-100 text-base-content rounded-lg z-50 p-2 shadow"
        >
            <mat-form-field appearance="outline" class="map no-subscript">
                <input
                    matInput
                    #searchInput
                    name="location-search"
                    type="text"
                    placeholder="Search"
                    (keyup.enter)="onSearch()"
                />
                <div matSuffix class="h-10 relative">
                    <button
                        icon
                        name="indoor-map-search"
                        matRipple
                        class="hover:bg-base-200"
                        aria-label="search button"
                        matTooltip="Search..."
                        (click)="onSearch()"
                    >
                        <app-icon matPrefix class="text-2xl relative">
                            search
                        </app-icon>
                    </button>
                </div>
            </mat-form-field>

            <ng-container *ngIf="search_result_items?.length">
                <div
                    class="flex items-center justify-between px-2 my-2 space-x-2"
                >
                    <h3 class="font-medium text-lg">
                        Results ({{ search_result_items.length || '0' }})
                    </h3>
                    <button
                        icon
                        matRipple
                        class="hover:bg-base-200"
                        (click)="search_result_items = []"
                        matTooltip="Clear Results"
                    >
                        <app-icon>close</app-icon>
                    </button>
                </div>
                <ul
                    class="list-none m-0 p-0 w-full space-y-2 max-h-[65vh] overflow-auto"
                >
                    <li
                        class="flex items-center w-full even:bg-base-200 hover:bg-base-300 rounded p-2 space-x-2"
                        *ngFor="let item of search_result_items | slice: 0:10"
                    >
                        <div class="flex-1">
                            {{ item.properties.name }}
                        </div>
                        <button
                            icon
                            name="get-directions"
                            matRipple
                            aria-label="get directions button"
                            (click)="getRoute(item)"
                            class="flex text-white h-7 w-7 rounded-md bg-secondary"
                        >
                            <app-icon class="text-sm">near_me</app-icon>
                        </button>
                    </li>
                </ul>
            </ng-container>
        </div>
    `,
    styles: [
        `
            :host {
                height: 100%;
                width: 100%;
            }

            mat-spinner {
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
        `,
    ],
})
export class IndoorMapsComponent extends AsyncHandler implements OnInit {
    public view_instance: any;
    public maps_service: any;
    public map_instance: any;
    public directions_service: any;
    public directions_renderer: any;

    public live_data_status: string | boolean = 'enabled';
    public search_result_items: any[];
    public selected_destination: any = null;

    public loading: boolean;
    public actions_hashmap: { [id: string]: ViewAction };

    public user_latitude: number | null = null;
    public user_longitude: number | null = null;
    public geolocation_error_message: string = '';
    public route_error_message: string = '';
    public coordinates: CustomCoordinates | null = null;

    public readonly buildings = this._org.building_list;
    public readonly building = this._org.active_building;
    public readonly setBuilding = (b) => (this._org.building = b);

    public readonly levels = combineLatest([
        this.building,
        this._state.options,
    ]).pipe(
        filter(([_]) => !!_),
        map(([bld]) => [
            {
                id: this._org.building.id,
                name: 'All Levels',
            },
            ...this._org.levelsForBuilding(bld),
        ])
    );
    public levels_list: any[] = [];
    public buildings_list: Building[] = [];
    public floor_mapping: { [id: string]: string } = {};

    /** Custom CSS styles to apply to the map */
    @Input() public styles: ViewerStyles;
    /** List of available user actions for the map */
    @Input() public actions: ViewAction[];
    /** Custom coordinates to fixate on the map */
    @Input() public custom_coordinates: CustomCoordinates;

    @ViewChild('searchInput', { static: true }) searchElement: ElementRef;
    @ViewChild('searchResultItems') searchResults: ElementRef;

    constructor(
        private _api_service: InjectMapApiService,
        private _state: ExploreStateService,
        private _org: OrganisationService
    ) {
        super();
    }

    async ngOnInit() {
        this.loading = true;
        await this._org.initialised.pipe(first((_) => !!_)).toPromise();
        this.setBuilding(this._org.building);
        this.levels_list = this._org.levels;
        this.buildings_list = this._org.buildings;
        if (this.custom_coordinates) this.coordinates = this.custom_coordinates;
        await this._getUserLocation();
        await this.initMapView();
    }

    async ngOnChanges(change: SimpleChanges) {
        if (change.styles || change.actions) {
            await this.renderSpaceStatus();
            await this.mapActions();
        }
        this.mapFloorsToIndex();
        this.loading = false;
    }

    ngAfterViewInit() {
        this.maps_service?.addListener('click', (location: any, e: Event) => {
            const found_action = this.actions_hashmap[location.id];
            if (found_action) found_action.callback(e);
        });
    }

    initMapView(): Promise<void> {
        if (!this._api_service.is_ready) {
            this.timeout('init', () => this.initMapView(), 1000);
            return;
        }
        const view_options: any = {
            element: document.getElementById('maps-indoors'),
            center: { lat: this.user_latitude, lng: this.user_longitude },
            zoom: 21,
            maxZoom: 24,
        };

        if (this._api_service.map_service === MapService.GoogleMaps) {
            log(
                'MapsIndoors',
                'Google Maps API Key:',
                this._api_service.map_keys.google
            );
            this.view_instance = new mapsindoors.mapView.GoogleMapsView(
                view_options
            );
        } else {
            view_options.accessToken = this._api_service.map_token;
            log(
                'MapsIndoors',
                'Mapbox Access Token:',
                view_options.accessToken
            );
            this.view_instance = new mapsindoors.mapView.MapboxView(
                view_options
            );
        }
        if (!this.view_instance) {
            log(
                'MapsIndoors',
                'Failed to initialise map view instance.',
                undefined,
                'warn'
            );
            return;
        }
        this.maps_service = new mapsindoors.MapsIndoors({
            mapView: this.view_instance,
        });
        this.map_instance = this.view_instance.getMap();
        this.initDirections();
        this.handleLocationChange();
    }

    public initDirections() {
        const provider =
            this._api_service.map_service === MapService.GoogleMaps
                ? new mapsindoors.directions.GoogleMapsProvider()
                : new mapsindoors.directions.MapboxProvider();
        this.directions_service = new mapsindoors.services.DirectionsService(
            provider
        );
        console.log('Directions Service:', this.directions_service, provider);
        const directionsRendererOptions = {
            mapsIndoors: this.maps_service,
        };
        this.directions_renderer =
            new mapsindoors.directions.DirectionsRenderer(
                directionsRendererOptions
            );
    }

    public async mapFloorsToIndex() {
        const building = await this.maps_service?.getBuilding();
        const input_string =
            building?.buildingInfo?.fields?.floorMapping?.value;
        const pairs = input_string?.split(',\n').map((pair) => pair.split(':'));
        this.floor_mapping = pairs?.reduce((accumulator, [key, value]) => {
            accumulator[key] = value;
            return accumulator;
        }, {});
        const floor_index: string = await this.maps_service?.getFloor();
        if (floor_index && this.floor_mapping) {
            const level_id = this.floor_mapping[floor_index];
            this._state.setLevel(level_id);
        }
    }

    public handleLocationChange() {
        const floorSelectorElement = document.createElement('div');
        new mapsindoors.FloorSelector(floorSelectorElement, this.maps_service);
        if (this._api_service.map_service === MapService.GoogleMaps) {
            this.map_instance.controls[
                google.maps.ControlPosition.RIGHT_TOP
            ].push(floorSelectorElement);
        } else {
            const instance = this.view_instance.getMap();
            instance.addControl({
                onAdd: () => floorSelectorElement,
                onRemove: () => {},
            });
        }

        this.maps_service?.addListener('building_changed', (e: any) => {
            const found_building = this.buildings_list.find((building) => {
                building.name.toLowerCase() ===
                    e.buildingInfo?.name.toLowerCase();
                this.setBuilding(found_building);
            });
        });
        this.maps_service?.addListener('floor_changed', (e: string) => {
            if (!e || !this.floor_mapping) return;
            const level_id: string = this.floor_mapping[e];
            this._state.setLevel(level_id);
        });
    }

    public onSearch() {
        const searchParams = { q: this.searchElement.nativeElement.value };
        mapsindoors?.services.LocationsService.getLocations(searchParams).then(
            (locations: any[]) => (this.search_result_items = locations)
        );
    }

    private async _getUserLocation(): Promise<GeolocationPosition> {
        if (!('geolocation' in navigator)) return this._setLocationToBuilding();
        if (this.coordinates) {
            console.log('Custom GeoLocation:', this.coordinates);
            const customPosition = {
                coords: {
                    latitude: this.coordinates.latitude,
                    longitude: this.coordinates.longitude,
                    accuracy: 10,
                },
                timestamp: new Date().getTime(),
            };
            this.user_latitude = this.coordinates.latitude;
            this.user_longitude = this.coordinates.longitude;

            return customPosition as GeolocationPosition;
        } else {
            navigator.geolocation.watchPosition(
                (_) => this._updateGeolocation(_),
                (_) => this._handleGeolocationError(_)
            );
            return new Promise<GeolocationPosition>((resolve) => {
                const options = { timeout: 10000, enableHighAccuracy: true };
                navigator.geolocation.getCurrentPosition(
                    (position: GeolocationPosition) => {
                        this._updateGeolocation(position);
                        resolve(position);
                    },
                    () => resolve(this._setLocationToBuilding()),
                    options
                );
            });
        }
    }

    private _setLocationToBuilding() {
        const [lat, long] = this._org.building?.location.split(',');
        this.user_latitude = parseFloat(lat);
        this.user_longitude = parseFloat(long);
        return {
            coords: {
                latitude: this.user_latitude,
                longitude: this.user_longitude,
                accuracy: 10,
            },
            timestamp: new Date().getTime(),
        } as GeolocationPosition;
    }

    private _updateGeolocation(updated_location: GeolocationPosition) {
        if (!updated_location) return;
        if (
            updated_location.coords?.latitude !== this.user_latitude ||
            updated_location.coords?.longitude !== this.user_longitude
        ) {
            this.user_latitude = updated_location.coords?.latitude;
            this.user_longitude = updated_location.coords?.longitude;
            this.getRoute(this.selected_destination);
        }
    }

    private _handleGeolocationError(error: any) {
        notifyError('Error updating your geolocation.');
    }

    public async getRoute(location: any) {
        if (!this.directions_service) return;
        this.selected_destination = location;
        if (!this.user_latitude || !this.user_longitude) {
            return notifyError('Error: unable to find a route.');
        }
        const origin: any = {
            lat: this.user_latitude,
            lng: this.user_longitude,
        };
        console.log('Origin: ', origin, 'Destination: ', location);

        const destination = {
            lat: location.properties.anchor.coordinates[1],
            lng: location.properties.anchor.coordinates[0],
            floor: location.properties.floor,
        };

        const routeParameters = {
            origin: origin,
            destination: destination,
            travelMode: 'WALKING',
        };

        const result = await this.directions_service
            .getRoute(routeParameters)
            .catch((e) => {
                console.error('Error fetching route: ', e);
                const origin_error =
                    e instanceof TypeError && e.message?.includes('origin');
                if (!origin_error) throw e;
                notifyError('Error: Origin location is outside of map area.');
                throw e;
            });
        this.directions_renderer?.setDirections(result);
    }

    async renderSpaceStatus(): Promise<void[]> {
        if (!this.styles) return;
        const promises: Promise<void>[] = [];
        for (const key in this.styles) {
            const colour = this.styles[key]['fill'] as string;
            if (key) {
                const updated_key = key.substring(1);
                promises.push(this._setPolygonFill(updated_key, colour));
            }
        }
        return await Promise.all(promises);
    }

    public async mapActions() {
        return this.actions?.reduce((accumulator, currentValue) => {
            accumulator[currentValue.id] = currentValue;
            return accumulator;
        }, {});
    }

    private _setPolygonFill(location_id: string, colour: string) {
        return this.maps_service?.setDisplayRule(location_id, {
            polygonVisible: true,
            polygonFillOpacity: 0.6,
            polygonZoomFrom: 16,
            polygonZoomTo: 22,
            visible: true,
            polygonFillColor: colour,
        });
    }
}
