import { Component } from '@angular/core';
import { ApplicationLink, SettingsService } from '@placeos/common';
import { OrganisationService } from '@placeos/organisation';

@Component({
    selector: 'footer-menu',
    template: `
        <div
            class="fixed flex flex-col items-center justify-end z-20 inset-0 bg-black/75 text-white px-2 pb-24 pt-2 space-y-4"
            *ngIf="show_book_items"
            (click)="show_book_items = false"
        >
            <a
                matRipple
                *ngFor="let item of book_items"
                [routerLink]="item.route"
                class="flex items-center space-x-4 text-base w-48"
            >
                <div
                    class="bg-white rounded-full h-12 w-12 text-black text-2xl flex items-center justify-center"
                >
                    <app-icon [icon]="item.icon"></app-icon>
                </div>
                <div>{{ item.name }}</div>
            </a>
        </div>
        <div
            class="flex items-center justify-center bg-white border-t border-gray-200 shadow relative h-16 w-full sm:hidden z-40"
        >
            <a
                matRipple
                class="flex flex-col items-center justify-center relative flex-1"
                [routerLink]="['/dashboard']"
                routerLinkActive="text-primary"
            >
                <app-icon class="text-2xl">home</app-icon>
                <span class="text-sm">Home</span>
            </a>
            <button
                matRipple
                class="flex items-center justify-center w-12 h-12 mb-4 rounded-full z-10"
                (click)="show_book_items = !show_book_items"
                [class.bg-secondary]="show_book_items"
                [class.text-white]="show_book_items"
                [class.bg-gray-300]="!show_book_items"
            >
                <app-icon class="text-2xl">{{
                    show_book_items ? 'close' : 'add'
                }}</app-icon>
            </button>
            <button
                matRipple
                class="flex flex-col items-center justify-center relative flex-1"
                [matMenuTriggerFor]="building_menu"
                *ngIf="(buildings | async)?.length > 1"
            >
                <app-icon class="text-2xl">business</app-icon>
                <span class="text-sm">Building</span>
            </button>
            <div
                class="overflow-hidden absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-24 h-2"
            >
                <div
                    class="w-16 h-16 rounded-full bg-white shadow mx-auto border-t border-gray-200"
                ></div>
            </div>
        </div>
        <mat-menu #building_menu="matMenu">
            <button
                mat-menu-item
                *ngFor="let item of buildings | async"
                (click)="setBuilding(item)"
                class="flex items-center space-x-2 text-base"
                [class.text-primary]="(building | async).id === item.id"
            >
                {{ item.name }}
            </button>
        </mat-menu>
    `,
    styles: [``],
})
export class FooterMenuComponent {
    public show_book_items = false;
    public readonly buildings = this._org.building_list;
    public readonly building = this._org.active_building;

    public get menu_items(): ApplicationLink[] {
        return this._settings.get('app.general.menu') || [];
    }

    public get book_items() {
        return this.menu_items.filter((_: any) => _.type === 'book');
    }

    public readonly setBuilding = (b) => (this._org.building = b);

    constructor(
        private _settings: SettingsService,
        private _org: OrganisationService
    ) {}
}
