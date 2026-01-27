"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { checkRoleAndRedirect } from "@/app/actions/check-role";

export default function CheckAuthPage() {
  const { status } = useSession(); // Using NextAuth session
  const router = useRouter();
  const [checkStatus, setCheckStatus] = useState("Memeriksa status login...");

  useEffect(() => {
    const initCheck = async () => {
      // 1. Wait for NextAuth session to load
      if (status === "loading") return;

      // 2. If not signed in, kick back to login
      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      // 3. Call Server Action to check DB & Redirect
      setCheckStatus("Sedang mengalihkan...");
      const result = await checkRoleAndRedirect();

      // 4. Handle edge case if redirect didn't happen (e.g. Profile missing)
      if (result?.error) {
        setCheckStatus("Profil tidak ditemukan. Hubungi Admin.");
        // Optional: router.push('/onboarding');
      }
    };

    initCheck();
  }, [status, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-zinc-400 text-sm animate-pulse">{checkStatus}</p>
    </div>
  );
}