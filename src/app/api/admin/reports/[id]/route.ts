import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth Check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;

    // 2. Delete the report
    await prisma.report.delete({
      where: {
        id: id,
      },
    });

    // 3. Return success response
    return NextResponse.json({
      success: true,
      message: "Report deleted successfully"
    });

  } catch (error: any) {
    console.error("Failed to delete report:", error);

    // Check if it's a foreign key constraint error or record not found
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: "Report not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      error: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}