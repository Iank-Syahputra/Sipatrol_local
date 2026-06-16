import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema untuk category validation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name too long"),
  color: z.string().optional()
});

export async function GET() {
  try {
    // Auth Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all categories
    const categories = await prisma.reportCategory.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse JSON body
    const body = await request.json();
    const validationResult = categorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed",
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    // Check for duplicate name
    const existingCategory = await prisma.reportCategory.findUnique({
      where: { name: body.name }
    });

    if (existingCategory) {
      return NextResponse.json({ 
        error: "Category with this name already exists" 
      }, { status: 409 });
    }

    // Create category
    const category = await prisma.reportCategory.create({
      data: {
        name: body.name,
        color: body.color || 'gray'
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Auth Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse JSON body
    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Validate
    const validationResult = categorySchema.safeParse({ name, color });
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed",
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    // Check for duplicate name (excluding current category)
    const existingCategory = await prisma.reportCategory.findFirst({
      where: {
        name: name,
        NOT: { id: id }
      }
    });

    if (existingCategory) {
      return NextResponse.json({ 
        error: "Category with this name already exists" 
      }, { status: 409 });
    }

    // Update category
    const category = await prisma.reportCategory.update({
      where: { id },
      data: {
        name,
        color: color || 'gray'
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Auth Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Check if category is being used in reports
    const reportsCount = await prisma.report.count({
      where: { categoryId: id }
    });

    if (reportsCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete category. It is being used in existing reports." 
      }, { status: 409 });
    }

    // Delete category
    await prisma.reportCategory.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}