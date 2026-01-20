'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Wifi, WifiOff, Loader2, CheckCircle, RotateCcw, ImageUp } from 'lucide-react';
import { useOfflineReports } from '@/hooks/use-offline-reports';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with public keys (safe for client-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateReportPage() {
  const router = useRouter();
  const { user } = useUser();
  const { addOfflineReport } = useOfflineReports();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isImageCaptured, setIsImageCaptured] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [assignedUnit, setAssignedUnit] = useState<any>(null);
  const [unitError, setUnitError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch user's assigned unit on component mount
  useEffect(() => {
    const fetchAssignedUnit = async () => {
      if (user) {
        try {
          const response = await fetch('/api/user/unit');
          if (response.ok) {
            const data = await response.json();
            setAssignedUnit(data.assignedUnit);
            if (!data.assignedUnit) {
              setUnitError('Anda tidak ditugaskan ke unit manapun. Hubungi administrator untuk mendapatkan penugasan unit.');
            } else {
              setUnitError(null);
            }
          } else {
            setUnitError('Gagal memuat penugasan unit Anda. Silakan coba lagi.');
          }
        } catch (error) {
          console.error('Error fetching assigned unit:', error);
          setUnitError('Terjadi kesalahan saat menghubungi server. Silakan coba lagi.');
        }
      }
    };

    fetchAssignedUnit();
  }, [user]);

  // Initialize camera
  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use rear camera if available
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      setImagePreview(imageData);
      setIsImageCaptured(true);
      setImageFile(null); // We'll set this when user confirms the photo
      stopCamera();
    }
  };

  // Handle file selection from gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setIsImageCaptured(true);
    }
  };

  // Trigger camera input click
  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  // Clear the current photo and return to selection mode
  const clearPhoto = () => {
    setImagePreview(null);
    setImageFile(null);
    setIsImageCaptured(false);
    stopCamera();
  };

  // Get current location
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda');
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Tidak dapat mendapatkan lokasi Anda. Pastikan layanan lokasi diaktifkan.');
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Submit report
  const submitReport = async () => {
    if (!user) {
      alert('Anda harus masuk untuk mengirim laporan');
      return;
    }

    if (!isImageCaptured) {
      alert('Silakan ambil foto sebelum mengirim');
      return;
    }

    if (!location) {
      alert('Silakan dapatkan lokasi Anda sebelum mengirim');
      return;
    }

    if (!assignedUnit) {
      alert('Anda tidak ditugaskan ke unit manapun. Hubungi administrator untuk mendapatkan penugasan unit.');
      return;
    }

    if (!imageFile) {
      alert('Tidak ada file gambar ditemukan');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isOnline) {
        // Online submission - upload to Supabase Storage and save to DB
        // Note: File uploads from client require proper RLS policies or using a service role key in an API route
        // For security, we'll send the file to our API route which handles the upload with service role
        
        // Prepare form data for upload
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('notes', notes);
        formData.append('latitude', location.lat.toString());
        formData.append('longitude', location.lng.toString());
        formData.append('unitId', assignedUnit.id);
        formData.append('userId', user.id);

        const response = await fetch('/api/reports', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          alert('Laporan berhasil dikirim!');
          router.push('/security');
        } else {
          const error = await response.json();
          console.error('Error submitting report:', error);
          alert(`Gagal mengirim laporan: ${error.error || 'Kesalahan tidak diketahui'}`);
        }
      } else {
        // Offline submission - save to IndexedDB
        await addOfflineReport({
          userId: user.id,
          unitId: assignedUnit.id,
          imageData: imagePreview, // Store the preview URL for offline
          notes,
          latitude: location.lat,
          longitude: location.lng,
          capturedAt: new Date().toISOString()
        });

        alert('Laporan disimpan secara offline. Akan dikirim saat Anda terhubung kembali ke internet.');
        router.push('/security');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      // Revoke object URLs to free memory
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Determine if submit button should be enabled
  const isSubmitEnabled = isImageCaptured && location && assignedUnit && !isSubmitting;

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buat Laporan Keamanan</h1>
        <p className="text-muted-foreground">
          Ambil bukti dengan foto dan data lokasi
        </p>
      </div>

      {unitError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {unitError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detail Laporan</span>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? (
                <>
                  <Wifi className="mr-1 h-3 w-3" /> Online
                </>
              ) : (
                <>
                  <WifiOff className="mr-1 h-3 w-3" /> Offline
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hidden input for camera access */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Camera/Gallery Selection */}
          <div className="space-y-2">
            <Label>Foto Bukti</Label>
            {!isImageCaptured ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  type="button"
                  onClick={triggerCameraInput}
                  variant="outline"
                  className="flex flex-col items-center justify-center h-32"
                >
                  <Camera className="h-8 w-8 mb-2" />
                  <span>Kamera</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                  className="flex flex-col items-center justify-center h-32"
                >
                  <ImageUp className="h-8 w-8 mb-2" />
                  <span>Galeri</span>
                </Button>
              </div>
            ) : (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Pratinjau bukti"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Overlay controls */}
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    onClick={clearPhoto}
                    variant="secondary"
                    className="bg-background/80 backdrop-blur"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Ganti Foto
                  </Button>
                </div>
              </div>
            )}

            {/* Camera View when active */}
            {isCameraActive && (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                  </Button>
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button
                    type="button"
                    onClick={stopCamera}
                    variant="secondary"
                    className="bg-background/80 backdrop-blur"
                  >
                    Batalkan
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Lokasi</Label>
              {location && (
                <Badge variant="secondary">
                  <MapPin className="mr-1 h-3 w-3" />
                  Terekam
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={getLocation}
                disabled={isLocationLoading}
                variant="outline"
                className="flex-1"
              >
                {isLocationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendapatkan Lokasi...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Dapatkan Lokasi Saat Ini
                  </>
                )}
              </Button>

              {location && (
                <div className="flex-1 p-3 border rounded-md bg-muted flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Tambahan</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan situasi, insiden, atau detail penting lainnya..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={submitReport}
            disabled={!isSubmitEnabled}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim Laporan...
              </>
            ) : isOnline ? (
              'Kirim Laporan'
            ) : (
              'Simpan Laporan Offline'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}