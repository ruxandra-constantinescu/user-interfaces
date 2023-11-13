import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OrganisationService } from '@placeos/organisation';
import { showMetadata, updateMetadata } from '@placeos/ts-client';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { EmergencyContactModalComponent } from './emergency-contact-modal.component';
import { notify, notifySuccess, openConfirmModal } from '@placeos/common';

export interface EmergencyContact {
    email: string;
    name: string;
    phone: string;
    roles: string[];
}

export interface EmergencyContactData {
    contacts: EmergencyContact[];
    roles: string[];
}

@Component({
    selector: '[app-emergency-contacts]',
    template: `
        <app-topbar></app-topbar>
        <div class="flex flex-1 h-px">
            <app-sidebar></app-sidebar>
            <main class="flex flex-col flex-1 w-1/2 h-full">
                <section topbar class="px-8 py-4 flex flex-col">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-medium">Emergency Contacts</h2>
                        <div class="flex items-center space-x-2">
                            <mat-form-field
                                class="no-subscript"
                                appearance="outline"
                            >
                                <app-icon class="text-2xl" matPrefix>
                                    search
                                </app-icon>
                                <input
                                    matInput
                                    [(ngModel)]="search"
                                    placeholder="Filter contacts..."
                                />
                            </mat-form-field>
                            <button
                                btn
                                matRipple
                                class="space-x-2"
                                (click)="editContact()"
                            >
                                <app-icon class="text-2xl">add</app-icon>
                                <div class="pr-2">Add Contact</div>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center py-2 mt-2">
                        <mat-form-field
                            class="no-subscript"
                            appearance="outline"
                        >
                            <mat-select placeholder="All Roles">
                                <mat-option value="">All Roles</mat-option>
                                <mat-option
                                    *ngFor="
                                        let role of (contacts | async)?.roles ||
                                            []
                                    "
                                    [value]="role"
                                >
                                    {{ role }}
                                </mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                </section>
                <section class="w-full h-1/2 flex-1 overflow-auto px-8">
                    <custom-table
                        class="min-w-[40rem] block"
                        [dataSource]="contacts"
                        [filter]="search"
                        [columns]="['email', 'name', 'roles', 'actions']"
                        [display_column]="['Email', 'Name', 'Roles', ' ']"
                        [column_size]="['flex', '12r', '16r', '7r']"
                        [template]="{
                            roles: roles_template,
                            actions: actions_template
                        }"
                        [empty]="
                            search
                                ? 'No matching contacts'
                                : 'No emergency contacts for this building'
                        "
                    ></custom-table>
                    <ng-template #roles_template let-data="data">
                        <span
                            class="m-1 py-1 px-2 rounded-2xl text-xs font-mono bg-info text-info-content"
                            *ngFor="let role of data"
                        >
                            {{ role }}
                        </span>
                    </ng-template>
                    <ng-template #actions_template let-row="row">
                        <div
                            class="flex items-center justify-end w-full space-x-2"
                        >
                            <button icon matRipple (click)="editContact(row)">
                                <app-icon>edit</app-icon>
                            </button>
                            <button icon matRipple (click)="removeContact(row)">
                                <app-icon>delete</app-icon>
                            </button>
                        </div>
                    </ng-template>
                </section>
            </main>
        </div>
    `,
    styles: [
        `
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background-color: var(--b1);
            }
        `,
    ],
})
export class EmergencyContactsComponent {
    private _change = new BehaviorSubject<number>(0);

    public search = '';
    public readonly data = combineLatest([
        this._org.active_building,
        this._change,
    ]).pipe(
        filter(([bld]) => !!bld),
        switchMap(([bld]) => showMetadata(bld.id, 'emergency_contacts')),
        map(({ details }) => (details as any) || { roles: [], contacts: [] }),
        shareReplay(1)
    );
    public readonly roles = this.data.pipe(map((_) => _?.roles || []));
    public readonly contacts = this.data.pipe(map((_) => _?.contacts || []));

    constructor(
        private _org: OrganisationService,
        private _dialog: MatDialog
    ) {}

    public ngOnInit() {}

    public editContact(contact?: EmergencyContact) {
        const ref = this._dialog.open(EmergencyContactModalComponent, {
            data: contact,
        });
        ref.afterClosed().subscribe(() => this._change.next(Date.now()));
    }

    public async removeContact(contact: EmergencyContact) {
        const result = await openConfirmModal(
            {
                title: 'Remove Emergency Contact',
                content: `Are you sure you want to remove ${contact.name} from the emergency contacts?`,
                icon: { content: 'delete' },
            },
            this._dialog
        );
        if (result.reason !== 'done') return;
        result.loading('Removing contact...');
        const data: any = await this.contacts.pipe(take(1)).toPromise();
        const new_contacts = (data?.contacts || []).filter(
            (_) => _.email.toLowerCase() !== contact.email.toLowerCase()
        );
        await updateMetadata(this._org.building.id, {
            name: 'emergency_contacts',
            description: 'Emergency Contacts',
            details: { roles: data.roles, contacts: new_contacts },
        }).toPromise();
        result.close();
        notifySuccess('Successfully removed emergency contact.');
    }
}