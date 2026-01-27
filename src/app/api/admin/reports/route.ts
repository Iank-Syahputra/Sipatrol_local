import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // 1. Auth Check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch Reports with Relations
    // We include User, Unit, and Location details for the table display
    const reports = await prisma.report.findMany({
      orderBy: { capturedAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, username: true }
        },
        unit: {
          select: { name: true }
        },
        location: {
          select: { name: true }
        }
      }
    });

    // 3. Return Data
    return NextResponse.json(reports);

  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}