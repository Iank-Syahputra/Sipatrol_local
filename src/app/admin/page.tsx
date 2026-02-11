import { redirect } from 'next/navigation';
import { isAdmin, getAllUnits, getLatestReports } from '@/lib/sipatrol-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Camera, Users, Building } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect('/');
  }

  // Fetch data
  const latestReports = await getLatestReports(5);
  const units = await getAllUnits();

  return (
    <div className="container mx-auto py-10 animate-in fade-in duration-500">
      <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl font-bold">Dasbor Admin</h1>
        <p className="text-muted-foreground">Monitor laporan keamanan dan kelola unit</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in slide-in-from-bottom-4 duration-700">
        <Card className="animate-in slide-in-from-left-8 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unit</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.length}</div>
            <p className="text-xs text-muted-foreground">Unit keamanan aktif</p>
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-left-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Terbaru</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestReports.length}</div>
            <p className="text-xs text-muted-foreground">Aktivitas terbaru</p>
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patroli Aktif</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.length}</div>
            <p className="text-xs text-muted-foreground">Operasi lapangan</p>
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-right-8 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petugas Keamanan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Personel terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
        <Card className="animate-in slide-in-from-left-4 duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Umpan Langsung - Laporan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestReports.length > 0 ? (
              <div className="space-y-4">
                {latestReports.map((report, index) => (
                  <div
                    key={report.id}
                    className={`border rounded-lg p-4 hover:bg-accent transition-colors animate-in slide-in-from-left-${index * 2} duration-500`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {report.profiles?.full_name || 'Pengguna Tidak Dikenal'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {report.units?.name || 'Unit Tidak Dikenal'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {new Date(report.captured_at).toLocaleString()}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      {report.latitude && report.longitude && (
                        <>
                          <MapPin className="h-4 w-4" />
                          <span>{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                        </>
                      )}
                    </div>

                    {report.notes && (
                      <p className="mt-2 text-sm">{report.notes}</p>
                    )}

                    {report.image_path && (
                      <div className="mt-2">
                        <img
                          src={report.image_path}
                          alt="Bukti laporan"
                          className="w-full max-h-40 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 animate-in fade-in duration-500">Tidak ada laporan terbaru</p>
            )}
          </CardContent>
        </Card>

        {/* Units Management */}
        <Card className="animate-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <CardTitle>Manajemen Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {units.map((unit, index) => (
                <div
                  key={unit.id}
                  className={`flex justify-between items-center border-b pb-2 last:border-0 last:pb-0 animate-in slide-in-from-right-${index * 2} duration-500`}
                >
                  <div>
                    <h3 className="font-medium">{unit.name}</h3>
                    <p className="text-sm text-muted-foreground">{unit.district}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/units/${unit.id}`}>Kelola</Link>
                  </Button>
                </div>
              ))}
            </div>

            <Button className="w-full mt-4 animate-in slide-in-from-bottom-4 duration-700" asChild>
              <Link href="/admin/units/new">Tambah Unit Baru</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}