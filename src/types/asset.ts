export type AssetCategory = 'Decoration' | 'General' | 'Stationary';
export type AssetStatus = 'IN' | 'OUT' | '';

export interface Asset {
  id: string;                      // Column A (Asset_ID)
  name: string;                    // Column B (Asset Name)
  totalQty: string | number;        // Column C (Total Asset Qty, e.g. 10 or "3 thick, 3 thin")
  remainingQty: string | number;    // Column D (Remaining Qty)
  unit: string;                    // Column E (Unit)
  image: string;                   // Column F (Image URL or identifier)
  status: AssetStatus;             // Column G (Status: IN or OUT)
  reqBy: string;                   // Column H (Req By)
  reqQty: number;                  // Column I (Req Qty)
  category: AssetCategory;         // Tab name
  rowIndex: number;                // Sheet 1-based row index (e.g. row 5, 6, ...)
}

export interface CreateAssetInput {
  id: string;
  name: string;
  totalQty: string | number;
  unit: string;
  image?: string;
  status: 'IN' | 'OUT';
  reqBy?: string;
  reqQty?: number;
  category: AssetCategory;
}

export interface UpdateAssetInput {
  name?: string;
  totalQty?: string | number;
  unit?: string;
  image?: string;
  status: 'IN' | 'OUT';
  reqBy?: string;
  reqQty?: number;
}

export interface CartItem {
  asset: Asset;
  reqQty: number;
}
