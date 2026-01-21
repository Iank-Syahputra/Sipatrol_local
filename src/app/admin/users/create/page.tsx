'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Building, Phone, Mail, Lock } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { useUser } from '@clerk/nextjs';

interface UnitOption {
  value: string;
  label: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { user } = useUser();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        router.push('/sign-in');
        return;
      }

      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.role === 'admin') {
            setIsAdmin(true);
          } else {
            router.push('/');
          }
        } else {
          router.push('/sign-in');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        router.push('/sign-in');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminRole();
  }, [user, router]);

  // Fetch units on component mount
  useState(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/admin/units?limit=100');
        if (response.ok) {
          const data = await response.json();
          const unitOptions = data.units.map((unit: any) => ({
            value: unit.id,
            label: unit.name
          }));
          setUnits(unitOptions);
        }
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Failed to load units');
      }
    };

    fetchUnits();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          username,
          password,
          phoneNumber: phoneNumber,
          unitId: selectedUnit,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('User created successfully!');
        // Reset form
        setFullName('');
        setUsername('');
        setPassword('');
        setPhoneNumber('');
        setSelectedUnit('');
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Router will handle the redirect
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Security Officer Account</h1>
        <p className="text-muted-foreground">
          Admin-only provisioning system - Invite new security officers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            New Officer Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name (Nama Lengkap)
              </Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">
                Username (for Login)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Initial Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Assigned Unit
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Combobox
                  options={units}
                  value={selectedUnit}
                  onValueChange={setSelectedUnit}
                  placeholder="Select unit..."
                  emptyMessage="No units available"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Security Officer Account
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}