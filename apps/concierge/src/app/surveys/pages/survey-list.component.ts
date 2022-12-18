import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription, Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SurveyCreatorService } from '../services/survey-creator.service';
import { BuildingsService } from '../services/buildings.service';
import { ConfirmDeleteModalComponent } from '../components/confirm-delete-modal.component';

@Component({
    selector: 'survey-list',
    template: `
        <sidebar></sidebar>
        <main
            class="relative w-full h-full bg-white dark:bg-neutral-600 overflow-y-auto"
        >
            <section
                class="flex flex-col bg-white w-full max-w-[68rem] m-auto "
            >
                <header
                    class="flex items-center justify-between py-4 pt-8 mb-4 w-full"
                >
                    <div class="flex items-center">
                        <span
                            ><mat-icon class="flex mr-2" (click)="back()"
                                >arrow_back</mat-icon
                            ></span
                        >
                        <span class="text-2xl">{{ selected_building }}</span>
                    </div>

                    <div class="flex items-center space-x-4">
                        <div class="flex h-[3.25rem]">
                            <mat-form-field
                                appearance="outline"
                                class="dropdown"
                            >
                                <mat-select
                                    [(value)]="selected_level"
                                    (selectionChange)="updateListView()"
                                >
                                    <mat-option
                                        *ngFor="let level of building_levels"
                                        [value]="level.level"
                                    >
                                        {{ level.display }}</mat-option
                                    >
                                </mat-select>
                            </mat-form-field>
                        </div>

                        <button mat-button (click)="navigate()">
                            <span> Add New Survey</span>
                            <mat-icon>add</mat-icon>
                        </button>
                    </div>
                </header>
                <main class="flex flex-col w-full">
                    <div class="table-container ">
                        <div class="loading" *ngIf="isLoading">
                            <mat-spinner *ngIf="isLoading"></mat-spinner>
                        </div>
                    </div>

                    <ng-container
                        [ngTemplateOutlet]="
                            dataSource.data.length ? tableContent : none
                        "
                    >
                        <ng-template #tableContent>
                            <table
                                mat-table
                                [dataSource]="dataSource"
                                class="border"
                            >
                                <ng-container
                                    *ngFor="let column of columns"
                                    [matColumnDef]="column.columnDef"
                                >
                                    <th
                                        class="text-sm font-normal"
                                        mat-header-cell
                                        *matHeaderCellDef
                                        (click)="sortByHeader(column.header)"
                                    >
                                        <div
                                            class="flex items-center space-x-2"
                                        >
                                            <span>
                                                {{ column.header }}
                                            </span>
                                            <span
                                                class="mt-2"
                                                *ngIf="
                                                    column.header != 'Link' &&
                                                    column.header != 'Options'
                                                "
                                            >
                                                <mat-icon
                                                    [ngClass]="{
                                                        'rotate-180 mb-2':
                                                            !column.ascending
                                                    }"
                                                    >filter_list</mat-icon
                                                >
                                            </span>
                                        </div>
                                    </th>
                                    <td
                                        class="py-4"
                                        mat-cell
                                        *matCellDef="let row"
                                        [ngSwitch]="column.columnDef"
                                    >
                                        <div *ngSwitchCase="'link'">
                                            <a class="text-blue-700" [routerLink]="['/surveys','complete',column.cell(row)]">{{column.cell(row)}}</a>
                                        </div>
                                        <div *ngSwitchCase="'options'">
                                            <ng-container *ngIf="column.cell(row) == 'open'; else notOpen;">
                                                <button
                                                    mat-icon-button
                                                    [matMenuTriggerFor]="
                                                        optionsMenu
                                                    "
                                                    aria-label="button to see more options"
                                                    class=""
                                                >
                                                    <mat-icon
                                                        class="flex justify-center"
                                                        >more_horiz</mat-icon
                                                    >
                                                </button>
                                                <mat-menu #optionsMenu="matMenu">
                                                    <div
                                                        class="flex flex-col min-w-[10rem]"
                                                    >
                                                        <button
                                                            mat-menu-item
                                                            (click)="
                                                                viewSurvey(row)
                                                            "
                                                        >
                                                            <mat-icon
                                                                >visibility</mat-icon
                                                            >
                                                            <span>View</span>
                                                        </button>
                                                        <button
                                                            mat-menu-item
                                                            (click)="
                                                                editSurvey(row)
                                                            "
                                                        >
                                                            <mat-icon
                                                                >edit</mat-icon
                                                            >
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            mat-menu-item
                                                            (click)="
                                                                deleteSurvey(row)
                                                            "
                                                        >
                                                            <mat-icon
                                                                >delete_forever</mat-icon
                                                            >
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </mat-menu>
                                            </ng-container>
                                            <ng-template #notOpen>
                                                {{column.cell(row)}}
                                            </ng-template>
                                        </div>
                                        <span *ngSwitchDefault>{{column.cell(row)}}</span>
                                    </td>
                                </ng-container>

                                <tr
                                    mat-header-row
                                    *matHeaderRowDef="displayedColumns"
                                    class="header-row"
                                ></tr>
                                <tr
                                    mat-row
                                    *matRowDef="
                                        let row;
                                        columns: displayedColumns
                                    "
                                    class="font-normal text-base"
                                ></tr>
                            </table>
                        </ng-template>
                        <ng-template #none>
                            <div
                                class="flex flex-col text-gray-700 justify-center items-center min-h-[20rem]"
                            >
                                <span>No saved surveys for this building</span>
                            </div>
                        </ng-template>
                    </ng-container>
                </main>
            </section>
        </main>
    `,
    styles: [
        `
            :host {
                display: flex;
                height: 100%;
                width: 100%;
            }
            /* .page-wrapper {
                background-color: #fff;
                padding: 10px;
            }
            .heading-wrapper {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 20px 0px 0px 20px;
                width: 90%;
            }
            .left-wrapper {
                display: flex;
                align-items: center;
            }
            .right-wrapper {
                display: flex;
                align-items: center;
            }
            .back-arrow {
                display: flex;
                margin-right: 10px;
            }
            .page-heading {
                line-height: 34px;
                font-size: 26px;
                font-weight: 400;
            }
             .dropdown-container {
                display: flex;
                height: 53px;
            }
            .add-button {
                display: flex;
                color: #fff;
                background-color: #292f5b;
                border-radius: 2px;
                margin: 20px 0px 20px 20px;
                padding: 0px 20px;
            }
            .table {
                width: 90%;
                margin: 20px;
                border: 1px solid rgba(0, 0, 0, 0.12);
            }
            .rows {
                height: 95px;
                font-size: 16px;
                line-height: 20px;
                font-weight: 400;
            } */
            .header-row {
                background-color: #e0e0e0;
                /* font-size: 16px;
                line-height: 20px;
                font-weight: 400; */
            }
            /* .columns {
                background-color: red;
            }
             .menu-wrapper {
                display: flex;
                flex-direction: column;
                height: 140px;
                width: 135px;
            }
            .options-button {
                display: flex;
                background-color: #fff;
                border: none;
                align-items: center;
                justify-content: center;
                height: 40px;
                width: 40px;
            }
            .ellipse {
                display: flex;
                font-size: 20px;
                align-items: center;
                justify-content: center;
            }
             .header-wrapper {
                display: flex;
                justify-content: left;
                align-items: center;
                height: 30px;
            }
            .header-wrapper span:nth-of-type(2) {
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                margin: 7px 0px 0px 5px;
            }
            .descending-icon {
                transform: rotate(180deg);
                margin-bottom: 12px;
            }
            .none-selected {
                display: flex;
                flex-direction: column;
                color: #808080;
                width: 300px;
                height: 200px;
                text-align: center;
                margin: 200px auto;
            } */
        `,
    ],
})
export class SurveyListComponent implements OnInit {
    selected_building: string = '';

    building_levels: any[];
    selected_level: string = '';

    columns = [
        {
            columnDef: 'building_name',
            header: 'Building',
            cell: (element) => `${element.building_name}`,
            ascending: null,
        },
        {
            columnDef: 'level',
            header: 'Level',
            cell: (element) => `${element.level}`,
            ascending: null,
        },
        {
            columnDef: 'type',
            header: 'Type',
            cell: (element) => `${element.type}`,
            ascending: null,
        },
        {
            columnDef: 'title',
            header: 'Title',
            cell: (element) => `${element.title}`,
            ascending: null,
        },
        {
            columnDef: 'date',
            header: 'Date',
            cell: (element) => `${element.date}`,
            ascending: null,
        },
        {
            columnDef: 'link',
            header: 'Link',
            cell: (element) => `${element.link}`,
        },
        {
            columnDef: 'options',
            header: 'Options',
            cell: (element) => `${element.options}`,
        },
    ];

    isLoading = false; //refactor to read from service
    displayedColumns: string[] = this.columns.map((item) => item.columnDef);
    ascending: boolean;

    saved_surveys$: Observable<any[]> =
        this.surveyCreatorService.saved_surveys$;
    saved_surveys: any[];
    dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();

    dataSubscription: Subscription = new Subscription();
    buildingSubscription: Subscription = new Subscription();
    paramsSubscription: Subscription = new Subscription();

    constructor(
        private location: Location,
        private route: ActivatedRoute,
        public router: Router,

        public dialog: MatDialog,
        public surveyCreatorService: SurveyCreatorService,
        public buildingsService: BuildingsService
    ) {}

    ngOnInit(): void {
        this._getParams();
        this.saved_surveys$ = this.surveyCreatorService.saved_surveys$;
        this.saved_surveys$.subscribe(
            (surveys) => (this.saved_surveys = surveys)
        );
        this._filterSurveysByBuilding(this.selected_building);
        this.dataSource.data = this.saved_surveys;

        this.building_levels = [
            { display: 'All Levels', level: 'all' },
            ...this.dataSource.data
                .map((item) => ({
                    display: `Level ${item.level}`,
                    level: item.level,
                }))
                .sort(),
        ];
        this.building_levels = [
            ...new Map(
                this.building_levels.map((item) => [item.level, item])
            ).values(),
        ];
        this.selected_level = this.building_levels[0].level;
    }

    sortByHeader(header: string): void {
        this._filterSurveysByBuilding(this.selected_building);
        const found_column: any = this.columns.find(
            (column) => column.header == header
        );
        if (
            found_column.ascending == null ||
            found_column.ascending == undefined
        ) {
            found_column.ascending = false;
        }
        if (!found_column.ascending) {
            this.saved_surveys = this.saved_surveys.sort((a, b) =>
                b[found_column.columnDef]?.localeCompare(
                    a[found_column.columnDef]
                )
            );
            this.dataSource.data = this.saved_surveys;
            found_column.ascending = !found_column.ascending;
        } else {
            this.saved_surveys = this.saved_surveys.sort((a, b) =>
                a[found_column.columnDef]?.localeCompare(
                    b[found_column.columnDef]
                )
            );
            this.dataSource.data = this.saved_surveys;
            found_column.ascending = !found_column.ascending;
        }
    }

    updateListView(): void {
        this._filterSurveysByBuilding(this.selected_building);
        this.dataSource.data = this.saved_surveys;
        const updated_view = this.dataSource.data.filter(
            (item) => item.level == this.selected_level
        );
        if (updated_view.length) {
            this.dataSource.data = updated_view;
        }
    }

    viewSurvey(survey): void {
        // link to view of survey results
        console.log(survey, 'to open');
    }

    editSurvey(survey): void {
        //link to draft survey to be edited
    }

    deleteSurvey(survey) {
        const dialogRef = this.dialog.open(ConfirmDeleteModalComponent, {
            width: '230px',
            height: '170px',
            data: { survey },
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (!result) return;
            console.log(survey.link);
            const found_index = this.saved_surveys.findIndex(
                (item) => item == survey
            );
            this.saved_surveys.splice(found_index, 1);
            this.dataSource.data = this.saved_surveys;
        });
    }

    back(): void {
        this.surveyCreatorService.updateCurrentBuilding('');
        this.router.navigate(['surveys']);
    }

    navigate(): void {
        this.surveyCreatorService.updateCurrentBuilding(this.selected_building);
        this.router.navigate(['surveys', 'create']);
    }

    private _getParams(): void {
        let id: string;
        this.paramsSubscription = this.route.paramMap.subscribe((params) => {
            id = params.get('id') || '';
        });
        if (id) {
            this._findBuilding(id);
        }
    }

    private _findBuilding(building_id: string) {
        let found_building;
        this.buildingSubscription = this.buildingsService.buildings$.subscribe(
            (buildings) => {
                found_building = buildings.find(
                    (item) => item.id == building_id
                );
            }
        );
        this.surveyCreatorService.updateCurrentBuilding(found_building);
        this.selected_building = found_building.display_name;
    }

    private _filterSurveysByBuilding(building_name: string) {
        this.saved_surveys$.subscribe((surveys) => {
            this.saved_surveys = surveys.filter(
                (survey) =>
                    this._removeSpace(survey.building_name) ==
                    this._removeSpace(building_name)
            );
        });
    }

    private _removeSpace(title: string): string {
        return title.replace(/\s+/g, '');
    }

    ngOnDestroy(): void {
        this.buildingSubscription?.unsubscribe();
        this.paramsSubscription?.unsubscribe();
    }
}