import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Camera, FileText, Shield, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OnlineStatusIndicator } from '@/components/online-status-indicator';
import RecentReportList from '@/components/security/recent-report-list';

export default async function SecurityDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'security') {
    redirect('/access-denied');
  }

  // Fetch essential security data
  const [rawReports, totalReportsCount] = await Promise.all([
    prisma.report.findMany({
      where: {
        userId: session.user.id as string,
      },
      include: {
        user: true,
        unit: true,
        category: true,
        location: true
      },
      orderBy: {
        capturedAt: 'desc',
      },
      take: 10,
    }),
    prisma.report.count({
      where: {
        userId: session.user.id as string,
      }
    })
  ]);

  // Transform data
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
    profiles: report.user ? { full_name: report.user.fullName } : undefined,
    category: report.category ? { name: report.category.name, color: report.category.color || undefined } : undefined,
    location: report.location ? { name: report.location.name } : undefined,
    locationNameCached: report.locationNameCached || undefined
  }));

  // Get user's assigned unit
  const assignedUnit = await prisma.unit.findUnique({
    where: {
      id: session.user.unitId as string | undefined,
    }
  });

  // Simulate loading for better UX
  await new Promise(resolve => setTimeout(resolve, 500));

  return (
    // Layout Fix: Full width background, light mode forced
    <div className="min-h-screen bg-slate-50 w-full text-slate-900 animate-in fade-in duration-500">

      {/* PERBAIKAN LEBAR & PADDING:
         - px-4: Padding kiri-kanan dikecilkan agar content lebih 'menabrak' ke sisi sidebar.
         - w-full: Memastikan div mengambil 100% width parent.
      */}
      <div className="w-full px-3 py-2 space-y-6 animate-in slide-in-from-bottom-4 duration-700">

        {/* Header Section */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Shield className="h-6 w-6 text-cyan-600" />
               <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Security Dashboard</h1>
            </div>
            <p className="text-slate-500 font-medium animate-in slide-in-from-top-2 duration-500">
              Selamat Bertugas, <span className="text-cyan-700 font-bold">{session.user.name}</span>.
            </p>
          </div>
          <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 animate-in slide-in-from-top-2 duration-500">
            <OnlineStatusIndicator />
          </div>
        </div>

        {/* Stats Cards Grid - Full Width Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
          {/* Card 1: Unit Info */}
          <Card className={`bg-white border-slate-200 shadow-sm hover:shadow-md transition-all border-l-4 border-l-cyan-400 animate-in slide-in-from-bottom-4 duration-500`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Unit Penugasan</CardTitle>
              <div className="p-2 bg-cyan-50 rounded-full">
                <MapPin className="h-5 w-5 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {assignedUnit ? assignedUnit.name : 'Unassigned'}
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {assignedUnit ? assignedUnit.district : 'Contact admin for assignment'}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Reports */}
          <Card className={`bg-white border-slate-200 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 animate-in slide-in-from-bottom-6 duration-500`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Log Laporan</CardTitle>
              <div className="p-2 bg-blue-50 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 mt-2">{totalReportsCount}</div>
              <p className="text-xs font-semibold text-slate-500 mt-1">Log Rutin Terkirim</p>
            </CardContent>
          </Card>

          {/* Card 3: Recent Activity */}
          <Card className={`bg-white border-slate-200 shadow-sm hover:shadow-md transition-all border-l-4 border-l-orange-400 animate-in slide-in-from-bottom-8 duration-500`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Log Terakhir</CardTitle>
              <div className="p-2 bg-orange-50 rounded-full">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {reports.length > 0
                  ? new Date(reports[0].capturedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-'}
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Tanggal Pengumpulan Terbaru
              </p>
            </CardContent>
          </Card>
        </div>

        {/* QUICK ACTION FIX:
            - Menggunakan 'lg:grid-cols-2' (Bagi 2 kolom rata)
            - Ini membuat Quick Action melebar (50% layar) sehingga tingginya tidak memanjang ke bawah.
            - Card History di sebelahnya juga mendapat 50% layar, seimbang.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-700">

          {/* Quick Action - Create Report */}
          <Card className={`bg-white border-slate-200 shadow-lg h-fit animate-in slide-in-from-left-4 duration-500`}>
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-900 text-xl">
                <Camera className="h-6 w-6 text-cyan-600" />
                Log Patroli Harian
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                Lakukan pemantauan area sesuai jadwal. Pastikan mendokumentasikan kondisi terkini untuk menjamin standar keamanan tetap terjaga.
              </p>
              {/* Tombol Utama: Cyan Background + Black Text untuk kontras tinggi */}
              <Button asChild className="w-full bg-[#00F7FF] text-slate-900 hover:bg-cyan-400 hover:shadow-cyan-200/50 hover:shadow-lg transition-all py-6 text-lg font-bold">
                <Link href="/security/report">
                  + Buat Laporan Baru
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports List */}
          <Card className={`bg-white border-slate-200 shadow-sm flex flex-col h-fit animate-in slide-in-from-right-4 duration-500`}>
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Riwayat Pemeriksaan Berkala
              </CardTitle>
              {reports.length > 3 && (
                 <Link href="/security/reports" className="text-sm font-bold text-cyan-700 hover:text-cyan-500 hover:underline">
                    Selengkapnya
                 </Link>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {reports.length > 0 ? (
                <div className="p-6">
                  {/* Container List */}
                  <div className="text-slate-900 font-medium">
                    <RecentReportList reports={reports.slice(0, 3)} />
                  </div>

                  {reports.length > 3 && (
                    <Button variant="outline" className="w-full mt-6 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-cyan-700" asChild>
                      <Link href="/security/reports">View Full History</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                   <div className="bg-slate-100 p-4 rounded-full mb-3">
                      <FileText className="h-8 w-8 text-slate-400" />
                   </div>
                   <p className="text-slate-900 font-bold">No reports yet</p>
                   <p className="text-slate-500 text-sm">Start your patrol to submit entries.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}