import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "../api/auth/[...nextauth]/route";
import SecuritySidebar from "@/components/security-sidebar";
import SecurityForbidden from "@/components/security-forbidden";

export default async function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const userRole = session.user.role?.toLowerCase();

  if (userRole !== 'security') {
    return <SecurityForbidden />;
  }

  const userData = {
    full_name: session.user.name || session.user.email || "Unknown User",
    role: userRole,
  };

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