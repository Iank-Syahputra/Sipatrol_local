'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Wifi, WifiOff, Loader2, CheckCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useOfflineReports } from '@/hooks/use-offline-reports';
import { useSession } from 'next-auth/react';
import { Combobox } from '@/components/ui/combobox';
import { getReportCategories, getUnitLocations } from '@/actions/report-actions';

export default function CreateReportPage() {
  const router = useRouter();
  const { data: session } = useSession();
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

  // --- STATE & EFFECTS (Sama seperti sebelumnya) ---
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user) {
        try {
          const categoriesData = await getReportCategories();
          setCategories(categoriesData);
          const locationsData = await getUnitLocations(session.user.id as string);
          setLocations(locationsData);
        } catch (error) {
          setCategories([]);
          setLocations([]);
        }
      }
    };
    fetchData();
  }, [session]);

  useEffect(() => {
    const fetchAssignedUnit = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/user/unit');
          if (response.ok) {
            const data = await response.json();
            setAssignedUnit(data.assignedUnit);
            if (!data.assignedUnit) setUnitError('No unit assigned to your account.');
            else setUnitError(null);
          } else setUnitError('Failed to load unit assignment.');
        } catch (error) {
          setUnitError('Connection error while fetching unit.');
        }
      }
    };
    fetchAssignedUnit();
  }, [session]);

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera not supported by browser.');
      return;
    }
    try {
      setIsCameraActive(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!videoRef.current) {
        setIsCameraActive(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch (error: any) {
      setIsCameraActive(false);
      setCameraError('Camera access denied: ' + error.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

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
      fetch(imageData).then(res => res.blob()).then(blob => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImageFile(file);
        setImagePreview(imageData);
        setIsImageCaptured(true);
        stopCamera();
      });
    }
  };

  const clearPhoto = () => {
    setImagePreview(undefined);
    setImageFile(null);
    setIsImageCaptured(false);
    stopCamera();
  };

  // --- LOCATION LOGIC ---
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      return;
    }
    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocationLoading(false);
      },
      (error) => {
        alert('Failed to retrieve GPS coordinates.');
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // --- SUBMIT LOGIC ---
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const submitReport = async () => {
    if (!session?.user) { alert('Authentication required.'); return; }
    if (!isImageCaptured) { alert('Evidence photo is mandatory.'); return; }
    if (!location) { alert('GPS coordinates required.'); return; }
    if (!assignedUnit) { alert('Unit assignment missing.'); return; }
    if (!category || !locationRoom) { alert('Please complete all form fields.'); return; }
    if (!imageFile) { alert('Image file missing.'); return; }

    setIsSubmitting(true);

    try {
      if (!navigator.onLine) throw new Error('OFFLINE_MODE');

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('notes', notes);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('unitId', assignedUnit.id);
      formData.append('categoryId', category);
      formData.append('locationId', locationRoom);
      formData.append('capturedAt', new Date().toISOString());

      const response = await fetch('/api/reports', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(await response.text());

      setShowSuccessPopup(true);

    } catch (error: any) {
      const isNetworkError = error.message === 'OFFLINE_MODE' || error.message.includes('Failed to fetch');
      if (isNetworkError) {
        try {
          await addOfflineReport({
            userId: session.user.id as string,
            unitId: assignedUnit.id,
            imageData: imagePreview,
            notes,
            latitude: location.lat,
            longitude: location.lng,
            categoryId: category,
            locationId: locationRoom,
            capturedAt: new Date().toISOString()
          });
          alert('Offline Mode: Report saved locally.');
          router.push('/security');
        } catch (e) { alert('Failed to save offline report.'); }
      } else {
        alert('Submission failed: ' + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => { stopCamera(); if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const isSubmitEnabled = isImageCaptured && location && assignedUnit && category && locationRoom && !isSubmitting;

  return (
    <div className="w-full px-6 py-8 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border-l-4 border-l-[#00F7FF] shadow-md hover:shadow-lg transition-shadow duration-300">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Report</h1>
          <p className="text-slate-600 font-semibold text-sm mt-1">
            Real-time Field Reporting System
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">{isOnline ? 'SYSTEM ONLINE' : 'OFFLINE MODE'}</span>
        </div>
      </div>

      {unitError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5 text-red-600" /> 
          <span className="text-red-700 font-bold">{unitError}</span>
        </div>
      )}

      {/* --- FORM CONTAINER --- */}
      <Card className="bg-white border-0 shadow-xl overflow-hidden border-t-4 border-t-cyan-400">
        <CardHeader className="border-b border-slate-100 pb-4 bg-white pt-6">
           <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-cyan-600" /> Patrol Form
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8 bg-slate-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* === LEFT COLUMN: CAMERA === */}
            <div className="flex flex-col gap-3 h-full">
               <Label className="text-slate-900 font-extrabold text-base flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center text-xs">1</div>
                 Upload Photo <span className="text-red-500 text-xs"></span>
               </Label>
               
               <div className="flex-1 p-1 rounded-2xl border-2 border-dashed border-cyan-200 bg-white shadow-sm hover:shadow-md hover:border-cyan-400 transition-all duration-300 min-h-[450px] flex flex-col">
                  <div className="flex-1 flex flex-col p-4">
                      {!isImageCaptured && !isCameraActive ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-200 blur-xl opacity-20 rounded-full"></div>
                                <Button
                                type="button"
                                onClick={startCamera}
                                className="relative w-32 h-32 rounded-full bg-white border-4 border-cyan-100 hover:border-cyan-400 hover:scale-105 transition-all shadow-lg flex items-center justify-center group"
                                >
                                    <Camera className="h-12 w-12 text-slate-700 group-hover:text-cyan-600 transition-colors" />
                                </Button>
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-lg font-black text-slate-800">Activate Camera</h3>
                                <p className="text-sm font-semibold text-slate-500">Capture photo directly at location</p>
                            </div>
                        </div>
                      ) : isImageCaptured ? (
                        <div className="relative w-full h-full min-h-[300px] bg-slate-900 rounded-xl overflow-hidden shadow-inner group border-2 border-slate-200">
                          {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <Button onClick={clearPhoto} variant="secondary" className="font-bold shadow-xl border border-white/20 text-slate-900">
                              <RotateCcw className="mr-2 h-4 w-4" /> Retake Photo
                            </Button>
                          </div>
                          <div className="absolute bottom-3 right-3">
                             <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0"><CheckCircle className="w-3 h-3 mr-1" /> Captured</Badge>
                          </div>
                        </div>
                      ) : null}

                      {/* Camera Live View */}
                      <div className={`relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl ring-4 ring-slate-200 ${isCameraActive ? 'block' : 'hidden'}`}>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        {isCameraActive && (
                          <>
                             {/* Overlay Grid */}
                             <div className="absolute inset-0 pointer-events-none opacity-30 grid grid-cols-3 grid-rows-3">
                                 <div className="border-r border-b border-white/30"></div>
                                 <div className="border-r border-b border-white/30"></div>
                                 <div className="border-b border-white/30"></div>
                                 <div className="border-r border-b border-white/30"></div>
                                 <div className="border-r border-b border-white/30"></div>
                                 <div className="border-r border-b border-white/30"></div>
                                 <div className="border-r border-white/30"></div>
                                 <div className="border-r border-white/30"></div>
                                 <div></div>
                             </div>

                             <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-4 z-20">
                                <Button onClick={capturePhoto} className="bg-white hover:bg-slate-200 rounded-full w-20 h-20 shadow-lg border-[6px] border-slate-300 p-0 transform active:scale-95 transition-transform">
                                <div className="w-16 h-16 bg-red-600 rounded-full border-2 border-white"></div>
                                </Button>
                                <Button onClick={stopCamera} size="sm" variant="ghost" className="text-white hover:bg-white/20">Cancel</Button>
                             </div>
                          </>
                        )}
                      </div>
                      
                      {cameraError && (
                          <div className="mt-3 p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg text-center border border-red-200">
                              {cameraError}
                          </div>
                      )}
                  </div>
               </div>
            </div>

            {/* === RIGHT COLUMN: INPUT FORM === */}
            <div className="flex flex-col gap-3 h-full">
               <Label className="text-slate-900 font-extrabold text-base flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center text-xs">2</div>
                 Patrol Information
               </Label>
               
               <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-lg flex flex-col gap-6 h-full hover:border-cyan-200 transition-colors">
                  
                  {/* Category & Location */}
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-700 uppercase tracking-wide">Report Category</Label>
                      <div className="relative group">
                        <Combobox
                            options={categories}
                            value={category}
                            onValueChange={setCategory}
                            placeholder="Select category..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-slate-700 uppercase tracking-wide">Area / Location</Label>
                      <div className="relative group">
                         <Combobox
                            options={locations}
                            value={locationRoom}
                            onValueChange={setLocationRoom}
                            placeholder="Select location..."
                         />
                      </div>
                    </div>
                  </div>

                  {/* GPS Section */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-black text-slate-700 uppercase tracking-wide">GPS Coordinates</Label>
                      {location ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"><CheckCircle className="w-3 h-3 mr-1"/> Locked</Badge>
                      ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-bold">Pending</Badge>
                      )}
                    </div>
                    
                    <Button
                    type="button"
                    onClick={getLocation}
                    disabled={isLocationLoading}
                    variant="outline"
                    className={`w-full h-12 border-2 font-bold ${location ? 'border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                    >
                    {isLocationLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
                    {location ? 'Update Location' : 'Get Current Location'}
                    </Button>
                    
                    {location && (
                        <div className="text-center">
                             <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                             </span>
                        </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 flex-1">
                    <Label className="text-xs font-black text-slate-700 uppercase tracking-wide">Officer Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe incident details or observations..."
                      rows={4}
                      className="bg-white border-2 border-slate-200 focus:border-cyan-500 focus:ring-0 text-slate-800 font-medium resize-none h-full min-h-[120px]"
                    />
                  </div>

                  <div className="pt-2 mt-auto">
                    <Button
                      onClick={submitReport}
                      disabled={!isSubmitEnabled}
                      className={`w-full py-6 text-lg font-black tracking-wide shadow-lg transform transition-all active:scale-[0.98] rounded-xl ${
                          !isSubmitEnabled 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : isOnline 
                              ? 'bg-[#00F7FF] text-slate-900 hover:bg-cyan-400 hover:shadow-cyan-200/50 border-b-4 border-cyan-600 active:border-b-0 active:translate-y-1' 
                              : 'bg-orange-500 text-white border-b-4 border-orange-700 active:border-b-0 active:translate-y-1'
                      }`}
                    >
                      {isSubmitting ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> SENDING DATA...</> : isOnline ? 'SUBMIT REPORT' : 'SAVE OFFLINE'}
                    </Button>
                  </div>

               </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-emerald-400 transform scale-100 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-200">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">SUCCESS!</h2>
            <p className="text-slate-600 font-bold mb-8">Report has been successfully submitted.</p>
            <Button onClick={() => router.push('/security')} className="bg-slate-900 text-white font-bold py-4 px-6 rounded-xl w-full hover:bg-slate-800 shadow-lg border-b-4 border-black active:border-b-0 active:translate-y-1">
              RETURN TO DASHBOARD
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}