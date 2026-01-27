import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import AdminForbidden from "@/components/admin-forbidden"; // Import the error component

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Check if user is authenticated using NextAuth
  const session = await getServerSession();

  if (!session || !session.user) {
    // Redirect to login if not authenticated
    redirect('/login');
  }

  // 2. Get user role from session
  const userRole = session.user.role;

  // 3. Check if user has admin role
  if (userRole !== 'admin') {
    // User logged in, but WRONG ROLE -> Show Error Screen
    return <AdminForbidden />;
  }

  // 4. User is Admin -> Show Dashboard
  return <>{children}</>;
}