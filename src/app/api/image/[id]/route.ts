import { NextRequest, NextResponse } from 'next/server';
import { getDrive } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id || id.trim().length === 0) {
      return new NextResponse('File ID required', { status: 400 });
    }

    const drive = await getDrive();

    // Fetch the file as arraybuffer to ensure complete binary delivery with Content-Length
    const response = await drive.files.get(
      {
        fileId: id,
        alt: 'media',
        supportsAllDrives: true,
      },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);
    const contentType = (response.headers as Record<string, string>)?.['content-type'] || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: unknown) {
    console.error('Error proxying image:', err);
    return new NextResponse('Image not found or inaccessible', { status: 404 });
  }
}
