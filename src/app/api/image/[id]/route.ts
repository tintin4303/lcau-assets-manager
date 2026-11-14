import { NextRequest, NextResponse } from 'next/server';
import { getDrive } from '@/lib/google-sheets';
import { Readable } from 'stream';

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

    // Stream the file directly from Google Drive
    const response = await drive.files.get(
      {
        fileId: id,
        alt: 'media',
        supportsAllDrives: true,
      },
      { responseType: 'stream' }
    );

    const stream = response.data as unknown as Readable;

    // Convert node stream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: unknown) {
    console.error('Error proxying image:', err);
    return new NextResponse('Image not found or inaccessible', { status: 404 });
  }
}
