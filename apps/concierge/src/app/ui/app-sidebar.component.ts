import { Component } from '@angular/core';
import {
    ANIMATION_SHOW_CONTRACT_EXPAND,
    AsyncHandler,
    SettingsService,
    currentUser,
} from '@placeos/common';
import { OrganisationService } from '@placeos/organisation';

@Component({
    selector: 'app-sidebar',
    template: `
        <div
            class="w-64 h-full border-r border-gray-300 py-2 pr-3 overflow-auto"
        >
            <ng-container *ngFor="let link of filtered_links">
                <ng-container *ngIf="!link.children; else group_view">
                    <a
                        matRipple
                        class="flex items-center space-x-2 rounded-r-full p-1 my-1 hover:bg-black/10 w-full"
                        [routerLink]="link.route"
                        routerLinkActive="active"
                    >
                        <app-icon class="text-2xl opacity-60">{{
                            link.icon
                        }}</app-icon>
                        <span class="font-medium">{{ link.name }}</span>
                    </a>
                </ng-container>
                <ng-template #group_view>
                    <button
                        matRipple
                        *ngIf="link.children?.length"
                        class="flex items-center space-x-2 rounded-r-full p-1 my-1 hover:bg-black/10 w-full"
                        (click)="show_block[link.id] = !show_block[link.id]"
                    >
                        <app-icon class="text-2xl opacity-60">
                            {{ link.icon }}
                        </app-icon>
                        <div class="font-medium flex-1 text-left">
                            {{ link.name }}
                        </div>
                        <app-icon class="text-2xl">arrow_drop_down</app-icon>
                    </button>
                    <section
                        class="overflow-hidden w-full"
                        *ngIf="link.children?.length"
                        [@show]="!show_block[link.id] ? 'show' : 'hide'"
                    >
                        <a
                            class="flex items-center space-x-2 rounded-r-full p-1 my-1 hover:bg-black/10 w-full"
                            *ngFor="let child of link.children"
                            [routerLink]="child.route"
                            routerLinkActive="active"
                        >
                            <app-icon class="text-2xl"></app-icon>
                            <span>{{ child.name }}</span>
                        </a>
                    </section>
                </ng-template>
            </ng-container>
        </div>
    `,
    styles: [
        `
            :host {
                height: 100%;
            }

            a.active {
                background-color: var(--primary);
                color: #fff;
            }

            a.active:hover {
                background-color: var(--primary);
                color: #000;
                opacity: 0.75;
            }
        `,
    ],
    animations: [ANIMATION_SHOW_CONTRACT_EXPAND],
})
export class ApplicationSidebarComponent extends AsyncHandler {
    public show_block: Record<string, boolean> = {};
    public readonly links = [
        {
            name: 'Bookings',
            icon: 'add_circle',
            children: [
                {
                    id: 'spaces',
                    name: 'Rooms',
                    route: ['/book/rooms'],
                },
                {
                    id: 'desks',
                    name: 'Desks',
                    route: ['/book/desks/events'],
                },
                {
                    id: 'parking',
                    name: 'Parking',
                    route: ['/book/parking/events'],
                },
                {
                    id: 'lockers',
                    name: 'Lockers',
                    route: ['/book/lockers'],
                },
                {
                    id: 'assets',
                    name: 'Assets',
                    route: ['/book/assets/list/requests'],
                },
                {
                    id: 'catering',
                    name: 'Catering',
                    route: ['/book/catering/orders'],
                },
            ],
        },
        {
            name: 'Visitor Management',
            icon: 'badge',
            children: [
                {
                    id: 'visitors',
                    name: 'Visitor List',
                    route: ['/book/visitors'],
                },
                {
                    id: 'visitor-rules',
                    name: 'External',
                    route: ['/book/visitors/rules'],
                },
            ],
        },
        {
            id: 'facilities',
            name: 'Facilities',
            icon: 'place',
            children: [
                {
                    id: 'facilities',
                    name: 'Building Map',
                    route: ['/facilities'],
                },
                {
                    id: 'spaces',
                    name: 'Rooms',
                    route: ['/room-management'],
                },
                {
                    id: 'desks',
                    name: 'Desks',
                    route: ['/book/desks/manage'],
                },
                {
                    id: 'parking',
                    name: 'Parking',
                    route: ['/book/parking/manage'],
                },
                {
                    id: 'catering',
                    name: 'Catering Menu',
                    route: ['/book/catering/menu'],
                },
            ],
        },
        {
            id: 'assets',
            name: 'Asset Manager',
            route: ['/book/assets/list/items'],
            icon: 'vibration',
        },
        {
            id: 'internal-users',
            name: 'User Directory',
            icon: 'assignment_ind',
            route: ['/users/internal'],
        },
        {
            id: 'events',
            name: 'Events',
            route: ['/entertainment/events'],
            icon: 'confirmation_number',
        },
        {
            id: 'surveys',
            name: 'Surveys',
            route: ['/surveys'],
            icon: 'add_reaction',
        },
        {
            name: 'Reports',
            icon: 'analytics',
            children: [
                {
                    id: 'booking-report',
                    name: 'Bookings',
                    route: ['/reports/bookings'],
                },
                {
                    id: 'contact-tracing-report',
                    name: 'Contact Tracing',
                    route: ['/reports/contact-tracing'],
                },
            ],
        },
    ];

    public filtered_links = [];

    constructor(
        private _settings: SettingsService,
        private _org: OrganisationService
    ) {
        super();
    }

    public ngOnInit() {
        this.updateFilteredLinks();
        this.subscription(
            'building',
            this._org.active_building.subscribe(() =>
                this.updateFilteredLinks()
            )
        );
    }

    public updateFilteredLinks() {
        const features = this._settings.get('app.features') || [];
        const custom_reports = this._settings.get('app.custom_reports') || [];
        const admin_group = this._settings.get('app.admin_group') || [];
        this.filtered_links = this.links
            .map((link) => ({
                ...link,
                children: link.children
                    ? link.children.filter((_) => features.includes(_.id))
                    : null,
            }))
            .filter(
                (_) =>
                    ((!_.id || _.id === 'home' || features.includes(_.id)) &&
                        _.route) ||
                    _.children?.length
            );
        if (this.filtered_links.find((_) => _.id === 'home')) {
            const link = this.filtered_links.find((_) => _.id === 'home');
            link.route = this._settings.get('app.default_route') || ['/'];
        }
        if (!currentUser().groups.includes(admin_group)) {
            this.filtered_links = this.filtered_links.filter(
                (_) => _.id !== 'facilities'
            );
        }
        if (
            custom_reports.length &&
            this.filtered_links.find((_) => _.id === 'reports')
        ) {
            const reports = this.filtered_links.find((_) => _.id === 'reports');
            reports.children = reports.children.concat(custom_reports);
        }
    }
}