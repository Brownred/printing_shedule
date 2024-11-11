import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VALID_STATUSES } from "@/lib/types";
import { z } from "zod";

const statusUpdateSchema = z.object({
  status: z.enum(VALID_STATUSES)
});

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = z.string().cuid().safeParse(params.orderId);
    if (!orderId.success) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = statusUpdateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid status',
          validStatuses: VALID_STATUSES,
          details: result.error.errors
        },
        { status: 400 }
      );
    }

    const { status } = result.data;

    const order = await prisma.printOrder.update({
      where: { id: orderId.data },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error updating order' },
      { status: 500 }
    );
  }
}