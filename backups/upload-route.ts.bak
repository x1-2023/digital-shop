import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Generate random string for filenames
function generateRandomId(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string; // 'product' or 'image'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    if (type === 'product') {
      // Handle product file (.txt)
      if (!file.name.endsWith('.txt')) {
        return NextResponse.json(
          { error: 'Only .txt files are allowed for products' },
          { status: 400 }
        );
      }

      // Parse file content
      const content = buffer.toString('utf-8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);

      // Generate filename: combolist-xxxxx.txt
      const randomId = generateRandomId(6);
      const fileName = `combolist-${randomId}.txt`;
      const filePath = path.join(process.cwd(), 'uploads', 'products', fileName);

      // Ensure directory exists
      const dirPath = path.join(process.cwd(), 'uploads', 'products');
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      // Save file
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        data: {
          fileName,
          fileUrl: `products/${fileName}`,
          totalLines: lines.length,
          fileContent: content, // Send back full content for storage
        },
      });
    } else if (type === 'image') {
      // Handle product image
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Only JPG, PNG, and WebP images are allowed' },
          { status: 400 }
        );
      }

      // Generate filename: product-xxxxx.ext
      const randomId = generateRandomId(6);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `product-${randomId}.${ext}`;
      const filePath = path.join(process.cwd(), 'public', 'products', 'images', fileName);

      // Ensure directory exists
      const dirPath = path.join(process.cwd(), 'public', 'products', 'images');
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      // Save file
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        data: {
          fileName,
          imageUrl: `/products/images/${fileName}`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
