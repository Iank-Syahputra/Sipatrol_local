import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AdminForbidden from "@/components/admin-forbidden"; // Import the error component

const prisma = new PrismaClient();

// Helper function to wait for profile creation to complete
// Same retry logic as security layout and check-auth page
async function waitForProfile(userId: string, maxAttempts = 10, delayMs = 500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Admin Layout] Profile check attempt ${attempt}/${maxAttempts}`);

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (profile) {
      console.log('[Admin Layout] ✓ Profile found:', profile.role);
      return profile;
    }

    if (attempt < maxAttempts) {
      console.log(`[Admin Layout] Profile not found, waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log('[Admin Layout] ✗ Profile not found after all retry attempts');
  return null;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[Admin Layout] === Started ===');

  // 1. Check if user is authenticated using NextAuth
  const session = await getServerSession();

  if (!session || !session.user) {
    // Redirect to login if not authenticated
    redirect('/login');
  }

  // Extract user ID from session
  const userId = session.user.id as string;

  // 2. Wait for User Profile from Database (with retry logic)
  const profile = await waitForProfile(userId, 10, 500); // 10 attempts × 500ms = 5 seconds max

  // 3. STRICT DATABASE SYNC: Check if profile exists after all retries
  if (!profile) {
    // Profile was deleted or never created in database -> Force logout
    console.error('[Admin Layout] Profile does not exist after retries, forcing logout');
    const ForceLogout = (await import('@/components/force-logout')).default;
    return <ForceLogout />;
  }

  // 4. Check if Admin role
  if (profile.role !== 'admin') {
    // User logged in, but WRONG ROLE -> Show Error Screen
    console.log('[Admin Layout] User role is not admin, showing forbidden screen');
    return <AdminForbidden />;
  }

  console.log('[Admin Layout] ✓ Rendering for admin user:', profile.full_name);

  // 5. User is Admin -> Show Dashboard
  return <>{children}</>;
}