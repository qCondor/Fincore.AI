"use client";

export default function BottomNav({ activeTab = "home", onTabChange, hasOceanScores = true }: { activeTab?: string; onTabChange?: (tab: string) => void; hasOceanScores?: boolean }) {
  return (
    <div className="absolute bottom-0 inset-x-0 z-[999] pb-5 pt-2 px-5">
      <div className="h-[70px] rounded-[32px] bg-black/25 backdrop-blur-[40px] saturate-[180%] border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center justify-around px-2">
        <NavTab icon="profile" label="Profile" active={activeTab === "home"} onClick={() => onTabChange?.("home")} />
        <NavTab icon={hasOceanScores ? "faith" : "locked"} label={hasOceanScores ? "Faith" : "Locked"} active={activeTab === "faith"} onClick={() => onTabChange?.("faith")} />
        <NavTab icon="feels" label="Feels Like" active={activeTab === "feels"} onClick={() => onTabChange?.("feels")} />
        <NavTab icon="banking" label="Banking" active={activeTab === "banking"} onClick={() => onTabChange?.("banking")} />
        <NavTab icon="analytics" label="Analytics" active={activeTab === "analytics"} onClick={() => onTabChange?.("analytics")} />
      </div>
    </div>
  );
}

function NavTab({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex-1 h-[58px] mx-[3px] flex flex-col items-center justify-center cursor-pointer rounded-[26px] transition-all duration-300 ${active ? "bg-white/15 animate-tab-pop" : "hover:bg-white/5 scale-100"}`}>
      <div className="text-white">
        {icon === "profile" && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.8-3 6.2V17H8v-1.8C6.3 13.8 5 11.5 5 9a7 7 0 017-7z" />
            <path d="M9 21h6" />
            <path d="M10 17v4" />
            <path d="M14 17v4" />
            <path d="M9 10c1 1 2.5 1.5 3 1.5s2-.5 3-1.5" />
          </svg>
        )}
        {icon === "faith" && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
        {icon === "feels" && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="5" y="5" width="3" height="3" rx="0.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="16" y="5" width="3" height="3" rx="0.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="5" y="16" width="3" height="3" rx="0.5" />
            <rect x="14" y="14" width="3" height="3" rx="0.5" opacity="0.7" />
            <rect x="18" y="14" width="3" height="3" rx="0.5" opacity="0.5" />
            <rect x="14" y="18" width="3" height="3" rx="0.5" opacity="0.5" />
            <rect x="18" y="18" width="3" height="3" rx="0.5" opacity="0.7" />
          </svg>
        )}
        {icon === "banking" && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="1" y="4" width="22" height="16" rx="2.5" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        )}
        {icon === "analytics" && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        )}
        {icon === "locked" && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        )}
      </div>
      <span className={`text-[9px] font-semibold mt-0.5 ${icon === "locked" ? "text-white/50" : "text-white"}`}>{label}</span>
    </div>
  );
}
