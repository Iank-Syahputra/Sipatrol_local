import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  // 1. Auth Check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Parse request body
    const { reportIds } = await request.json();

    // 3. Validate input
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json({ error: "Invalid or empty report IDs array" }, { status: 400 });
    }

    // 4. Delete multiple reports
    const result = await prisma.report.deleteMany({
      where: {
        id: {
          in: reportIds,
        },
      },
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: `${result.count} report(s) deleted successfully`,
      deletedCount: result.count
    });

  } catch (error: any) {
    console.error("Failed to delete reports:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}