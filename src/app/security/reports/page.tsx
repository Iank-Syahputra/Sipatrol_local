import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user';
import { getUserProfile, getUserReports } from '@/lib/sipatrol-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReportList from '@/components/security/report-list';

// Tambahkan prop searchParams
export default async function MyReportsPage({
  searchParams,
}: {
  searchParams: { page?: string; startDate?: string; endDate?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== 'security') redirect('/');

  // 1. Parse Params
  const currentPage = Number(searchParams?.page) || 1;
  const startDate = searchParams?.startDate || '';
  const endDate = searchParams?.endDate || '';
  const itemsPerPage = 10;

  // 2. Fetch data with Filters & Pagination
  const { data: reports, totalCount } = await getUserReports(user.id, {
    page: currentPage,
    limit: itemsPerPage,
    startDate,
    endDate
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Reports</h1>
        <p className="text-muted-foreground">View your submitted security reports</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Your Reports ({totalCount})</span>
            <span className="text-xs font-normal text-zinc-400">
              Page {currentPage} of {totalPages || 1}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pass data & pagination info to Client Component */}
          <ReportList
            reports={reports}
            totalPages={totalPages}
            currentPage={currentPage}
            totalCount={totalCount}
            initialStartDate={startDate}
            initialEndDate={endDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}