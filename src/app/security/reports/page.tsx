import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user';
import { getUserProfile, getUserReports } from '@/lib/sipatrol-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Import the new Client Component
import ReportList from '@/components/security/report-list';

export default async function MyReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== 'security') redirect('/');

  // Fetch data on Server
  const reports = await getUserReports(user.id);

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Reports</h1>
        <p className="text-muted-foreground">View your submitted security reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pass data to Client Component */}
          <ReportList reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}