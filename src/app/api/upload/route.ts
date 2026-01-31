import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const fileType = searchParams.get('type') || 'general';

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Add timestamp to filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFilename = `${fileType}-${timestamp}-${filename}`;

    // Store the file
    const blob = await put(uniqueFilename, request.body || '', {
      access: 'public',
    });

    // Return the blob information
    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: uniqueFilename,
      uploadedAt: new Date().toISOString(),
      type: fileType
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
