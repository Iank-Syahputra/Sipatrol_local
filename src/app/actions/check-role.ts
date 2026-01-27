"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function checkRoleAndRedirect() {
  const session = await getServerSession();

  if (!session || !session.user) {
    return { error: "Not Authenticated" };
  }

  const userId = session.user.id as string;

  // Fetch Profile using Prisma
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!profile) {
    // If no profile, maybe guide to onboarding or show error
    return { error: "Profile not found" };
  }

  // Perform Redirect based on Role
  if (profile.role === 'admin') {
    redirect('/admin/users');
  } else if (profile.role === 'security') {
    redirect('/security');
  } else {
    redirect('/');
  }
}