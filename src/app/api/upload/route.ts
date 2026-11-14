import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import sharp from 'sharp';
import { getDrive } from '@/lib/google-sheets';
import { verifyAdmin } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const assetId = (formData.get('assetId') as string) || 'asset';

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size exceeds 25MB limit.' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Convert and optimize ANY incoming format (HEIC, HEIF, PNG, WebP, JPG, TIFF) to standard JPEG
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(rawBuffer)
        .rotate() // Automatically orient based on EXIF orientation (fixes mobile sideways/upside-down photos)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    } catch (sharpErr) {
      console.warn('Sharp processing fallback to raw buffer:', sharpErr);
      processedBuffer = rawBuffer;
    }

    const drive = await getDrive();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const cleanAssetId = assetId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanAssetId}_${Date.now()}.jpg`;

    const fileMetadata: { name: string; parents?: string[] } = {
      name: fileName,
    };

    if (folderId && folderId.trim()) {
      fileMetadata.parents = [folderId.trim()];
    }

    // Upload to Google Drive
    const response = await drive.files.create({
      supportsAllDrives: true,
      requestBody: fileMetadata,
      media: {
        mimeType: 'image/jpeg',
        body: Readable.from(processedBuffer),
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error('Google Drive upload failed to return a file ID.');
    }

    // Set permission to anyone with link can view (public read)
    try {
      await drive.permissions.create({
        fileId,
        supportsAllDrives: true,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permErr) {
      console.warn('Could not set public permission on Drive file:', permErr);
    }

    // Standard Google Drive URL (stored in Google Sheet)
    const driveUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

    return NextResponse.json({
      url: driveUrl,
      fileId,
      previewUrl: `/api/image/${fileId}`,
    });
  } catch (err: unknown) {
    console.error('Google Drive Upload error:', err);
    const message = err instanceof Error ? err.message : 'Failed to upload image to Google Drive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
