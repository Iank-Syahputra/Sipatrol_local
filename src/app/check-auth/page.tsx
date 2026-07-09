"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { checkRoleAndRedirect } from "@/app/actions/check-role";

export default function CheckAuthPage() {
  const router = useRouter();
  const [checkStatus, setCheckStatus] = useState("Memeriksa status login...");

  useEffect(() => {
    const initCheck = async () => {
      const result = await checkRoleAndRedirect();
      if (result?.error) {
        if (result.error === "Not Authenticated") {
          router.push("/login");
        } else {
          setCheckStatus("Profil tidak ditemukan. Hubungi Admin.");
        }
      }
    };
    initCheck();
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-zinc-400 text-sm animate-pulse">{checkStatus}</p>
    </div>
  );
}
