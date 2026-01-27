import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch All Locations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locations = await prisma.unitLocation.findMany({
      include: {
        unit: true // Include related unit info
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create New Location
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { unitId, name } = body;

    if (!unitId || !name) {
      return NextResponse.json({ error: "Unit ID and name are required" }, { status: 400 });
    }

    // Check if the combination of unitId and name already exists
    const existingLocation = await prisma.unitLocation.findFirst({
      where: {
        unitId,
        name
      }
    });

    if (existingLocation) {
      return NextResponse.json({ error: "Location with this name already exists in this unit" }, { status: 400 });
    }

    const newLocation = await prisma.unitLocation.create({
      data: {
        unitId,
        name
      },
      include: {
        unit: true
      }
    });
    return NextResponse.json(newLocation);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update Location
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, unitId, name } = body;

    if (!id || !unitId || !name) {
      return NextResponse.json({ error: "ID, Unit ID, and name are required" }, { status: 400 });
    }

    // Check if the combination of unitId and name already exists (excluding current record)
    const existingLocation = await prisma.unitLocation.findFirst({
      where: {
        unitId,
        name,
        id: { not: id } // Exclude current record
      }
    });

    if (existingLocation) {
      return NextResponse.json({ error: "Location with this name already exists in this unit" }, { status: 400 });
    }

    const updatedLocation = await prisma.unitLocation.update({
      where: { id },
      data: {
        unitId,
        name
      },
      include: {
        unit: true
      }
    });
    return NextResponse.json(updatedLocation);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete Location
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Location ID is required" }, { status: 400 });
    }

    // Check if there are any reports associated with this location
    const reportCount = await prisma.report.count({
      where: {
        locationId: id
      }
    });

    if (reportCount > 0) {
      return NextResponse.json({
        error: "Cannot delete location: there are reports associated with this location."
      }, { status: 400 });
    }

    await prisma.unitLocation.delete({
      where: { id }
    });
    return NextResponse.json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}