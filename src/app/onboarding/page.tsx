'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';

export default function OnboardingPage() {
  const [fullName, setFullName] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingUnits, setFetchingUnits] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch units on component mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units');

        if (!response.ok) {
          throw new Error('Failed to fetch units');
        }

        const data = await response.json();
        setUnits(data.units);
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Failed to load units. Please contact your administrator.');
      } finally {
        setFetchingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (status !== 'authenticated' || !session?.user) {
        throw new Error('User not authenticated');
      }

      if (!selectedUnitId) {
        throw new Error('Please select a unit');
      }

      // Create user profile with security role via API call
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: session.user.id as string,
          full_name: fullName,
          role: 'security',
          assigned_unit_id: selectedUnitId, // Using selected unit ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      // Redirect to security dashboard
      router.push('/security');
      router.refresh(); // Refresh to ensure the new profile is recognized
    } catch (err) {
      console.error('Error during onboarding:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to SiPatrol</CardTitle>
          <CardDescription className="text-zinc-400">
            Complete your profile to access the security dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitSelect">Unit Assignment</Label>
              {fetchingUnits ? (
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-zinc-400">
                  Loading units...
                </div>
              ) : (
                <select
                  id="unitSelect"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your assigned unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={loading || fetchingUnits}
            >
              {loading ? 'Processing...' : 'Complete Setup'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-zinc-500">
            You'll be redirected to the Security Dashboard after setup
          </div>
        </CardContent>
      </Card>
    </div>
  );
}