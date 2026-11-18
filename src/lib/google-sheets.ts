import { google } from 'googleapis';
import { Asset, AssetCategory, CreateAssetInput, UpdateAssetInput } from '@/types/asset';
import { extractGoogleDriveId } from '@/lib/image-utils';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Service Account credentials missing in environment variables.');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
}

export async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

export async function getDrive() {
  const auth = getAuth();
  return google.drive({ version: 'v3', auth });
}

export const CATEGORIES: AssetCategory[] = ['Stationary', 'Decoration', 'General'];

const DEFAULT_SHEET_IDS: Record<AssetCategory, number> = {
  Stationary: 613491335,
  Decoration: 1752392028,
  General: 1516794630,
};

/**
 * Fetch all assets across the three tabs simultaneously using batchGet.
 */
export async function fetchAllAssets(): Promise<Asset[]> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  const ranges = CATEGORIES.map((cat) => `${cat}!A5:I`);

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const valueRanges = response.data.valueRanges || [];
  const assets: Asset[] = [];

  valueRanges.forEach((rangeObj, index) => {
    const category = CATEGORIES[index];
    const rows = rangeObj.values || [];

    rows.forEach((row, rowOffset) => {
      // Row 5 in Google Sheets is rowOffset 0, so actual 1-based sheet row = 5 + rowOffset
      const sheetRowIndex = 5 + rowOffset;
      const id = (row[0] || '').toString().trim();
      const name = (row[1] || '').toString().trim();

      // Only consider rows that have at least an ID or a Name
      if (!id && !name) return;

      const rawTotal = (row[2] || '').toString().trim();
      const rawRemaining = (row[3] || '').toString().trim();
      const unit = (row[4] || '').toString().trim();
      const image = (row[5] || '').toString().trim();
      const statusRaw = (row[6] || '').toString().trim().toUpperCase();
      const status = statusRaw === 'IN' || statusRaw === 'OUT' ? statusRaw : (statusRaw ? 'OUT' : '');
      const reqBy = (row[7] || '').toString().trim();
      const reqQty = parseInt(row[8], 10) || 0;

      // Handle numeric vs text specifications (e.g. "3 thick, 3 thin" or "20 (2 white)")
      const isNumericTotal = /^\d+$/.test(rawTotal);
      const totalQty = isNumericTotal ? parseInt(rawTotal, 10) : (rawTotal || 0);

      let remainingQty: string | number;
      if (status === 'OUT') {
        remainingQty = 0;
      } else if (isNumericTotal) {
        if (reqQty > 0) {
          remainingQty = Math.max(0, (totalQty as number) - reqQty);
        } else {
          const parsedRemaining = parseInt(rawRemaining, 10);
          remainingQty = !isNaN(parsedRemaining) ? parsedRemaining : (totalQty as number);
        }
      } else {
        remainingQty = rawRemaining && !rawRemaining.startsWith('#') ? rawRemaining : rawTotal;
      }

      assets.push({
        id,
        name,
        totalQty,
        remainingQty,
        unit,
        image,
        status: status as Asset['status'],
        reqBy,
        reqQty,
        category,
        rowIndex: sheetRowIndex,
      });
    });
  });

  return assets;
}

/**
 * Create / append a new asset to the corresponding category tab.
 */
export async function createAsset(data: CreateAssetInput): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  // Get current row count to place correct formula in Column D (=C{row}-I{row})
  const rangeCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${data.category}!A:A`,
  });
  const currentTotalRows = (rangeCheck.data.values || []).length;
  const nextRowNumber = currentTotalRows + 1;

  const rowValues = [
    data.id,
    data.name,
    data.totalQty,
    `=C${nextRowNumber}-I${nextRowNumber}`,
    data.unit || '',
    data.image || '',
    data.status,
    data.reqBy || '',
    data.reqQty || 0,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${data.category}!A:I`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues],
    },
  });
}

/**
 * Update an existing asset row in the specified category tab.
 */
export async function updateAsset(
  category: AssetCategory,
  rowIndex: number,
  data: UpdateAssetInput
): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  // Read current row values first to merge partial updates
  const currentRange = `${category}!A${rowIndex}:I${rowIndex}`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: currentRange,
  });

  const existingRow = existing.data.values?.[0] || [];
  const id = existingRow[0] || '';
  const name = data.name !== undefined ? data.name : (existingRow[1] || '');
  const rawExistingTotal = existingRow[2] || '';
  const totalQty = data.totalQty !== undefined
    ? data.totalQty
    : (/^\d+$/.test(rawExistingTotal) ? parseInt(rawExistingTotal, 10) : rawExistingTotal);
  const unit = data.unit !== undefined ? data.unit : (existingRow[4] || '');
  const image = data.image !== undefined ? data.image : (existingRow[5] || '');
  const status = data.status !== undefined ? data.status : (existingRow[6] || 'IN');
  const reqBy = data.reqBy !== undefined ? data.reqBy : (existingRow[7] || '');
  const reqQty = data.reqQty !== undefined ? data.reqQty : (parseInt(existingRow[8], 10) || 0);

  // If a new image was uploaded and it replaces an existing Google Drive image, clean up the old file in Drive
  const oldImage = existingRow[5] || '';
  if (data.image && data.image !== oldImage) {
    const oldDriveId = extractGoogleDriveId(oldImage);
    const newDriveId = extractGoogleDriveId(data.image);
    if (oldDriveId && oldDriveId !== newDriveId) {
      try {
        const drive = await getDrive();
        await drive.files.update({
          fileId: oldDriveId,
          supportsAllDrives: true,
          requestBody: { trashed: true },
        });
      } catch (err) {
        console.warn('Could not trash replaced Drive file:', err);
      }
    }
  }

  const updatedRow = [
    id,
    name,
    totalQty,
    `=C${rowIndex}-I${rowIndex}`,
    unit,
    image,
    status,
    reqBy,
    reqQty,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: currentRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [updatedRow],
    },
  });
}

/**
 * Delete a specific asset row from its category tab.
 */
export async function deleteAsset(category: AssetCategory, rowIndex: number): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  // Check if asset has a Google Drive image to clean up
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${category}!F${rowIndex}`,
    });
    const imageVal = existing.data.values?.[0]?.[0];
    const driveId = imageVal ? extractGoogleDriveId(String(imageVal)) : null;
    if (driveId) {
      const drive = await getDrive();
      await drive.files.update({
        fileId: driveId,
        supportsAllDrives: true,
        requestBody: { trashed: true },
      });
    }
  } catch (cleanErr) {
    console.warn('Could not trash Drive file on asset deletion:', cleanErr);
  }

  // Find sheetId for the category
  let sheetId = DEFAULT_SHEET_IDS[category];
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const match = meta.data.sheets?.find((s) => s.properties?.title === category);
    if (match && match.properties?.sheetId !== undefined && match.properties.sheetId !== null) {
      sheetId = match.properties.sheetId;
    }
  } catch {
    // fallback to DEFAULT_SHEET_IDS
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-indexed start (inclusive)
              endIndex: rowIndex,       // 0-indexed end (exclusive)
            },
          },
        },
      ],
    },
  });
}

export interface BatchRequestItem {
  category: AssetCategory;
  rowIndex: number;
  reqQty: number;
}

/**
 * Batch update multiple asset requests in a single atomic Google Sheets API call.
 * Sets Status to IN (Pending Handover), Req By to requester, and Req Qty to requested amount.
 */
export async function batchRequestAssets(
  reqBy: string,
  items: BatchRequestItem[]
): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  const data = items.map((item) => ({
    range: `${item.category}!G${item.rowIndex}:I${item.rowIndex}`,
    values: [['IN', reqBy.trim(), item.reqQty]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });
}
