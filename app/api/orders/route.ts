import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { VALID_STATUSES } from "@/lib/types";
import { Prisma } from "@prisma/client";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(VALID_STATUSES).optional(),
  search: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
   
    const query = querySchema.safeParse(queryParams);
    if (!query.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: query.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, status, search } = query.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
          { mpesaRef: { contains: search, mode: 'insensitive' } },
        ],
      } as Prisma.PrintOrderWhereInput),
    };

    // Wrap database operations in a try-catch block specifically for database errors
    try {
      // Test database connection first
      await prisma.$queryRaw`SELECT 1`;

      const [total, orders] = await Promise.all([
        prisma.printOrder.count({ where }),
        prisma.printOrder.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: {
            uploadedAt: 'desc'
          },
          skip,
          take: limit,
        })
      ]);

      return NextResponse.json({
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + orders.length < total,
        }
      });

    } catch (dbError) {
      if (dbError instanceof Prisma.PrismaClientInitializationError) {
        console.error('Database connection error:', dbError.message);
        return NextResponse.json(
          { error: 'Database connection error', details: 'Unable to connect to the database. Please try again later.' },
          { status: 503 }
        );
      }
      
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma known error:', dbError.code, dbError.message);
        return NextResponse.json(
          { error: 'Database error', details: 'An error occurred while accessing the database.' },
          { status: 500 }
        );
      }

      throw dbError; // Re-throw unexpected errors
    }

  } catch (error) {
    console.error('Unexpected error in orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}