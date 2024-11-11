import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // Get order details from database
    const order = await prisma.printOrder.findUnique({
      where: { id: params.orderId },
      select: {
        fileName: true,
        originalName: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public/uploads', order.fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Create response with file
    const response = new NextResponse(fileBuffer);

    // Set headers
    response.headers.set('Content-Type', 'application/octet-stream');
    response.headers.set('Content-Disposition', `attachment; filename="${order.originalName}"`);

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Error processing download' },
      { status: 500 }
    );
  }
}