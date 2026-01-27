import { getServerSession } from "next-auth/next";

export async function getCurrentUser() {
  try {
    const session = await getServerSession();
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
