import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user';
import { getUserProfile } from '@/lib/sipatrol-db';
import SecurityUnregistered from '@/components/security-unregistered';

export const dynamic = 'force-dynamic';

export default async function CheckAuthPage() {
  // Get the current user
  const user = await getCurrentUser();

  if (!user) {
    // If no user is authenticated, redirect to sign in
    redirect('/sign-in');
  }

  // Check if the user profile exists in Supabase
  const profile = await getUserProfile();

  if (profile) {
    // If profile exists, redirect to dashboard
    redirect('/security');
  } else {
    // If profile is missing, show the unregistered component
    // This prevents ghost users from accidentally entering onboarding
    return <SecurityUnregistered />;
  }
}