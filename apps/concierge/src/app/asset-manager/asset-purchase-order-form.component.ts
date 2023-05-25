import { Component } from '@angular/core';
import { AssetManagerStateService } from './asset-manager-state.service';
import {
    generateAssetPurchaseOrderForm,
    saveAssetPurchaseOrder,
    showAssetPurchaseOrder,
} from '@placeos/assets';
import { ActivatedRoute, Router } from '@angular/router';
import { AsyncHandler, notifyError, notifySuccess } from '@placeos/common';
import { addYears, getUnixTime } from 'date-fns';

@Component({
    selector: 'asset-purchase-order-form',
    template: `
        <div class="absolute inset-0 bg-white">
            <div
                class="h-full max-w-[32rem] mx-auto flex flex-col"
                *ngIf="!loading; else load_state"
            >
                <header class="p-4">
                    <h2 class="text-center text-xl font-medium">
                        {{ form.value.id ? 'Edit' : 'Add' }} Purchase Order
                    </h2>
                </header>
                <main class="flex-1 h-1/2 overflow-auto" [formGroup]="form">
                    <div class="flex flex-col space-y-2">
                        <label for="order-number">
                            Order Number<span>*</span>
                        </label>
                        <mat-form-field appearance="outline">
                            <input
                                matInput
                                name="order-number"
                                placeholder="Order Number"
                                formControlName="order_number"
                            />
                            <mat-error>Order number is required</mat-error>
                        </mat-form-field>
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label for="invoice-number">
                            Invoice Number<span>*</span>
                        </label>
                        <mat-form-field appearance="outline">
                            <input
                                matInput
                                name="invoice-number"
                                placeholder="Invoice Number"
                                formControlName="invoice_number"
                            />
                            <mat-error>Invoice number is required</mat-error>
                        </mat-form-field>
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label for="purchase-date">
                            Purchase Date<span>*</span>
                        </label>
                        <a-date-field
                            name="purchase-date"
                            [from]="from"
                            formControlName="purchase_date"
                        ></a-date-field>
                    </div>
                    <div class="flex space-x-2">
                        <div class="flex flex-col space-y-2">
                            <label for="depreciation-start-date">
                                Deprication Start Date
                            </label>
                            <a-date-field
                                name="depreciation-start-date"
                                [from]="from"
                                formControlName="depreciation_start_date"
                            ></a-date-field>
                        </div>
                        <div class="flex flex-col space-y-2">
                            <label for="depreciation-end-date">
                                Deprication End Date
                            </label>
                            <a-date-field
                                name="depreciation-end-date"
                                formControlName="depreciation_end_date"
                            ></a-date-field>
                        </div>
                    </div>
                </main>
                <footer
                    class="flex justify-end space-x-2 p-2 border-t border-gray-100"
                >
                    <a
                        btn
                        matRipple
                        class="w-32 inverse"
                        [routerLink]="
                            product_id
                                ? ['/asset-manager', 'view', product_id]
                                : ['/asset-manager']
                        "
                    >
                        Cancel
                    </a>
                    <button btn matRipple class="w-32" (click)="save()">
                        Save
                    </button>
                </footer>
            </div>
        </div>
        <ng-template #load_state>
            <div
                class="absolute inset-0 flex flex-col items-center justify-center space-y-2"
            >
                <mat-spinner [diameter]="32"></mat-spinner>
                <p>{{ loading }}</p>
            </div>
        </ng-template>
    `,
    styles: [``],
})
export class AssetPurchaseOrderFormComponent extends AsyncHandler {
    public readonly form = generateAssetPurchaseOrderForm();
    public loading: string = '';
    public product_id: string;
    public readonly from = addYears(Date.now(), -5);

    constructor(
        private _state: AssetManagerStateService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        super();
    }

    public ngOnInit() {
        this.subscription(
            'route.query',
            this._route.queryParamMap.subscribe(async (params) => {
                if (params.get('id')) {
                    this.loading = 'Loading purchase order details...';
                    const asset = await showAssetPurchaseOrder(params.get('id'))
                        .toPromise()
                        .catch(() => null);
                    if (!asset) {
                        notifyError('Unable to load purchase order details.');
                        this._router.navigate(['/asset-manager']);
                    }
                    this.form.patchValue(asset);
                    this.loading = '';
                }
                if (params.get('group_id')) {
                    this.product_id = params.get('group_id');
                }
            })
        );
    }

    public async save() {
        if (!this.form.valid) return;
        this.loading = 'Saving Product...';
        const data = this.form.value;
        data.purchase_date = getUnixTime(data.purchase_date);
        data.depreciation_start_date = getUnixTime(data.depreciation_end_date);
        data.depreciation_end_date = getUnixTime(data.depreciation_end_date);
        const item = await saveAssetPurchaseOrder(data as any)
            .toPromise()
            .catch((e) => {
                this.loading = '';
                notifyError(`Error saving purchase order.: ${e.message}`);
                throw e;
            });
        this.form.reset();
        this.loading = '';
        notifySuccess('Successfully saved purchase order.');
        this._router.navigate(['/asset-manager', 'view', this.product_id]);
    }
}
