'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Wifi, WifiOff, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
import { useOfflineReports } from '@/hooks/use-offline-reports';
import { useSession } from 'next-auth/react';
import { Combobox } from '@/components/ui/combobox';
import { getReportCategories, getUnitLocations } from '@/actions/report-actions';

export default function CreateReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addOfflineReport } = useOfflineReports();
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [locationRoom, setLocationRoom] = useState<string>('');
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. UPDATE STATE & EFFECT (Inside Component)
  useEffect(() => {
    // Check status immediately on mount
    setIsOnline(navigator.onLine);

    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Fetch categories and locations on component mount using server actions
  useEffect(() => {
    const fetchData = async () => {
      if (session?.user) {
        try {
          // Fetch report categories
          const categoriesData = await getReportCategories();
          setCategories(categoriesData);

          // Fetch unit locations for the user's assigned unit
          const locationsData = await getUnitLocations(session.user.id as string);
          setLocations(locationsData);
        } catch (error) {
          console.error('Error fetching dropdown data:', error);
          // Set empty arrays if there's an error
          setCategories([]);
          setLocations([]);
        }
      }
    };

    fetchData();
  }, [session]);

  // Fetch user's assigned unit on component mount
  useEffect(() => {
    const fetchAssignedUnit = async () => {
      if (session?.user) {
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
  }, [session]);

  // Initialize camera with simplified approach to fix DOM timing issue
  const startCamera = async () => {
    console.log('🎬 startCamera() called');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ Browser does not support mediaDevices');
      setCameraError('Browser Anda tidak mendukung akses kamera. Silakan gunakan browser yang kompatibel.');
      setTimeout(() => setCameraError(null), 5000);
      return;
    }

    try {
      console.log('📹 Requesting camera access...');

      // First, set camera as active to show the video element
      setIsCameraActive(true);

      // Small delay to ensure video element is in DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        console.error('❌ videoRef.current is still null after delay');
        setCameraError('Gagal menginisialisasi tampilan kamera. Silakan coba lagi.');
        setIsCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });

      console.log('✅ Camera stream obtained successfully:', stream);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      console.log('✅ Camera is now active!');

    } catch (error: any) {
      console.error('❌ Error accessing camera:', error);
      setIsCameraActive(false); // Reset state on error

      let errorMessage = 'Tidak dapat mengakses kamera.';

      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Izin akses kamera ditolak. Harap aktifkan izin kamera di pengaturan browser Anda.';
          break;
        case 'NotFoundError':
          errorMessage = 'Perangkat kamera tidak ditemukan pada perangkat ini.';
          break;
        case 'NotReadableError':
          errorMessage = 'Kamera sedang digunakan oleh aplikasi lain.';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Kamera tidak mendukung konfigurasi yang diminta.';
          break;
        case 'SecurityError':
          errorMessage = 'Akses kamera diblokir karena alasan keamanan. Pastikan Anda menggunakan HTTPS.';
          break;
        default:
          errorMessage += ` Detail: ${error.message || 'Kesalahan tidak diketahui'}`;
      }

      setCameraError(errorMessage);
      setTimeout(() => setCameraError(null), 5000);
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
      
      // Convert data URL to File object
      fetch(imageData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImageFile(file);
          setImagePreview(imageData);
          setIsImageCaptured(true);
          stopCamera();
        });
    }
  };


  // Clear the current photo and return to selection mode
  const clearPhoto = () => {
    setImagePreview(undefined);
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

  // 2. UPDATE SUBMIT FUNCTION (Try-Catch Pattern)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const submitReport = async () => {
    // ... (Keep Validation Checks: session, image, location, etc. same as before) ...
    if (!session?.user) { alert('Anda harus masuk untuk mengirim laporan'); return; }
    if (!isImageCaptured) { alert('Silakan ambil foto sebelum mengirim'); return; }
    if (!location) { alert('Silakan dapatkan lokasi Anda sebelum mengirim'); return; }
    if (!assignedUnit) { alert('Anda tidak ditugaskan ke unit manapun. Hubungi administrator untuk mendapatkan penugasan unit.'); return; }
    if (!category) { alert('Silakan pilih kategori laporan sebelum mengirim'); return; }
    if (!locationRoom) { alert('Silakan pilih lokasi/ruangan dari unit Anda sebelum mengirim'); return; }
    if (!imageFile) { alert('Tidak ada file gambar ditemukan'); return; }

    setIsSubmitting(true);

    try {
      // 1. Check Offline Status First
      if (!navigator.onLine) {
        throw new Error('OFFLINE_MODE');
      }

      // Prepare Data
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('notes', notes);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('unitId', assignedUnit.id);
      // Note: userId is not sent in form data as it's retrieved from session on the server
      formData.append('categoryId', category);
      formData.append('locationId', locationRoom);

      // TAMBAHAN WAJIB (FIX ERROR MISSING FIELDS):
      formData.append('capturedAt', new Date().toISOString());

      // Attempt Upload
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      // 2. Handle Server Errors Explicitly
      if (!response.ok) {
        const errorText = await response.text();
        // Throw with a special prefix to identify it's a server error, not network
        throw new Error(`SERVER_ERROR: ${errorText || response.statusText}`);
      }

      // Success Online - Show success popup instead of alert
      setShowSuccessPopup(true);

    } catch (error: any) {
      console.error('Submission Error:', error);

      // 3. Smart Error Handling
      // Only go to Offline Mode if it's actually a network issue or forced offline
      const isNetworkError = error.message === 'OFFLINE_MODE' ||
                             error.message.includes('Failed to fetch') ||
                             error.message.includes('NetworkError');

      if (isNetworkError) {
        console.warn('Network issue detected, switching to offline save...');
        try {
          await addOfflineReport({
            userId: session.user.id as string, // Still needed for offline storage
            unitId: assignedUnit.id,
            imageData: imagePreview,
            notes,
            latitude: location.lat,
            longitude: location.lng,
            categoryId: category,
            locationId: locationRoom,
            capturedAt: new Date().toISOString()
          });

          alert('Mode Offline: Internet tidak stabil. Laporan DISIMPAN di perangkat.');
          router.push('/security');
        } catch (offlineError) {
          console.error('Critical Error:', offlineError);
          alert('Gagal menyimpan laporan (Storage Error).');
        }
      } else {
        // 4. It is a Server/Logic Error -> Show the REAL reason
        // Strip the "SERVER_ERROR: " prefix for cleaner alert
        const cleanMsg = error.message.replace('SERVER_ERROR: ', '');
        alert(`Gagal mengirim laporan: ${cleanMsg}`);
      }
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
  const isSubmitEnabled = isImageCaptured && location && assignedUnit && category && locationRoom && !isSubmitting;

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
          {cameraError && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {cameraError}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Only Selection */}
          <div className="space-y-2">
            <Label>Foto Bukti (Wajib Kamera)</Label> {/* Updated Label */}
            {!isImageCaptured && !isCameraActive ? (
              <div className="w-full"> {/* Changed from grid to full width */}
                <Button
                  type="button"
                  onClick={startCamera}
                  variant="outline"
                  className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-zinc-700 hover:border-blue-500 hover:bg-zinc-800/50 transition-all"
                >
                  <div className="bg-zinc-800 p-4 rounded-full mb-3">
                     <Camera className="h-8 w-8 text-blue-500" />
                  </div>
                  <span className="font-medium text-lg">Buka Kamera</span>
                  <span className="text-sm text-muted-foreground mt-1">Ambil foto langsung di lokasi</span>
                </Button>

                {/* GALLERY BUTTON & INPUT REMOVED */}
              </div>
            ) : isImageCaptured ? (
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
            ) : null}

            {/* Camera View - Always render video element but control visibility */}
            <div className={`relative aspect-video bg-muted rounded-lg overflow-hidden mt-4 ${isCameraActive ? 'block' : 'hidden'}`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {isCameraActive && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center"
                    >
                      <div className="w-12 h-12 bg-white rounded-full"></div>
                    </Button>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                    <Button
                      type="button"
                      onClick={stopCamera}
                      variant="secondary"
                      className="bg-background/80 backdrop-blur"
                    >
                      Batalkan
                    </Button>
                  </div>
                </>
              )}
            </div>
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

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori Laporan</Label>
            <Combobox
              options={categories}
              value={category}
              onValueChange={setCategory}
              placeholder="Pilih kategori..."
              emptyMessage="Kategori tidak ditemukan."
            />
          </div>

          {/* Location Room Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="locationRoom">Lokasi/Ruangan</Label>
            <Combobox
              options={locations}
              value={locationRoom}
              onValueChange={setLocationRoom}
              placeholder="Pilih lokasi/ruangan..."
              emptyMessage="Lokasi tidak ditemukan."
            />
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-emerald-400/30 transform transition-all duration-300 scale-100">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Laporan Terkirim!</h2>
            <p className="text-emerald-100 mb-6">
              Laporan keamanan Anda telah berhasil dikirim dan sedang diproses.
            </p>

            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <p className="text-white text-sm font-medium">Ringkasan Laporan:</p>
              <p className="text-emerald-100 text-xs mt-1">
                Kategori: {categories.find(c => c.value === category)?.label || 'Tidak diketahui'}
              </p>
              <p className="text-emerald-100 text-xs">
                Lokasi: {locations.find(l => l.value === locationRoom)?.label || 'Tidak diketahui'}
              </p>
            </div>

            <Button
              onClick={() => router.push('/security')}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold py-3 px-6 rounded-xl w-full transition-all duration-300 hover:scale-[1.02]"
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}