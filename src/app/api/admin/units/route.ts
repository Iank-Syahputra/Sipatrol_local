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

    const formattedUnits = units.map(unit => ({
      ...unit,
      created_at: unit.createdAt, // Map camelCase to snake_case
    }));

    return NextResponse.json(formattedUnits);
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

    // Check if it's a bulk delete request
    if (body.unitIds && Array.isArray(body.unitIds)) {
      // Bulk delete
      const { unitIds } = body;

      if (!unitIds || unitIds.length === 0) {
        return NextResponse.json({ error: "Unit IDs are required for bulk delete" }, { status: 400 });
      }

      // Check if any of the units have associated records that prevent deletion
      // For example, check if there are users or locations associated with these units
      let userCount = 0;
      try {
        userCount = await prisma.profile.count({
          where: {
            assignedUnitId: {
              in: unitIds
            }
          }
        });
      } catch (error) {
        console.error("Error counting users:", error);
        // Return error response if count operation fails
        return NextResponse.json({
          error: "Error checking associated users. Please ensure all units are valid."
        }, { status: 500 });
      }

      if (userCount > 0) {
        return NextResponse.json({
          error: "Cannot delete units: some units have users associated with them."
        }, { status: 400 });
      }

      let locationCount = 0;
      try {
        locationCount = await prisma.unitLocation.count({
          where: {
            unitId: {
              in: unitIds
            }
          }
        });
      } catch (error) {
        console.error("Error counting locations:", error);
        // Return error response if count operation fails
        return NextResponse.json({
          error: "Error checking associated locations. Please ensure all units are valid."
        }, { status: 500 });
      }

      if (locationCount > 0) {
        return NextResponse.json({
          error: "Cannot delete units: some units have locations associated with them."
        }, { status: 400 });
      }

      const deletedCount = await prisma.unit.deleteMany({
        where: {
          id: {
            in: unitIds
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `${deletedCount.count} units deleted successfully`,
        count: deletedCount.count
      });
    } else {
      // Single delete
      const { id } = body;

      if (!id) {
        return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
      }

      // Check if the unit has any associated records that prevent deletion
      let userCount = 0;
      try {
        userCount = await prisma.profile.count({
          where: {
            assignedUnitId: id
          }
        });
      } catch (error) {
        console.error("Error counting users for single unit:", error);
        // Return error response if count operation fails
        return NextResponse.json({
          error: "Error checking associated users. Please ensure the unit is valid."
        }, { status: 500 });
      }

      if (userCount > 0) {
        return NextResponse.json({
          error: "Cannot delete unit: there are users associated with this unit."
        }, { status: 400 });
      }

      let locationCount = 0;
      try {
        locationCount = await prisma.unitLocation.count({
          where: {
            unitId: id
          }
        });
      } catch (error) {
        console.error("Error counting locations for single unit:", error);
        // Return error response if count operation fails
        return NextResponse.json({
          error: "Error checking associated locations. Please ensure the unit is valid."
        }, { status: 500 });
      }

      if (locationCount > 0) {
        return NextResponse.json({
          error: "Cannot delete unit: there are locations associated with this unit."
        }, { status: 400 });
      }

      await prisma.unit.delete({
        where: { id }
      });

      return NextResponse.json({ success: true, message: "Unit deleted successfully" });
    }
  } catch (error: any) {
    console.error("Error in DELETE /api/admin/units:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}