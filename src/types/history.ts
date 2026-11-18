export interface EventRequestRecord {
  id: string;
  eventId?: string;
  eventName: string;
  requesterName: string;
  requesterFunction: string;
  assetId: string;
  assetName: string;
  category: string;
  rowIndex: number;
  quantity: number;
  status: 'pending' | 'loaned' | 'returned';
  requestedAt: string;
  handedOverAt?: string;
  returnedAt?: string;
}

export interface EventEquipmentSummary {
  assetName: string;
  assetId: string;
  category: string;
  totalQuantity: number;
  requestCount: number;
}
