import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';

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
    const restockMode = formData.get('restockMode') as string | null; // 'append' or 'replace'
    const productId = formData.get('productId') as string | null;

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

      // Parse new file content
      const newContent = buffer.toString('utf-8');
      const newLines = newContent.split('\n').filter(line => line.trim().length > 0);

      // ======== RESTOCK MODE ========
      if (restockMode && productId) {
        // Find existing product
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          return NextResponse.json(
            { error: 'Sản phẩm không tồn tại' },
            { status: 404 }
          );
        }

        const existingFilePath = product.fileUrl
          ? path.join(process.cwd(), 'uploads', product.fileUrl)
          : null;

        if (restockMode === 'append') {
          // APPEND: Read existing file, add new lines
          let existingContent = '';
          if (existingFilePath && existsSync(existingFilePath)) {
            existingContent = await readFile(existingFilePath, 'utf-8');
            // Ensure existing content ends with newline
            if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
              existingContent += '\n';
            }
          }

          const mergedContent = existingContent + newLines.join('\n') + '\n';
          const mergedLines = mergedContent.split('\n').filter(line => line.trim().length > 0);

          // Save merged file
          if (existingFilePath) {
            await writeFile(existingFilePath, mergedContent);
          } else {
            // No existing file, create new one
            const randomId = generateRandomId(6);
            const fileName = `combolist-${randomId}.txt`;
            const dirPath = path.join(process.cwd(), 'uploads', 'products');
            if (!existsSync(dirPath)) {
              await mkdir(dirPath, { recursive: true });
            }
            const newFilePath = path.join(dirPath, fileName);
            await writeFile(newFilePath, mergedContent);

            // Update fileUrl in DB
            await prisma.product.update({
              where: { id: productId },
              data: {
                fileUrl: `products/${fileName}`,
                fileName,
              },
            });
          }

          // Update product stock in DB
          const newTotalLines = mergedLines.length;
          const newStock = newTotalLines - (product.usedLines || 0);

          await prisma.product.update({
            where: { id: productId },
            data: {
              totalLines: newTotalLines,
              stock: newStock > 0 ? newStock : 0,
            },
          });

          return NextResponse.json({
            success: true,
            data: {
              mode: 'append',
              addedLines: newLines.length,
              totalLines: newTotalLines,
              usedLines: product.usedLines || 0,
              stock: newStock > 0 ? newStock : 0,
            },
          });

        } else if (restockMode === 'replace') {
          // REPLACE: Replace entire file, reset usedLines
          const randomId = generateRandomId(6);
          const fileName = `combolist-${randomId}.txt`;
          const dirPath = path.join(process.cwd(), 'uploads', 'products');
          if (!existsSync(dirPath)) {
            await mkdir(dirPath, { recursive: true });
          }
          const newFilePath = path.join(dirPath, fileName);
          await writeFile(newFilePath, newLines.join('\n') + '\n');

          // Update product in DB — reset everything
          await prisma.product.update({
            where: { id: productId },
            data: {
              fileName,
              fileUrl: `products/${fileName}`,
              totalLines: newLines.length,
              usedLines: 0,
              stock: newLines.length,
            },
          });

          return NextResponse.json({
            success: true,
            data: {
              mode: 'replace',
              totalLines: newLines.length,
              usedLines: 0,
              stock: newLines.length,
              fileName,
              fileUrl: `products/${fileName}`,
            },
          });
        }
      }

      // ======== NORMAL UPLOAD (new product) ========
      const randomId = generateRandomId(6);
      const fileName = `combolist-${randomId}.txt`;
      const filePath = path.join(process.cwd(), 'uploads', 'products', fileName);

      const dirPath = path.join(process.cwd(), 'uploads', 'products');
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        data: {
          fileName,
          fileUrl: `products/${fileName}`,
          totalLines: newLines.length,
          fileContent: newContent,
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

      const randomId = generateRandomId(6);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `product-${randomId}.${ext}`;
      const filePath = path.join(process.cwd(), 'public', 'products', 'images', fileName);

      const dirPath = path.join(process.cwd(), 'public', 'products', 'images');
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

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
