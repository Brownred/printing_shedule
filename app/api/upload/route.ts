import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyMpesaPayment } from '@/lib/mpesa';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mpesaRef = formData.get('mpesaRef') as string;
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const customerPhone = formData.get('customerPhone') as string;

    // Validate required fields
    if (!file || !mpesaRef || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Verify file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 25MB' },
        { status: 400 }
      );
    }

    // Verify MPesa payment
    const paymentVerified = await verifyMpesaPayment(mpesaRef);
    if (!paymentVerified) {
      return NextResponse.json(
        { error: 'Invalid MPesa reference number' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${timestamp}${extension}`;

    // Save file to uploads directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    await writeFile(filepath, buffer);

    // Handle database operations
    try {
      // First, try to find the existing customer
      let customer = await prisma.customer.findUnique({
        where: { email: customerEmail },
      });

      // If no customer exists, create one
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || null,
          },
        });
      }

      // Create the order in a separate operation
      const order = await prisma.printOrder.create({
        data: {
          fileName: filename,
          originalName,
          mpesaRef: mpesaRef,
          status: 'PENDING',
          uploadedAt: new Date(),
          customerId: customer.id,
        },
        include: {
          customer: true,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
        },
      });
    } catch (dbError) {
      // If database operations fail, we should handle cleanup
      try {
        await prisma.$queryRaw`ROLLBACK;`; // Ensure any pending transaction is rolled back
        // Attempt to delete the uploaded file since the database operation failed
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs').promises;
        await fs.unlink(filepath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      throw dbError; // Re-throw the original error
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Error processing upload' },
      { status: 500 }
    );
  }
}