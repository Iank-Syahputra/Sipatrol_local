"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function checkRoleAndRedirect() {
  const session = await getServerSession(authOptions);

  console.log('[checkRoleAndRedirect] Session:', JSON.stringify(session?.user, null, 2));

  if (!session || !session.user) {
    return { error: "Not Authenticated" };
  }

  const userId = session.user.id as string;
  console.log('[checkRoleAndRedirect] User ID from session:', userId);

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true, username: true, fullName: true }
  });

  console.log('[checkRoleAndRedirect] DB profile:', JSON.stringify(profile, null, 2));

  if (!profile) {
    return { error: "Profile not found" };
  }

  if (profile.role === 'admin') {
    console.log('[checkRoleAndRedirect] Redirecting to /admin/dashboard');
    redirect('/admin/dashboard');
  } else if (profile.role === 'security') {
    console.log('[checkRoleAndRedirect] Redirecting to /security');
    redirect('/security');
  } else {
    redirect('/');
  }
}