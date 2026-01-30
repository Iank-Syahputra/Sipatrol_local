"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Shield, Activity, Map, WifiOff, ChevronRight, Lock, Server, Zap } from "lucide-react";

export default function HomeMobileLightBg() {
  const [activeTab, setActiveTab] = useState<"officer" | "admin">("officer");

  const theme = {
    officer: {
      color: "text-cyan-700",
      borderColor: "border-cyan-200",
      bgSoft: "bg-cyan-50",
      btnBg: "bg-[#00F7FF]",
      btnText: "text-slate-900",
      shadow: "shadow-cyan-500/20",
      gradientTitle: "from-cyan-600 to-blue-600",
      ringFocus: "ring-cyan-100"
    },
    admin: {
      color: "text-amber-700",
      borderColor: "border-amber-200",
      bgSoft: "bg-amber-50",
      btnBg: "bg-[#F59E0B]",
      btnText: "text-white",
      shadow: "shadow-amber-500/20",
      gradientTitle: "from-amber-600 to-orange-700",
      ringFocus: "ring-amber-100"
    }
  };

  const currentTheme = theme[activeTab];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-[#00F7FF] selection:text-black">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/image.jpeg" 
          alt="Facility Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[3px]" />
        <div className={`absolute inset-0 bg-[radial-gradient(at_top_center,var(--tw-gradient-stops))] from-transparent via-transparent to-transparent transition-colors duration-700 pointer-events-none
            ${activeTab === 'officer' ? 'from-cyan-400/10' : 'from-amber-400/10'}`} 
        />
      </div>
      
      {/* --- HEADER --- */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 backdrop-blur-md border border-slate-200 shadow-sm transition-all hover:bg-white/80">
          <Shield className={`h-5 w-5 transition-colors duration-300 ${activeTab === 'officer' ? 'text-cyan-600' : 'text-amber-600'}`} />
          <span className="font-bold text-base tracking-tight text-slate-900">SiPatrol</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/60 px-3 py-1.5 rounded-md border border-slate-200">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
           </span>
           System Operational
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="w-full max-w-[90%] md:max-w-xl px-0 relative z-10 flex flex-col items-center mt-8 md:mt-12">
        
        {/* Title Section */}
        <div className="text-center mb-6 md:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest mb-5 shadow-sm transition-colors duration-300 ${currentTheme.bgSoft} ${currentTheme.borderColor} ${currentTheme.color}`}>
            <Zap className="h-3.5 w-3.5 fill-current" /> PLN Nusantara Power
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight leading-[1.1]">
            Integrated Security <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r transition-all duration-500 ${currentTheme.gradientTitle}`}>
              Management System
            </span>
          </h1>
          
          <p className="text-slate-500 text-xs md:text-base font-medium mt-2 max-w-md mx-auto leading-relaxed">
            Platform for Critical Asset Protection, workforce supervision & real-time HSE compliance reporting.
          </p>
        </div>

        {/* --- UNIFIED CARD --- */}
        <div className={`w-full bg-white backdrop-blur-xl border border-slate-200 rounded-[2rem] p-4 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative transition-all duration-500 ring-1 ${currentTheme.ringFocus} ring-offset-2 ring-offset-slate-50`}>
          
          {/* 1. Toggle Switcher (Security vs Admin) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] mb-8 border border-slate-200/60">
            <button
              onClick={() => setActiveTab("officer")}
              className={`relative flex items-center justify-center gap-2 py-3.5 rounded-[1.2rem] text-xs md:text-sm font-bold transition-all duration-300
                ${activeTab === "officer" 
                  ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-200" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"}`} 
            >
              <Shield className="h-4 w-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`relative flex items-center justify-center gap-2 py-3.5 rounded-[1.2rem] text-xs md:text-sm font-bold transition-all duration-300
                ${activeTab === "admin" 
                  ? "bg-white text-amber-600 shadow-sm ring-1 ring-amber-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"}`}
            >
              <Activity className="h-4 w-4" />
              Admin
            </button>
          </div>

          {/* 2. Dynamic Content Area */}
          <div className="px-2 md:px-4 pb-2 text-center min-h-[220px] flex flex-col justify-between">
            
            <div key={activeTab} className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className={`mb-6 p-5 rounded-2xl border transition-colors duration-300 ${currentTheme.bgSoft} ${currentTheme.borderColor} ${currentTheme.color}`}>
                {activeTab === "officer" ? <Lock className="h-8 w-8 md:h-12 md:w-12" /> : <Server className="h-8 w-8 md:h-12 md:w-12" />}
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
                {/* Judul Card */}
                {activeTab === "officer" ? "Security Personnel Access" : "Administrator Console"}
              </h2>
              
              <p className="text-xs md:text-base text-slate-500 leading-relaxed max-w-[320px] mx-auto font-medium">
                {/* Deskripsi Card - Technical Copywriting */}
                {activeTab === "officer" 
                  ? "Authenticate to execute patrol beats, report Unsafe Action/Condition (UA/UC), and ensure area sterility."
                  : "Centralized dashboard for situational awareness, personnel management, and operational analytics."}
              </p>
            </div>

            {/* 3. Action Button */}
            <Link
              href={activeTab === "officer" ? "/login?role=officer" : "/login?role=admin"}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] hover:scale-[1.01] shadow-lg
                ${currentTheme.btnBg} ${currentTheme.btnText} ${currentTheme.shadow} hover:opacity-90`}
            >
              {/* Tombol Login */}
              {activeTab === "officer" ? "Security Login" : "Admin Login"} <ChevronRight className="h-5 w-5 stroke-[3]" />
            </Link>

          </div>
        </div>

        {/* --- FOOTER FEATURES --- */}
        <div className="mt-8 md:mt-12 w-full grid grid-cols-3 gap-4 md:gap-8 opacity-75">
           <div className="flex flex-col items-center text-center gap-2 group cursor-default">
             <div className={`p-2 rounded-full bg-white/50 border border-transparent group-hover:border-slate-200 transition-colors`}>
                 <Map className={`h-5 w-5 ${currentTheme.color}`} />
             </div>
             <span className="text-[10px] md:text-xs text-slate-600 font-bold uppercase tracking-widest">GPS Tracking</span>
           </div>
           <div className="flex flex-col items-center text-center gap-2 group cursor-default">
             <div className={`p-2 rounded-full bg-white/50 border border-transparent group-hover:border-slate-200 transition-colors`}>
                 <WifiOff className={`h-5 w-5 ${currentTheme.color}`} />
             </div>
             <span className="text-[10px] md:text-xs text-slate-600 font-bold uppercase tracking-widest">Offline Mode</span>
           </div>
           <div className="flex flex-col items-center text-center gap-2 group cursor-default">
             <div className={`p-2 rounded-full bg-white/50 border border-transparent group-hover:border-slate-200 transition-colors`}>
                 <Lock className={`h-5 w-5 ${currentTheme.color}`} />
             </div>
             <span className="text-[10px] md:text-xs text-slate-600 font-bold uppercase tracking-widest">Encrypted</span>
           </div>
        </div>

      </div>
    </main>
  );
}