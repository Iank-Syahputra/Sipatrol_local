import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user';
import { getUserProfile } from '@/lib/sipatrol-db';

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
    // If profile is missing, redirect to onboarding
    redirect('/onboarding');
  }
}