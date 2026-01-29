'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function SecurityProfilePage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [unitName, setUnitName] = useState('');
  const [showPhoneSuccess, setShowPhoneSuccess] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(true); // Initialize to true to show loading initially
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Load user profile
  useEffect(() => {
    console.log('Session status changed to:', status); // Debug log

    if (status === 'authenticated') {
      const loadProfile = async () => {
        try {
          console.log('Attempting to fetch profile...'); // Debug log
          // Get user profile from database using session
          const response = await fetch('/api/user/profile');
          console.log('Profile fetch response status:', response.status); // Debug log

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Profile fetch error:', errorData);
            throw new Error(`Failed to load profile: ${errorData.error || 'Unknown error'}`);
          }

          const profile = await response.json();
          console.log("Profile data received:", profile); // Debug logging
          setFullName(profile.full_name && profile.full_name.trim() !== '' ? profile.full_name : 'Not set');
          setUsername(profile.username || 'Not set');
          setPhoneNumber(profile.phone_number || '');
          setOriginalPhone(profile.phone_number || '');
          setUnitName(profile.assignedUnit?.name || 'Unit not assigned');
        } catch (error) {
          console.error('Error loading profile:', error);
          toast.error('Failed to load profile');
        } finally {
          // Always set loading to false after attempting to load profile
          setLoading(false);
        }
      };

      loadProfile();
    } else if (status === 'unauthenticated') {
      router.push('/login');
      setLoading(false); // Make sure to stop loading when redirecting
    }
    // When status is 'loading', we rely on the initial loading state being true
  }, [status]); // Removed router from dependencies since it's stable

  // Validate phone number format
  const validatePhoneNumber = (phone: string) => {
    if (!phone) return null; // Allow empty phone numbers

    // Check if phone number contains any letters (alphabetic characters)
    if (/[a-zA-Z]/.test(phone)) {
      return 'Phone number should not contain letters';
    }

    // Check if phone number contains only allowed characters: digits, spaces, hyphens, parentheses, plus signs
    const allowedCharsRegex = /^[\d\s\-\+\(\)]+$/;
    if (!allowedCharsRegex.test(phone)) {
      return 'Phone number should only contain digits, spaces, hyphens, parentheses, and plus signs';
    }

    // Remove all non-digit characters to check length
    const digitsOnly = phone.replace(/\D/g, '');

    // Check if it contains only digits after removing separators
    if (!/^\d+$/.test(digitsOnly)) {
      return 'Phone number should only contain digits';
    }

    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return 'Phone number should be between 10 and 15 digits';
    }

    return null;
  };

  // Validate password strength
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }

    return null;
  };

  // Handle phone number update
  const handlePhoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validate phone number
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      toast.error(phoneError);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update phone number');
      }

      toast.success('Phone number updated successfully');

      // Update the original phone to match the new one
      setOriginalPhone(phoneNumber);

      // Show success indicator
      setShowPhoneSuccess(true);
      setTimeout(() => {
        setShowPhoneSuccess(false);
      }, 2000); // Hide after 2 seconds
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update phone number');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    console.log('Password change form submitted'); // Debug log
    e.preventDefault();
    setSaving(true);

    console.log('Current password:', currentPassword); // Debug log
    console.log('New password:', newPassword); // Debug log
    console.log('Confirm password:', confirmPassword); // Debug log

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      console.log('Password validation error:', passwordError); // Debug log
      toast.error(passwordError);
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match'); // Debug log
      toast.error('New passwords do not match');
      setSaving(false);
      return;
    }

    console.log('Sending password change request'); // Debug log
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      console.log('Response status:', response.status); // Debug log
      console.log('Response result:', result); // Debug log

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');

      // Show success indicator
      setShowPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordSuccess(false);
      }, 2000); // Hide after 2 seconds
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null; // Return null while redirecting
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        <div className="space-y-8">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-lg font-medium">{fullName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="text-lg font-medium">{username}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Unit</p>
                  <p className="text-lg font-medium">{unitName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phone Number Card */}
          <Card>
            <CardHeader>
              <CardTitle>Phone Number</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePhoneUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPhoneNumber(value);

                      // Real-time validation
                      const error = validatePhoneNumber(value);
                      setPhoneError(error || '');
                    }}
                    placeholder="Enter your phone number"
                    className={phoneError ? 'border-red-500' : ''}
                  />
                  {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  {phoneNumber !== originalPhone && (
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? 'Updating...' : 'Update Phone Number'}
                    </Button>
                  )}
                </div>
                {showPhoneSuccess && (
                  <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-md flex items-center w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">Phone number updated successfully!</span>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
                {showPasswordSuccess && (
                  <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-md flex items-center w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">Password changed successfully!</span>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}