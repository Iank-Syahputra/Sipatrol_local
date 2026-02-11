import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import ReportList from '@/components/security/report-list';

// Define SearchParams type for Next.js 15
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MyReportsPage(props: {
  searchParams: SearchParams;
}) {
  // 1. Await Params & Session
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  // 2. Auth Check
  if (!session || !session.user) {
    redirect('/login'); // FIX: Redirect to correct login route
  }

  // 3. Direct DB Profile Check (Bypassing broken library)
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id }
  });

  // Role Validation
  const role = profile?.role?.toLowerCase();
  if (role !== 'security' && role !== 'admin') {
    redirect('/');
  }

  // 4. Parse Filters & Pagination
  const currentPage = Number(searchParams.page) || 1;
  const startDate = typeof searchParams.startDate === 'string' ? searchParams.startDate : '';
  const endDate = typeof searchParams.endDate === 'string' ? searchParams.endDate : '';
  const itemsPerPage = 10;
  const skip = (currentPage - 1) * itemsPerPage;

  // Build Date Filter
  let dateFilter: any = {};
  if (startDate && endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    dateFilter = {
      capturedAt: {
        gte: new Date(startDate),
        lte: end
      }
    };
  } else if (startDate) {
    dateFilter = {
      capturedAt: { gte: new Date(startDate) }
    };
  }

  // 5. Fetch Reports (Direct Prisma)
  const rawReports = await prisma.report.findMany({
    where: {
      userId: session.user.id, // Only user's own reports
      ...dateFilter
    },
    include: {
      user: true,
      unit: true,
      category: true,
      location: true
    },
    orderBy: {
      capturedAt: 'desc'
    },
    skip: skip,
    take: itemsPerPage
  });

  // Transform data to match expected structure
  const reports = rawReports.map(report => ({
    id: report.id,
    userId: report.userId,
    unitId: report.unitId,
    imagePath: report.imagePath || undefined,
    notes: report.notes || undefined,
    latitude: report.latitude || undefined,
    longitude: report.longitude || undefined,
    categoryId: report.categoryId || undefined,
    locationId: report.locationId || undefined,
    capturedAt: report.capturedAt.toISOString(),
    isOfflineSubmission: report.isOfflineSubmission,
    createdAt: report.createdAt.toISOString(),
    units: report.unit ? { name: report.unit.name } : undefined,
    report_categories: report.category ? { name: report.category.name, color: report.category.color || undefined } : undefined,
    unit_locations: report.location ? { name: report.location.name } : undefined,
    profiles: report.user ? { full_name: report.user.fullName } : undefined
  }));

  // 6. Get Total Count
  const totalCount = await prisma.report.count({
    where: {
      userId: session.user.id, // Only count user's own reports
      ...dateFilter
    }
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="w-full px-6 py-8 space-y-8 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      <div className="bg-white border-l-4 border-l-[#00F7FF] border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Riwayat Laporan</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Daftar seluruh aktivitas pemantauan harian yang telah Anda selesaikan
          </p>
        </div>
        <div className="bg-cyan-50 p-3 rounded-full hidden md:block">
            <FileText className="w-8 h-8 text-cyan-600" />
        </div>
      </div>

      <Card className="bg-white border-slate-200 text-slate-900 animate-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="flex justify-between items-center">
            <span>Total Laporan: {totalCount}</span>
            <span className="text-xs font-normal text-zinc-400">
              Halaman {currentPage} dari {totalPages || 1}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Ensure ReportList component exists and accepts these props */}
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