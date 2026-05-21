"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";

function deriveInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function TopBar({ title, subtitle, onAvatarClick, onMenuClick, actionLabel }: { title?: string; subtitle?: string; onAvatarClick?: () => void; onMenuClick?: () => void; actionLabel?: string }) {
  const { isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = authLoading || profileLoading;
  const initials = deriveInitials(profile?.name ?? null);

  return (
    <div className="relative z-[100] pt-[54px] px-5 pb-4">
      {/* Main row — hamburger, title, action all vertically centred */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
        </button>
        {title && <h2 className="flex-1 font-sans text-[28px] font-bold text-white leading-none tracking-tight">{title}</h2>}
        <button onClick={onAvatarClick} className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#005FCC] to-[#00C2FF] flex items-center justify-center text-white text-[13px] font-semibold ring-[1.5px] ring-white/60 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none" />
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : (
            initials
          )}
        </button>
      </div>
      {/* Subtitle — below, aligned with title */}
      {subtitle && <p className="text-[12px] text-white/50 ml-[55px] -mt-0.5">{subtitle}</p>}
    </div>
  );
}
