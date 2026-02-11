import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "../api/auth/[...nextauth]/route";
import SecuritySidebar from "@/components/security-sidebar";

export default async function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session with auth options
  const session = await getServerSession(authOptions);

  // Debug logging to help identify the issue
  console.log('SESSION CHECK:', session?.user);

  if (!session || !session.user) {
    // Redirect to login if not authenticated
    redirect('/login');
  }

  // Get user role from session and normalize it for comparison
  const userRole = session.user.role?.toLowerCase();

  // Check if user has security role (case-insensitive comparison)
  if (userRole !== 'security') {
    console.log('[Security Layout] User role is not security, redirecting to access-denied');
    redirect('/access-denied'); // Redirect to access-denied instead of home to prevent loop
  }

  // Prepare user data for the sidebar
  const userData = {
    full_name: session.user.name || session.user.email || "Unknown User",
    role: userRole,
  };

  // Pass user data to Client Component sidebar
  return (
    <div className="animate-in fade-in duration-500">
      <SecuritySidebar user={userData}>
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </SecuritySidebar>
    </div>
  );
}