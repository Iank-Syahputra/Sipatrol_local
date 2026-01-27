import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Camera, FileText, Shield } from 'lucide-react';
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

  // Fetch essential security data (e.g., today's reports) using prisma.report.findMany
  const reports = await prisma.report.findMany({
    where: {
      userId: session.user.id as string,
    },
    include: {
      user: true,
      unit: true,
    },
    orderBy: {
      capturedAt: 'desc',
    },
    take: 10, // Limit to 10 most recent reports
  });

  // Get user's assigned unit
  const assignedUnit = await prisma.unit.findUnique({
    where: {
      id: session.user.unitId as string | undefined,
    }
  });

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {session.user.name}</p>
          </div>
          <OnlineStatusIndicator />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Unit</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedUnit ? assignedUnit.name : 'Unassigned'}
            </div>
            <p className="text-xs text-muted-foreground">
              {assignedUnit ? assignedUnit.district : 'Contact admin for assignment'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">Submitted reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.length > 0
                ? new Date(reports[0].capturedAt).toLocaleDateString()
                : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last report submitted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Create New Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Submit a new security report with photo evidence and location data.
            </p>
            <Button asChild className="w-full">
              <Link href="/security/report">Create Report</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {/* Replace static map with Interactive Component */}
                {/* Pass only the first 3 reports */}
                <RecentReportList reports={reports.slice(0, 3)} />

                {/* Keep the View All button */}
                {reports.length > 3 && (
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/security/reports">View All Reports</Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No reports submitted yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}