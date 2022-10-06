import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import { SettingsService } from 'libs/common/src/lib/settings.service';
import { MAP_FEATURE_DATA } from 'libs/components/src/lib/interactive-map.component';
import { CalendarEvent } from 'libs/events/src/lib/event.class';
import { Space } from 'libs/spaces/src/lib/space.class';

export interface SpaceInfoData {
    space: Space;
    events: CalendarEvent[];
    status:
        | 'free'
        | 'busy'
        | 'pending'
        | 'reserved'
        | 'not-bookable'
        | 'unknown'
        | '';
}

@Component({
    selector: 'explore-space-info',
    template: `
        <div
            customTooltip
            [content]="space_tooltip"
            [backdrop]="false"
            [xPosition]="'center'"
            [yPosition]="'center'"
            [hover]="true"
            [attr.id]="space?.map_id || space?.id"
            *ngIf="space"
            class="h-full w-full pointer-events-auto relative"
        ></div>
        <ng-template #space_tooltip>
            <div
                name="space-info"
                [id]="space?.id"
                class="
                    absolute rounded bg-white dark:bg-neutral-800 top-0 left-0 transform shadow pointer-events-none overflow-hidden
                "
                [class.-translate-x-full]="x_pos === 'end'"
                [class.-translate-y-full]="y_pos === 'bottom'"
            >
                <div class="arrow"></div>
                <div class="relative">
                    <div
                        class="w-full h-32 overflow-hidden bg-black/20 flex items-center justify-center relative"
                    >
                        <img
                            *ngIf="space.images[0]"
                            [src]="space.images[0]"
                            class="object-cover min-h-full min-w-full"
                        />
                        <div class="absolute inset-0 bg-black/30"></div>
                    </div>
                    <div class="absolute top-2 left-2 flex flex-wrap text-sm ">
                        <div
                            status
                            [class]="
                                'capitalize rounded p-1 px-2 text-light border border-white shadow ' +
                                status
                            "
                        >
                            {{ status }}
                        </div>
                        <div available-until *ngIf="status !== 'not-bookable'">
                            {{ available_until }}
                        </div>
                    </div>
                    <div class="flex flex-col py-4 px-2">
                        <h4 class="font-medium text-xl mb-2 px-2">
                            {{ space.display_name || space.name }}
                        </h4>
                        <div
                            capacity
                            class="text-base px-2 mb-2"
                            *ngIf="space.capacity >= 0"
                        >
                            <span>Capacity: </span>{{ space.capacity }}
                            {{ space.capacity === 1 ? 'person' : 'people' }}
                        </div>
                        <ul
                            class="flex flex-wrap"
                            *ngIf="space.features?.length > 0 && show_features"
                        >
                            <li
                                class="text-xs px-2 py-1 m-1 rounded-2xl bg-gray-200 dark:bg-neutral-600 font-medium"
                                *ngFor="let feature of space.features"
                            >
                                {{ feature }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </ng-template>
    `,
    styles: [
        `
            [name='space-info'] {
                width: 16rem;
            }

            [status] {
                background-color: #43a047;
                font-weight: 500;
            }

            [status].busy {
                background-color: #e53935;
            }

            [status].pending {
                background-color: #ffb300;
            }

            [status].not-bookable {
                background-color: #757575;
            }
        `,
    ],
})
export class ExploreSpaceInfoComponent implements OnInit {
    /** Space to display details for */
    public readonly space = this._details.space;
    /** List of upcoming events for space */
    public readonly events = this._details.events;
    /** Current status of the space */
    public readonly status = this._details.status;

    public y_pos: 'top' | 'bottom';

    public x_pos: 'start' | 'end';

    public get show_features() {
        return !this._settings.get('app.spaces.hide_features');
    }

    constructor(
        @Inject(MAP_FEATURE_DATA) private _details: SpaceInfoData,
        private _settings: SettingsService,
        private _element: ElementRef<HTMLElement>
    ) {}

    public ngOnInit(tries: number = 0) {
        if (tries > 10) return;
        setTimeout(() => {
            const parent =
                this._element.nativeElement.parentElement?.parentElement;
            if (!parent) return this.ngOnInit(++tries);
            const position = {
                y: parseInt(parent.style.top, 10) / 100,
                x: parseInt(parent.style.left, 10) / 100,
            };
            this.y_pos = position.y >= 0.5 ? 'bottom' : 'top';
            this.x_pos = position.x >= 0.5 ? 'end' : 'start';
        }, 200);
    }

    public get available_until() {
        return '';
    }
}
