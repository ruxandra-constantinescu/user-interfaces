import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { notifyError } from './notifications';
import { OrganisationService } from '@placeos/organisation';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, filter } from 'rxjs/operators';
import { AsyncHandler } from './async-handler.class';

export enum MapService {
    GoogleMaps,
    Mapbox,
}

export interface MapsPeopleKeys {
    mapsindoors?: string;
    google?: string;
    mapbox?: string;
}

@Injectable({
    providedIn: 'root',
})
export class InjectMapApiService extends AsyncHandler {
    private _map_service = new BehaviorSubject<MapService>(null);
    private _map_token = new BehaviorSubject<string>('');
    private _ready = new BehaviorSubject(false);
    private _injected: Record<string, boolean> = {};
    private _custom_zone = new BehaviorSubject<string>('');

    public readonly use_mapspeople$ = combineLatest([
        this._org.active_building,
        this._custom_zone,
        this._org.initialised,
    ]).pipe(
        filter(([_, __, initialised]) => initialised),
        tap(() => this._injectMapsApiKeys()),
        map(
            ([bld, zone]) =>
                this.map_keys.mapsindoors &&
                (this.use_service.includes(zone || bld.id) ||
                    this.use_service.includes('*'))
        )
    );

    public get map_keys(): MapsPeopleKeys {
        return this._settings.get('app.maps_people.keys') || {};
    }

    public get use_service(): string[] {
        return this._settings.get('app.maps_people.use_zones') || [];
    }

    public get map_service(): MapService {
        return this._map_service.getValue();
    }

    public get map_token(): string {
        return this._map_token.getValue();
    }

    public get is_ready(): boolean {
        return this._ready.getValue();
    }

    constructor(
        private _settings: SettingsService,
        private _org: OrganisationService
    ) {
        super();
    }

    public setCustomZone(zone_id: string) {
        this._custom_zone.next(zone_id);
    }

    private _injectMapsApiKeys() {
        this._ready.next(false);
        const { mapsindoors, google, mapbox } = this.map_keys;
        if (!mapsindoors) return;
        if (mapsindoors && !this._injected.mapsindoors) {
            const script = document.createElement('script');
            script.src = `https://app.mapsindoors.com/mapsindoors/js/sdk/4.21.4/mapsindoors-4.21.4.js.gz?apikey=${mapsindoors}`;
            document.body.appendChild(script);
            this._injected.mapsindoors = true;
        }

        if (google && mapbox) {
            notifyError(
                "You can't use both Google and Mapbox maps at the same time"
            );
            return;
        }
        if (google && !this._injected.google) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?libraries=geometry&key=${google}`;
            document.body.appendChild(script);
            this._map_service.next(MapService.GoogleMaps);
            this._injected.google = true;
        } else if (mapbox && !this._injected.mapbox) {
            const script = document.createElement('script');
            script.src = `https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js`;
            document.body.appendChild(script);
            const styles = document.createElement('link');
            styles.rel = 'stylesheet';
            styles.href = `https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css`;
            document.head.appendChild(styles);
            this._map_service.next(MapService.Mapbox);
            this._map_token.next(mapbox);
            this._injected.mapbox = true;
        }

        if (google || mapbox) {
            this.timeout('ready', () => this._ready.next(true), 300);
        }
    }
}
