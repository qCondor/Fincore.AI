"use client";

import { ReactNode } from "react";
import BottomNav from "./BottomNav";

export default function PhoneFrame({
  children,
  statusLight = false,
  showNav = false,
  activeTab = "home",
  onTabChange,
  hasOceanScores = true,
}: {
  children: ReactNode;
  statusLight?: boolean;
  showNav?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  hasOceanScores?: boolean;
}) {
  return (
    <div className="relative w-[393px] h-[852px] rounded-[54px] bg-surface overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_20px_60px_rgba(0,0,0,0.15),0_0_0_11px_#1D1D1F,0_0_0_13px_#3A3A3C]">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-[#1D1D1F] rounded-b-[24px] z-[60]" />

      {/* Status bar */}
      <div
        className={`absolute top-0 inset-x-0 h-[54px] flex items-center justify-between px-8 z-[55] text-[15px] font-semibold font-sans ${
          statusLight ? "text-white" : "text-text-primary"
        }`}
      >
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
            <rect x="0" y="7" width="3" height="5" rx="0.5" />
            <rect x="4.5" y="4" width="3" height="8" rx="0.5" />
            <rect x="9" y="1.5" width="3" height="10.5" rx="0.5" />
            <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" opacity="0.3" />
          </svg>
          <svg width="24" height="12" viewBox="0 0 24 12" fill="currentColor">
            <rect x="0" y="0" width="21" height="12" rx="2.5" stroke="currentColor" strokeWidth="1" fill="none" />
            <rect x="22" y="3.5" width="2" height="5" rx="1" />
            <rect x="1.5" y="1.5" width="14" height="9" rx="1.5" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="h-full w-full overflow-y-auto no-scrollbar">
        {children}
      </div>

      {/* Bottom Nav */}
      {showNav && <BottomNav activeTab={activeTab} onTabChange={onTabChange} hasOceanScores={hasOceanScores} />}
    </div>
  );
}

