import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import AdminSidebar from "@/components/admin-sidebar";
import AdminForbidden from "@/components/admin-forbidden";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch session with auth options
  const session = await getServerSession(authOptions);

  // DEBUG: Log session role for troubleshooting
  console.log("[AdminLayout] Session Role:", session?.user?.role);

  // CHECK 1 (Not Logged In): If no session, redirect to login
  if (!session || !session.user) {
    redirect('/login');
  }

  // CHECK 2 (Role Validation): Check strictly for 'admin' role
  if (session.user.role !== 'admin') {
    // User logged in, but WRONG ROLE -> Show Error Screen
    return <AdminForbidden />;
  }

  // User is Admin -> Show Dashboard with sidebar as WRAPPER
  // Perbaikan: AdminSidebar sekarang membungkus children
  // agar layout full-width berfungsi dengan benar
  return (
    <div className="animate-in fade-in duration-500">
      <AdminSidebar>
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </AdminSidebar>
    </div>
  );
}