import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        const filePath = pathSegments.join('/');

        // Security: prevent directory traversal
        if (filePath.includes('..') || filePath.includes('~')) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        // Only allow image extensions
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext];
        if (!mimeType) {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        // Look for file in uploads/images/ first, then fallback to public/products/images/
        const uploadsPath = path.join(process.cwd(), 'uploads', 'images', filePath);
        const publicPath = path.join(process.cwd(), 'public', 'products', 'images', filePath);

        let resolvedPath = '';
        if (existsSync(uploadsPath)) {
            resolvedPath = uploadsPath;
        } else if (existsSync(publicPath)) {
            resolvedPath = publicPath;
        } else {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const fileBuffer = await readFile(resolvedPath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
