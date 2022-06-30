
export interface AssetResource {
    id?: string;
    name: string,
    url: string;
    price?: number;
}

export interface AssetDetail {
    id: string;
    name: string;
}

export interface AssetPurchase {
    id?: string;
    name: string;
    value: string;
}

export class Asset {
    public readonly id: string;
    public readonly name: string;
    public readonly category: string;
    public readonly images: AssetResource[];
    public readonly barcode: string;
    public readonly brand: string;
    public readonly size: 'Small' | 'Medium' | 'Large';
    public readonly description: string;
    public readonly specifications: Record<string, string>;
    public readonly purchase_details: AssetPurchase[];
    public readonly consumables: AssetDetail[];
    public readonly general_details: AssetDetail[];
    public readonly invoices: AssetResource[];
    public readonly count: number;
    public readonly locations: [string, string][];
    public amount = 1;

    constructor(_data: Partial<Asset> = {}) {
        this.id = _data.id || '';
        this.name = _data.name || '';
        this.category = _data.category || '';
        this.images = _data.images || [];
        this.barcode = _data.barcode || '';
        this.brand = _data.brand || '';
        this.size = _data.size || 'Small';
        this.description = _data.description || '';
        this.specifications = _data.specifications || {};
        this.purchase_details = _data.purchase_details || [];
        this.consumables = _data.consumables || [];
        this.general_details = _data.general_details || [];
        this.invoices = _data.invoices || [];
        this.count = _data.count ?? 0;
        this.locations = _data.locations || [];
        this.amount = _data.amount ?? 1;
    }
}