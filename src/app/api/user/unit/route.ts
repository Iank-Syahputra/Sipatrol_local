import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // FIXED: Use absolute import
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // 1. Auth Check
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch User Profile with Unit info
    // Since session.user.id now refers to the profile id (based on auth config), we can query directly
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      include: {
        assignedUnit: true // Get the full Unit details
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 3. Return the Unit Data in the expected format
    // Even if no unit is assigned, return the response in the expected format
    return NextResponse.json({
      assignedUnit: profile.assignedUnit
    });

  } catch (error) {
    console.error("Error fetching user unit:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}