import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/user';
import { getUserProfile, getUserReports } from '@/lib/sipatrol-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { PatrolMap } from '@/components/patrol-map';

export default async function SecurityMapPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Get user profile to check role
  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== 'security') {
    redirect('/'); // Redirect if not a security user
  }

  // Get user's reports
  const { data: reports } = await getUserReports(user.id);

  // Prepare location data for the map
  const locations = reports
    .filter(report => report.latitude && report.longitude) // Only reports with location data
    .map(report => ({
      id: report.id,
      lat: report.latitude!,
      lng: report.longitude!,
      title: `Report #${report.id.substring(0, 8)}`,
      description: report.notes || 'Security report',
      timestamp: report.captured_at
    }));

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Patrol Map</h1>
        <p className="text-muted-foreground">View your patrol locations and reports</p>
      </div>

      {/* Map Section */}
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            My Patrol Locations
            <Badge variant="outline" className="ml-auto">
              {locations.length} locations
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-56px)] p-0">
          {locations.length > 0 ? (
            <PatrolMap 
              locations={locations} 
              center={
                locations.length > 0 
                  ? [locations[0].lat, locations[0].lng] 
                  : [-4.0428, 122.5278] // Default to Kendari
              }
              zoom={13}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No locations to display</h3>
                <p className="text-muted-foreground mt-2">
                  Submit security reports with location data to see them on the map.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About This Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This map shows the locations where you've submitted security reports. 
            Each marker represents a report with photo evidence and notes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}