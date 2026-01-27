import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch All Units
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const units = await prisma.unit.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create New Unit
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, district } = body;

    if (!name || !district) {
      return NextResponse.json({ error: "Name and District are required" }, { status: 400 });
    }

    const newUnit = await prisma.unit.create({
      data: { name, district }
    });

    return NextResponse.json(newUnit);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update Unit
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, district } = body;

    if (!id || !name || !district) {
      return NextResponse.json({ error: "ID, Name, and District are required" }, { status: 400 });
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: { name, district }
    });

    return NextResponse.json(updatedUnit);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete Unit
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
    }

    await prisma.unit.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Unit deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}