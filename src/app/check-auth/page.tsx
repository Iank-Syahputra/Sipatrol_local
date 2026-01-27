"use client";

import { useEffect, useState } from "react";
// Import for authentication will be handled by NextAuth
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { checkRoleAndRedirect } from "@/app/actions/check-role";

export default function CheckAuthPage() {
  // TODO: Replace with NextAuth session check once implemented
  // const { status } = useSession(); // Will be used once NextAuth is implemented
  const isLoaded = true; // Placeholder - will be replaced with actual session check
  const isSignedIn = true; // Placeholder - will be replaced with actual session check
  const router = useRouter();
  const [status, setStatus] = useState("Memeriksa status login...");

  useEffect(() => {
    const initCheck = async () => {
      // 1. Wait for Clerk to load
      if (!isLoaded) return;

      // 2. If not signed in, kick back to login
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      // 3. Call Server Action to check DB & Redirect
      setStatus("Sedang mengalihkan...");
      const result = await checkRoleAndRedirect();

      // 4. Handle edge case if redirect didn't happen (e.g. Profile missing)
      if (result?.error) {
        setStatus("Profil tidak ditemukan. Hubungi Admin.");
        // Optional: router.push('/onboarding');
      }
    };

    initCheck();
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-zinc-400 text-sm animate-pulse">{status}</p>
    </div>
  );
}