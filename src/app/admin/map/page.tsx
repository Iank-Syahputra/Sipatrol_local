import { redirect } from 'next/navigation';
import { isAdmin, getReportsByFilters } from '@/lib/sipatrol-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PatrolMap } from '@/components/patrol-map';

export default async function PatrolMapPage({
  searchParams,
}: {
  searchParams?: {
    dateFrom?: string;
    dateTo?: string;
  };
}) {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect('/');
  }

  // Parse search params
  const dateFrom = searchParams?.dateFrom || undefined;
  const dateTo = searchParams?.dateTo || undefined;

  // Fetch reports with location data
  const reports = await getReportsByFilters(undefined, dateFrom, dateTo);

  // Prepare location data for the map
  const locations = reports
    .filter(report => report.latitude && report.longitude) // Only reports with location data
    .map(report => ({
      id: report.id,
      lat: report.latitude!,
      lng: report.longitude!,
      title: `${report.profiles?.full_name || 'Security Officer'} - ${report.units?.name || 'Unit'}`,
      description: report.notes || 'Security report',
      timestamp: report.captured_at
    }));

  return (
    <div className="container mx-auto py-6 animate-in fade-in duration-500">
      <div className="mb-6 animate-in slide-in-from-top-4 duration-700">
        <h1 className="text-2xl font-bold">Peta Lokasi Patroli</h1>
        <p className="text-muted-foreground">Visualisasi lokasi patroli keamanan</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 animate-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle>Filter Lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/admin/map">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 animate-in slide-in-from-left-4 duration-500">
                <Label htmlFor="dateFrom">Tanggal Mulai</Label>
                <Input
                  type="date"
                  id="dateFrom"
                  name="dateFrom"
                  defaultValue={dateFrom}
                  className="w-full"
                />
              </div>

              <div className="space-y-2 animate-in slide-in-from-right-4 duration-500">
                <Label htmlFor="dateTo">Tanggal Akhir</Label>
                <Input
                  type="date"
                  id="dateTo"
                  name="dateTo"
                  defaultValue={dateTo}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end animate-in slide-in-from-bottom-4 duration-700">
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Terapkan Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Map Section */}
      <Card className="h-[600px] animate-in slide-in-from-bottom-8 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lokasi Patroli
            <Badge variant="outline" className="ml-auto">
              {locations.length} lokasi
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-56px)] p-0">
          {locations.length > 0 ? (
            <PatrolMap locations={locations} />
          ) : (
            <div className="h-full w-full flex items-center justify-center animate-in fade-in duration-500">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground animate-in zoom-in-50 duration-500" />
                <h3 className="mt-4 font-semibold animate-in slide-in-from-bottom-2 duration-500">Tidak ada lokasi untuk ditampilkan</h3>
                <p className="text-muted-foreground mt-2 animate-in slide-in-from-bottom-2 duration-700">
                  Kirim laporan keamanan dengan data lokasi untuk melihatnya di peta.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-6 animate-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle>Legenda Peta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 animate-in slide-in-from-left-4 duration-500">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Laporan Keamanan</span>
            </div>
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-500">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Rute Patroli</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}