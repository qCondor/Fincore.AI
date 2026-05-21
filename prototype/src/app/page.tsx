"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useScan } from "@/hooks/useScan";
import type { AnalysisResult } from "@/hooks/useScan";
import { useChatHistory, groupSessionsByDate, type ChatSession } from "@/hooks/useChatHistory";
import ICloudBackground from "@/components/ICloudBackground";
import TopBar from "@/components/TopBar";
import ChatScreen from "@/components/ChatScreen";
import { SkeletonFinancialHealth, SkeletonProcessingPreview, Skeleton } from "@/components/Skeleton";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { questions, traitColors, traitDescriptions } from "@/lib/questions";
import { Camera, ChevronDown, Lock, Mail, PenLine, Shield, Check, ArrowRight, Flashlight, User, Bell, CreditCard, HelpCircle, LogOut, ChevronRight, Settings, X, Send, Paperclip, Sparkles, Mic, ThumbsUp, ThumbsDown, Star, Home as HomeIcon, QrCode, BarChart3, Landmark, Brain, MessageCircle, ShoppingBag, Lightbulb } from "lucide-react";
import { Haptics } from "@/lib/haptics";

type Screen =
  | "splash"
  | "login-1" | "login-2" | "login-3" | "login-4"
  | "info"
  | `q${number}`
  | "processing"
  | "results"
  | "profile"
  | "user-profile"
  | "faith"
  | "scan"
  | "scan-result"
  | "scan-result-pro"
  | "banking"
  | "analytics"
  | "brand-asset";

const loginSlides = ["login-1", "login-2", "login-3", "login-4"] as const;


export default function Home() {
  const { user, setHasCompletedOnboarding } = useAuth();
  const { profile, updateProfile } = useProfile();

  // Derive initials from profile name
  const deriveInitials = (name: string | null): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  const userInitials = deriveInitials(profile?.name ?? null);

  // DEV MODE: Skip onboarding and go straight to main app
  const DEV_SKIP_ONBOARDING = true;

  const [screen, setScreen] = useState<Screen>(DEV_SKIP_ONBOARDING ? "scan" : "splash");
  const [prevScreen, setPrevScreen] = useState<Screen>(DEV_SKIP_ONBOARDING ? "scan" : "splash");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{ questionNum: number } | null>(null);
  const [openTraits, setOpenTraits] = useState<Set<string>>(new Set());
  const [faithFocused, setFaithFocused] = useState(false);
  const [scanFocused, setScanFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerX, setDrawerX] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [drawerSearchOpen, setDrawerSearchOpen] = useState(false);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState("");
  const [drawerSkipAnim, setDrawerSkipAnim] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAnimating, setProfileAnimating] = useState(false);
  const [drawerSource, setDrawerSource] = useState<"faith" | "scan" | "profile">("scan");
  const [scanTab, setScanTab] = useState(0);
  const [priceEditing, setPriceEditing] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState(false);
  const [altTab, setAltTab] = useState(0);
  const [navExpanded, setNavExpanded] = useState(false);
  const [profilePage, setProfilePage] = useState(0);
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; feature: 'banking' | 'analytics' | 'blueprint' | null }>({ open: false, feature: null });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const scan = useScan();
  const { psychologyCost, fetchPsychologyCost } = scan;
  const [scanAnalysis, setScanAnalysis] = useState<AnalysisResult | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanPrice, setScanPrice] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");

  // OCEAN scoring state - DEV: pre-populate with mock scores when skipping onboarding
  const [oceanScores, setOceanScores] = useState<Record<string, number> | null>(
    DEV_SKIP_ONBOARDING ? { openness: 72, conscientiousness: 58, extraversion: 65, agreeableness: 71, neuroticism: 38 } : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dynamic insights state
  const [faithInsights, setFaithInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Personal Info form state
  const [infoForm, setInfoForm] = useState({ name: "", email: "", dob: "", phone: "" });

  // Emotional tax state
  const [emotionalTax, setEmotionalTax] = useState<{ total_tax: number; scan_count: number } | null>(null);
  const [emotionalTaxLoading, setEmotionalTaxLoading] = useState(false);

  // Scan context to pass to Faith chat
  const [pendingScanContext, setPendingScanContext] = useState<{
    scan_id: string;
    product_name?: string;
    overall_score?: number;
    estimated_price?: number;
    psychology_cost?: number;
    verdict?: string;
  } | null>(null);

  // Chat history state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const chatHistory = useChatHistory();

  // Filter sessions by search query
  const filteredSessions = drawerSearchQuery.trim()
    ? chatHistory.sessions.filter(s =>
        s.title.toLowerCase().includes(drawerSearchQuery.toLowerCase()) ||
        s.first_message_preview.toLowerCase().includes(drawerSearchQuery.toLowerCase())
      )
    : chatHistory.sessions;
  const groupedSessions = groupSessionsByDate(filteredSessions);

  // Handler for selecting a session from history
  const handleSelectSession = useCallback((session: ChatSession) => {
    setActiveSessionId(session.session_id);
    setDrawerOpen(false);
    setDrawerSearchOpen(false);
    setDrawerSearchQuery("");
  }, []);

  // Handler for starting a new chat
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setDrawerOpen(false);
    setDrawerSearchOpen(false);
    setDrawerSearchQuery("");
  }, []);

  // Handler when chat creates a new session
  const handleChatNewSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    // Refresh history to include the new session
    chatHistory.refresh();
  }, [chatHistory.refresh]);

  const go = (s: Screen) => { setPrevScreen(screen); setScreen(s); };
  const goFromNav = (s: Screen) => { setNavExpanded(true); go(s); setTimeout(() => setNavExpanded(false), 600); };

  // Helper to check if user has completed the OCEAN quiz
  const hasOceanScores = !!(profile?.big_five && Object.keys(profile.big_five).length > 0);

  // Guarded navigation for Faith - redirects to quiz if no OCEAN scores
  const goToFaith = () => {
    if (!hasOceanScores) {
      go("q1");
      return;
    }
    go("faith");
  };

  const goToFaithFromNav = () => {
    if (!hasOceanScores) {
      setNavExpanded(true);
      go("q1");
      setTimeout(() => setNavExpanded(false), 600);
      return;
    }
    goFromNav("faith");
  };

  useEffect(() => {
    if (screen === "scan") {
      scan.startCamera();
    } else {
      scan.stopCamera();
    }
  }, [screen, scan.startCamera, scan.stopCamera]);

  // Auto-redirect from splash to login after 2.5 seconds
  useEffect(() => {
    if (screen === "splash") {
      const timer = setTimeout(() => go("login-1"), 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Guard Faith screen - redirect to quiz if no OCEAN scores
  useEffect(() => {
    if (DEV_SKIP_ONBOARDING) return; // Skip guard in dev mode
    if (screen === "faith" && (!profile?.big_five || Object.keys(profile.big_five).length === 0)) {
      go("q1");
    }
  }, [screen, profile]);

  useEffect(() => {
    if (DEV_SKIP_ONBOARDING) return; // Skip onboarding redirect in dev mode
    const onboardingScreens = new Set([
      "splash", "login-1", "login-2", "login-3", "login-4", "info", "processing", "results",
      ...Array.from({ length: 15 }, (_, i) => `q${i + 1}`)
    ]);

    if (user && !user.hasCompletedOnboarding && !onboardingScreens.has(screen)) {
      go("login-1");
    }
  }, [user, screen]);

  // Quiz persistence: Load saved answers on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('fincore_quiz_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if we have actual answers and user hasn't completed onboarding
        if (parsed.answers && Object.keys(parsed.answers).length > 0 && !user?.hasCompletedOnboarding) {
          const lastQuestion = Math.max(...Object.keys(parsed.answers).map(Number));
          setSavedProgress({ questionNum: lastQuestion + 1 });
          setShowResumePrompt(true);
        }
      }
    } catch (e) {
      console.warn('[Fincore] Failed to restore quiz progress:', e);
    }
  }, [user?.hasCompletedOnboarding]);

  // Quiz persistence: Save answers on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (Object.keys(selectedAnswers).length > 0) {
      try {
        localStorage.setItem('fincore_quiz_progress', JSON.stringify({
          answers: selectedAnswers,
          timestamp: Date.now(),
          userId: user?.id
        }));
      } catch (e) {
        console.warn('[Fincore] Failed to save quiz progress:', e);
      }
    }
  }, [selectedAnswers, user?.id]);

  // Fetch personalized insights when OCEAN scores are available
  useEffect(() => {
    if (profile?.big_five && user?.id && !faithInsights) {
      setInsightsLoading(true);
      fetch(`/api/profile/${user.id}/insights`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.insights) setFaithInsights(data.insights);
        })
        .catch(() => {})
        .finally(() => setInsightsLoading(false));
    }
  }, [profile?.big_five, user?.id, faithInsights]);

  // Pre-populate Personal Info form when profile loads
  useEffect(() => {
    if (profile?.name) {
      setInfoForm(prev => ({ ...prev, name: profile.name ?? "" }));
    }
    if (profile?.email) {
      setInfoForm(prev => ({ ...prev, email: profile.email ?? "" }));
    }
  }, [profile]);

  // Fetch emotional tax data when on profile screen
  useEffect(() => {
    if (screen === "profile" && user?.id && hasOceanScores && !emotionalTax) {
      setEmotionalTaxLoading(true);
      fetch(`/api/users/${user.id}/emotional-tax`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && typeof data.total_tax === "number") {
            setEmotionalTax({ total_tax: data.total_tax, scan_count: data.scan_count });
          }
        })
        .catch(() => {})
        .finally(() => setEmotionalTaxLoading(false));
    }
  }, [screen, user?.id, hasOceanScores, emotionalTax]);

  return (
    <div id="app-root" className="relative overflow-hidden bg-[#0a1628]">
      <ICloudBackground />

      {/* Quiz Resume Prompt Modal */}
          {showResumePrompt && savedProgress && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="liquid-glass rounded-[24px] p-6 max-w-[300px] text-center">
                <h3 className="text-[18px] font-bold text-white mb-2">Welcome Back!</h3>
                <p className="text-[14px] text-white/60 mb-4">
                  You have a quiz in progress (Question {savedProgress.questionNum}/15).
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      localStorage.removeItem('fincore_quiz_progress');
                      setSelectedAnswers({});
                      setShowResumePrompt(false);
                      setSavedProgress(null);
                      go('q1');
                    }}
                    className="flex-1 h-11 rounded-2xl bg-white/10 text-white text-[14px] font-semibold"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem('fincore_quiz_progress');
                      if (saved) {
                        const parsed = JSON.parse(saved);
                        setSelectedAnswers(parsed.answers);
                        const lastQuestion = Math.max(...Object.keys(parsed.answers).map(Number));
                        if (lastQuestion < 15) {
                          go(`q${lastQuestion + 1}` as Screen);
                        } else {
                          go('processing');
                        }
                      }
                      setShowResumePrompt(false);
                      setSavedProgress(null);
                    }}
                    className="flex-1 h-11 rounded-2xl bg-primary text-white text-[14px] font-semibold"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SPLASH */}
          {screen === "splash" && (
            <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
              <BlueWaveBg id="splash" animated />
              <div className="z-10 flex items-center overflow-hidden">
                <span className="font-sans text-[52px] font-bold text-white tracking-tight uppercase splash-reveal leading-none">FINCORE</span>
                <span className="font-sans text-[52px] font-bold tracking-tight uppercase splash-reveal-dot leading-none splash-ai-gloss ml-[6px]">AI</span>
              </div>
              <p className="mt-3 text-[15px] text-white/50 z-10 tracking-normal splash-tagline">Reframe your financial decisions</p>
              <div className="w-[60px] h-[1px] bg-white/25 z-10 mt-4 splash-tagline" />
              <p className="mt-3 text-[13px] text-white/35 z-10 tracking-widest uppercase splash-tagline">Make it count</p>
            </div>
          )}

          {screen === "brand-asset" && (
            <div className="h-full flex flex-col relative overflow-hidden bg-[#f2f2f7]">
              <div className="safe-top px-5 pb-3">
                <h2 className="font-sans text-[24px] font-bold text-[#1c1c1e] tracking-tight">Brand Assets</h2>
                <p className="text-[13px] text-[#8e8e93] mt-0.5">Download assets for use across platforms</p>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-6 space-y-5">
                {/* App Icon */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col items-center">
                  <div className="w-[120px] h-[120px] rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(10,111,232,0.3)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/fincore-logo.svg" alt="Fincore App Icon" width={120} height={120} className="block w-full h-full" />
                  </div>
                  <p className="text-[16px] font-semibold text-[#1c1c1e] tracking-tight mt-3">App Icon</p>
                  <p className="text-[12px] text-[#8e8e93]">Full colour with FAI text</p>
                  <div className="flex gap-2.5 mt-3">
                    <a href="/fincore-logo.svg" download="fincore-logo.svg" className="px-4 py-2 rounded-full bg-[#0A6FE8] text-white text-[12px] font-semibold shadow-sm hover:brightness-110 transition-all">SVG</a>
                    <button onClick={() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d'); if (!x) return; const i = new Image(); i.onload = () => { x.drawImage(i, 0, 0, 1024, 1024); const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'fincore-logo.png'; a.click(); }; i.src = '/fincore-logo.svg'; }} className="px-4 py-2 rounded-full bg-white text-[#0A6FE8] text-[12px] font-semibold shadow-sm border border-[#e5e5ea] hover:bg-[#f5f5f7] transition-all cursor-pointer">PNG</button>
                  </div>
                </div>

                {/* Alternate Logo — White F */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col items-center">
                  <div className="w-[120px] h-[120px] rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(10,111,232,0.3)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/fincore-logo-white.svg" alt="Fincore White F Logo" width={120} height={120} className="block w-full h-full" />
                  </div>
                  <p className="text-[16px] font-semibold text-[#1c1c1e] tracking-tight mt-3">Alternate Logo</p>
                  <p className="text-[12px] text-[#8e8e93]">White F mark</p>
                  <div className="flex gap-2.5 mt-3">
                    <a href="/fincore-logo-white.svg" download="fincore-logo-white.svg" className="px-4 py-2 rounded-full bg-[#0A6FE8] text-white text-[12px] font-semibold shadow-sm hover:brightness-110 transition-all">SVG</a>
                    <button onClick={() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const x = c.getContext('2d'); if (!x) return; const i = new Image(); i.onload = () => { x.drawImage(i, 0, 0, 1024, 1024); const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'fincore-logo-white.png'; a.click(); }; i.src = '/fincore-logo-white.svg'; }} className="px-4 py-2 rounded-full bg-white text-[#0A6FE8] text-[12px] font-semibold shadow-sm border border-[#e5e5ea] hover:bg-[#f5f5f7] transition-all cursor-pointer">PNG</button>
                  </div>
                </div>

                {/* Background */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col items-center">
                  <div className="w-full h-[100px] rounded-[16px] overflow-hidden shadow-[0_4px_16px_rgba(10,111,232,0.2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/fincore-background.svg" alt="Fincore Background" width={320} height={100} className="block w-full h-full object-cover" />
                  </div>
                  <p className="text-[16px] font-semibold text-[#1c1c1e] tracking-tight mt-3">Background</p>
                  <p className="text-[12px] text-[#8e8e93]">1920x1080 for social media</p>
                  <div className="flex gap-2.5 mt-3">
                    <a href="/fincore-background.svg" download="fincore-background.svg" className="px-4 py-2 rounded-full bg-[#0A6FE8] text-white text-[12px] font-semibold shadow-sm hover:brightness-110 transition-all">SVG</a>
                    <button onClick={() => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d'); if (!x) return; const i = new Image(); i.onload = () => { x.drawImage(i, 0, 0, 1920, 1080); const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'fincore-background.png'; a.click(); }; i.src = '/fincore-background.svg'; }} className="px-4 py-2 rounded-full bg-white text-[#0A6FE8] text-[12px] font-semibold shadow-sm border border-[#e5e5ea] hover:bg-[#f5f5f7] transition-all cursor-pointer">PNG</button>
                  </div>
                </div>

                {/* Typography */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <p className="text-[16px] font-semibold text-[#1c1c1e] tracking-tight mb-3">Typography</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">Display / Headings</p>
                      <p className="text-[22px] font-bold text-[#1c1c1e] tracking-tight" style={{ fontFamily: "SF Pro Display, -apple-system, BlinkMacSystemFont, Helvetica Neue, sans-serif" }}>SF Pro Display</p>
                      <p className="text-[12px] text-[#8e8e93] mt-0.5">Weights: Bold (700), Semibold (600)</p>
                    </div>
                    <div className="border-t border-[#e5e5ea] pt-3">
                      <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">Body / UI Text</p>
                      <p className="text-[18px] font-medium text-[#1c1c1e]" style={{ fontFamily: "SF Pro Text, -apple-system, BlinkMacSystemFont, Helvetica Neue, sans-serif" }}>SF Pro Text</p>
                      <p className="text-[12px] text-[#8e8e93] mt-0.5">Weights: Medium (500), Regular (400)</p>
                    </div>
                    <div className="border-t border-[#e5e5ea] pt-3">
                      <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">Fallback Stack</p>
                      <p className="text-[13px] text-[#1c1c1e] font-mono bg-[#f2f2f7] rounded-lg px-3 py-2">-apple-system, BlinkMacSystemFont, &quot;Helvetica Neue&quot;, sans-serif</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGIN SLIDES */}
          {loginSlides.map((slideId, slideIdx) => (
            screen === slideId && (
              <div key={slideId} className="h-full relative overflow-y-auto overflow-x-hidden">
                <BlueWaveBg id="login" animated />
                <div className="absolute top-[58px] inset-x-4 flex gap-1 z-50 pointer-events-auto">
                  {loginSlides.map((_, i) => (
                    <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden cursor-pointer" onClick={() => go(loginSlides[i])}>
                      <div className={`h-full bg-white rounded-full ${i < slideIdx ? "w-full" : i === slideIdx ? "story-filling" : "w-0"}`} />
                    </div>
                  ))}
                </div>
                <div className="relative z-10 flex flex-col h-full px-4" style={{ paddingTop: 'calc(80px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
                  {slideIdx < 3 ? (
                    <>
                      <h1 className="font-sans text-[28px] font-bold text-white leading-[1.15] tracking-tight mb-3">
                        {slideIdx === 0 && <>Psychological<br />Profile</>}
                        {slideIdx === 1 && "Meet Faith"}
                        {slideIdx === 2 && <>Feels Like<br />Pricing</>}
                      </h1>
                      <p className="text-[17px] text-white/65 leading-relaxed mb-7">
                        {slideIdx === 0 && "Discover the psychology behind every financial decision you make."}
                        {slideIdx === 1 && "Your AI companion that adapts to your personality and helps you make better money decisions."}
                        {slideIdx === 2 && "See what purchases really cost you \u2013 personalised to your psychology and finances."}
                      </p>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full glass-dark flex items-center justify-center">
                          {slideIdx === 0 && <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20"><circle cx="40" cy="40" r="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" /><path d="M40 20C40 20 25 32 25 44C25 52 31.5 58 40 58C48.5 58 55 52 55 44C55 32 40 20 40 20Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" /><circle cx="40" cy="38" r="5" fill="white" opacity="0.9" /></svg>}
                          {slideIdx === 1 && <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20"><rect x="12" y="18" width="56" height="44" rx="12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="rgba(255,255,255,0.05)" /><circle cx="30" cy="38" r="3" fill="rgba(255,255,255,0.5)" /><circle cx="42" cy="38" r="3" fill="rgba(255,255,255,0.5)" /><circle cx="54" cy="38" r="3" fill="rgba(255,255,255,0.5)" /></svg>}
                          {slideIdx === 2 && <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20"><circle cx="40" cy="40" r="28" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" /><text x="40" y="36" textAnchor="middle" fill="white" fontSize="10" fontWeight="600" opacity="0.4">{"\u00A3"}180</text><line x1="24" y1="42" x2="56" y2="42" stroke="rgba(255,255,255,0.2)" strokeWidth="1" /><text x="40" y="56" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">{"\u00A3"}310</text></svg>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <button onClick={() => go(slideIdx < 2 ? loginSlides[slideIdx + 1] : "login-4")} className="w-full h-[50px] bg-white text-primary rounded-[32px] text-[15px] font-semibold">{slideIdx < 2 ? "Next" : "Get Started"}</button>
                        <button onClick={() => go("login-4")} className="w-full h-[50px] glass-dark rounded-[32px] text-[15px] font-semibold text-white">Sign In</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="mb-6">
                        <h1 className="font-sans text-[28px] font-bold text-white leading-[1.15] tracking-tight mb-2">Welcome to Fincore</h1>
                        <p className="text-[15px] text-white/65 leading-relaxed">Sign in to get started</p>
                      </div>
                      <div className="flex-1 flex items-start">
                      <div className="glass-dark rounded-[28px] p-5 w-full">
                        {[
                          { name: "Google", icon: <svg width="20" height="20" viewBox="0 0 20 20"><path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 2.9-4.3 2.9-7.1z" fill="#4285F4" /><path d="M10 20c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H1.1v2.6C2.7 17.8 6.1 20 10 20z" fill="#34A853" /><path d="M4.4 12c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V5.4H1.1C.4 6.8 0 8.4 0 10s.4 3.2 1.1 4.6L4.4 12z" fill="#FBBC05" /><path d="M10 4c1.5 0 2.8.5 3.9 1.5l2.9-2.9C15 .9 12.7 0 10 0 6.1 0 2.7 2.2 1.1 5.4L4.4 8c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335" /></svg> },
                          { name: "Microsoft", icon: <svg width="20" height="20" viewBox="0 0 20 20"><rect width="9" height="9" fill="#F25022" /><rect x="10.5" width="9" height="9" fill="#7FBA00" /><rect y="10.5" width="9" height="9" fill="#00A4EF" /><rect x="10.5" y="10.5" width="9" height="9" fill="#FFB900" /></svg> },
                          { name: "Apple", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="#000"><path d="M17.05 13.78c-.32.7-.47 1.01-.88 1.63-.57.87-1.37 1.95-2.37 1.96-.88.01-1.11-.58-2.31-.57-1.19.01-1.44.58-2.33.57-1-.01-1.76-1-2.33-1.86-1.6-2.43-1.77-5.28-.78-6.8.7-1.08 1.81-1.71 2.84-1.71 1.06 0 1.72.58 2.6.58.85 0 1.37-.58 2.6-.58.92 0 1.9.5 2.6 1.36-2.29 1.26-1.92 4.53.36 5.42zM12.98 5.15c.44-.57.78-1.37.66-2.19-.72.05-1.57.51-2.06 1.11-.44.54-.81 1.35-.67 2.14.79.02 1.61-.44 2.07-1.06z" /></svg> },
                        ].map((p) => (
                          <button key={p.name} onClick={() => termsAccepted && go("info")} disabled={!termsAccepted} className={`w-full flex items-center gap-3 px-4 h-[48px] border rounded-[24px] text-[14px] font-medium transition-all mb-2 last:mb-0 ${termsAccepted ? "bg-white/85 border-white/90 text-text-primary hover:bg-white hover:shadow-md" : "bg-white/40 border-white/50 text-text-secondary cursor-not-allowed"}`}>
                            <span className="w-[22px] h-[22px] flex items-center justify-center">{p.icon}</span>
                            Continue with {p.name}
                          </button>
                        ))}
                        <button type="button" onClick={() => setTermsAccepted(!termsAccepted)} className="flex items-start gap-2 mt-3 text-[12px] text-white/75 leading-snug text-left w-full">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${termsAccepted ? "border-primary bg-primary" : "border-white/50 bg-white/15"}`}>
                            {termsAccepted && <Check size={10} className="text-white" strokeWidth={3} />}
                          </div>
                          <span>I agree to the <u>Terms of Service</u> and <u>Privacy Policy</u></span>
                        </button>
                        <div className="mt-3 py-2.5 px-3 bg-white/10 rounded-[20px] text-[12px] text-white/65 text-center font-medium flex items-center justify-center gap-1.5"><Lock size={11} /> Two-factor verification required</div>
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ))}

          {/* PERSONAL INFO */}
          {screen === "info" && (
            <div className="h-full flex flex-col relative overflow-y-auto overflow-x-hidden">
              <BlueWaveBg id="info" animated />
              <div className="flex-1 flex flex-col px-5 safe-bottom relative z-10">
                <div className="safe-top pb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => go("login-4")} className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                      <ArrowRight size={20} className="text-white rotate-180" />
                    </button>
                    <h2 className="flex-1 font-sans text-[28px] font-bold text-white leading-none tracking-tight">About You</h2>
                  </div>
                  <p className="text-[12px] text-white/50 ml-[55px] -mt-0.5">We just need a few details</p>
                </div>
                <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-6 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <div className="mb-[18px]">
                    <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Full Name</label>
                    <input
                      value={infoForm.name}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-[18px] py-[15px] bg-surface border border-black/[0.06] rounded-[32px] text-base text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/25 placeholder:text-text-tertiary"
                      placeholder="e.g. Jordan Smith"
                    />
                  </div>
                  <div className="mb-[18px]">
                    <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={infoForm.dob}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-[18px] py-[15px] bg-surface border border-black/[0.06] rounded-[32px] text-base text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/25 placeholder:text-text-tertiary"
                    />
                  </div>
                  <div className="mb-[18px]">
                    <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Email</label>
                    <input
                      type="email"
                      value={infoForm.email}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-[18px] py-[15px] bg-surface border border-black/[0.06] rounded-[32px] text-base text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/25 placeholder:text-text-tertiary"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="mb-0">
                    <label className="block text-[13px] font-semibold text-text-secondary mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={infoForm.phone}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-[18px] py-[15px] bg-surface border border-black/[0.06] rounded-[32px] text-base text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/25 placeholder:text-text-tertiary"
                      placeholder="+44 7XXX XXXXXX"
                    />
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <button onClick={async () => {
                    if (infoForm.name.trim()) {
                      await updateProfile({
                        name: infoForm.name,
                        email: infoForm.email,
                      });
                    }
                    go("q1");
                  }} className="w-full h-[50px] bg-white text-primary rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.15)]">Continue</button>
                </div>
              </div>
            </div>
          )}

          {/* SURVEY */}
          {questions.map((q) => screen === `q${q.id}` && (
            <div key={q.id} className="h-full flex flex-col relative overflow-y-auto overflow-x-hidden">
              <BlueWaveBg id={`q${q.id}`} animated />
              {/* Story progress bars */}
              <div className="absolute inset-x-4 flex gap-1 z-[55]" style={{ top: 'calc(54px + env(safe-area-inset-top, 0px))' }}>
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
                    <div className={`h-full bg-white rounded-full ${i < q.id - 1 ? "w-full" : i === q.id - 1 ? "story-filling" : "w-0"}`} />
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col px-5 safe-bottom relative z-10" style={{ paddingTop: 'calc(74px + env(safe-area-inset-top, 0px))' }}>
                <span className="text-[12px] font-semibold text-white/50 mb-3">{q.id} of 15</span>
                <div className="mb-5">
                  <h2 className="font-sans text-[28px] font-bold text-white leading-snug tracking-tight mb-2">{q.text}</h2>
                  <p className="text-[15px] text-white/50">{q.hint}</p>
                </div>
                {/* Multiple choice answers */}
                <div className="flex flex-col gap-2.5">
                  {q.options.map((opt, oi) => {
                    const sel = selectedAnswers[q.id] === oi;
                    return (
                      <button key={oi} onClick={() => { Haptics.selection(); setSelectedAnswers((p) => ({ ...p, [q.id]: oi })); }} className={`flex items-center gap-3.5 px-[18px] h-[68px] rounded-[32px] border-2 transition-all text-left ${sel ? "border-white bg-white/25" : "border-white/15 bg-white/10 hover:bg-white/15"}`}>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-sans font-semibold text-sm shrink-0 ${sel ? "bg-primary text-white" : "bg-white text-primary"}`}>{String.fromCharCode(65 + oi)}</span>
                        <span className="text-[15px] font-medium text-white leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2.5 mt-auto pt-5">
                  {q.id > 1 && <button onClick={() => go(`q${q.id - 1}` as Screen)} className="px-5 h-[50px] bg-white/15 border border-white/20 rounded-[32px] text-[15px] font-semibold text-white">Back</button>}
                  <button
                    onClick={async () => {
                      if (q.id < 15) {
                        go(`q${q.id + 1}` as Screen);
                      } else {
                        // Validate all 15 questions are answered
                        const unanswered = Array.from({ length: 15 }, (_, i) => i + 1).filter(
                          (qId) => selectedAnswers[qId] === undefined
                        );
                        if (unanswered.length > 0) {
                          go(`q${unanswered[0]}` as Screen);
                          return;
                        }
                        // Submit answers to /score endpoint
                        Haptics.medium();
                        go("processing");
                        setIsSubmitting(true);
                        setSubmitError(null);
                        try {
                          const answers = Array.from({ length: 15 }, (_, i) => {
                            const answerIndex = selectedAnswers[i + 1]!;
                            return String.fromCharCode(65 + answerIndex); // 0->A, 1->B, 2->C, 3->D
                          });
                          const res = await fetch("/api/score", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              user_id: user?.id ?? "",
                              name: profile?.name ?? null,
                              answers,
                            }),
                          });
                          if (!res.ok) throw new Error("Failed to calculate scores");
                          const data = await res.json();
                          setOceanScores(data.big_five);
                          Haptics.success();
                          // Clear quiz progress after successful submission
                          localStorage.removeItem('fincore_quiz_progress');
                        } catch (err) {
                          setSubmitError(err instanceof Error ? err.message : "Something went wrong");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    disabled={selectedAnswers[q.id] === undefined}
                    className={`flex-1 h-[50px] rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 transition-opacity ${selectedAnswers[q.id] === undefined ? "bg-white/50 text-primary/50" : "bg-white text-primary"}`}
                  >
                    {q.id < 15 ? "Next" : "See My Results"} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* PROCESSING */}
          {screen === "processing" && (
            <div className="h-full flex flex-col items-center text-center px-5 relative overflow-hidden">
              <BlueWaveBg id="proc" animated />
              <div className="flex-1 flex flex-col items-center justify-center z-10">
                <div className="w-[140px] h-[140px] relative mb-8">
                  {[0, 15, 30].map((inset, i) => (
                    <div key={i} className="absolute rounded-full border-2" style={{ inset: `${inset}px`, borderColor: `rgba(86,204,242,${0.3 - i * 0.07})`, animation: `ring-pulse 2s ease-in-out infinite ${i * 0.3}s` }} />
                  ))}
                  <div className="absolute inset-[38px] bg-white/10 backdrop-blur-[10px] rounded-full border border-white/15" />
                </div>
                <h2 className="font-sans text-2xl font-bold text-white mb-2">Analysing Your Mind</h2>
                <p className="text-[15px] text-white/70 mb-8">
                  {submitError ? "Something went wrong..." : "Building your personalised psychological profile..."}
                </p>
                <div className="w-full text-left space-y-2.5">
                  {["Mapping personality traits", "Calculating OCEAN scores", "Analysing financial behaviour", "Generating your profile", "Personalising Faith for you"].map((step, i) => {
                    const done = oceanScores !== null;
                    const stepDone = done || (!isSubmitting && i < 2);
                    const stepActive = isSubmitting && (i === 2 || (i < 2 && !stepDone));
                    return (
                      <div key={step} className={`flex items-center gap-3 text-sm font-medium ${stepDone ? "text-white" : stepActive ? "text-white" : "text-white/50"}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] shrink-0 ${
                          stepDone ? "bg-accent-green border-accent-green text-white" :
                          stepActive ? "border-accent animate-spin border-t-transparent" :
                          "border-white/40"
                        }`}>
                          {stepDone && <Check size={11} strokeWidth={3} />}
                        </div>
                        {step}
                      </div>
                    );
                  })}
                </div>
                {submitError && (
                  <p className="mt-4 text-red-300 text-sm">{submitError}</p>
                )}
                {/* Preview skeleton of results card while processing */}
                {!submitError && (
                  <SkeletonProcessingPreview />
                )}
              </div>
              <div className="w-full safe-bottom z-10 flex flex-col gap-2.5">
                {submitError && (
                  <button
                    onClick={async () => {
                      setIsSubmitting(true);
                      setSubmitError(null);
                      try {
                        const answers = Array.from({ length: 15 }, (_, i) => {
                          const answerIndex = selectedAnswers[i + 1]!;
                          return String.fromCharCode(65 + answerIndex);
                        });
                        const res = await fetch("/api/score", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            user_id: user?.id ?? "",
                            name: profile?.name ?? null,
                            answers,
                          }),
                        });
                        if (!res.ok) throw new Error("Failed to calculate scores");
                        const data = await res.json();
                        setOceanScores(data.big_five);
                        // Clear quiz progress after successful submission
                        localStorage.removeItem('fincore_quiz_progress');
                      } catch (err) {
                        setSubmitError(err instanceof Error ? err.message : "Something went wrong");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="w-full h-[50px] bg-white/15 border border-white/20 rounded-[32px] text-[15px] font-semibold text-white"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => go("results")}
                  disabled={isSubmitting || !oceanScores}
                  className={`w-full h-[50px] rounded-[32px] text-[15px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-opacity ${
                    isSubmitting || !oceanScores ? "bg-white/50 text-primary/50" : "bg-white text-primary"
                  }`}
                >
                  {isSubmitting ? "Calculating..." : "View Results"}
                </button>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {screen === "results" && (
            <div className="h-full overflow-y-auto overflow-x-hidden relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none"><BlueWaveBg id="results" animated /></div>
              <div className="relative z-10 pb-[30px]">
                <div className="relative z-[100] safe-top px-5 pb-4">
                  <h2 className="font-sans text-[28px] font-bold text-white leading-none tracking-tight">Your Profile</h2>
                  <p className="text-[12px] text-white/50 mt-1">OCEAN Personality Assessment</p>
                </div>
                {/* OCEAN Explanation */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-5 mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <h3 className="font-sans text-[15px] font-bold text-text-primary mb-2">What is OCEAN?</h3>
                  <p className="text-[13px] text-text-secondary leading-relaxed">OCEAN is the gold-standard Big Five personality model used by psychologists worldwide. It measures five core traits &mdash; <strong>O</strong>penness, <strong>C</strong>onscientiousness, <strong>E</strong>xtraversion, <strong>A</strong>greeableness, and <strong>N</strong>euroticism &mdash; to understand how your personality shapes your financial decisions.</p>
                </div>
                {/* OCEAN Trait Cards */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  {(["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"] as const).map((trait) => {
                    const key = trait.toLowerCase() as keyof typeof oceanScores;
                    const score = oceanScores?.[key] ?? 50;
                    const c = traitColors[trait];
                    const open = openTraits.has(trait);
                    const desc = traitDescriptions[trait];
                    const isHigh = score >= 60;
                    return (
                      <div key={trait} className="mb-[18px] last:mb-0 cursor-pointer" onClick={() => setOpenTraits((prev) => { const n = new Set(prev); n.has(trait) ? n.delete(trait) : n.add(trait); return n; })}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 font-sans text-[15px] font-semibold text-text-primary">
                            <span className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-white text-[13px] font-bold" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>{trait[0]}</span>
                            {trait}
                          </div>
                          <span className="text-[13px] font-semibold text-primary">{score}th</span>
                        </div>
                        <div className="h-2 bg-surface rounded overflow-hidden"><div className="h-full rounded transition-all duration-700" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} /></div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-primary font-semibold">See more <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} /></div>
                        {open && (
                          <div className="mt-3 p-4 bg-surface rounded-xl text-[13px] text-text-secondary leading-relaxed space-y-2">
                            <p><strong>Score: {score}/100</strong></p>
                            <p>{isHigh ? desc.high : desc.low}</p>
                            <p><strong>Tip:</strong> {desc.tip}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <h3 className="font-sans text-[15px] font-bold text-text-primary mb-3">How Faith Will Help You</h3>
                  <div className="p-4 bg-primary-ultra border-l-[3px] border-primary rounded-r-xl text-[13px] text-text-secondary leading-relaxed">
                    {insightsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-primary/10" />
                        <Skeleton className="h-4 w-full bg-primary/10" />
                        <Skeleton className="h-4 w-3/4 bg-primary/10" />
                      </div>
                    ) : faithInsights ? (
                      faithInsights
                    ) : (
                      "Faith will adapt to your communication style and help you make better financial decisions."
                    )}
                  </div>
                </div>
                <div className="px-5 flex flex-col gap-2.5 safe-bottom">
                  <button className="w-full h-[50px] border-[1.5px] border-white/40 text-white rounded-[32px] text-[15px] font-semibold flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm"><Mail size={16} /> Email Results</button>
                  <button onClick={() => { setHasCompletedOnboarding(true); goFromNav("scan"); }} className="w-full h-[50px] bg-white text-primary rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.1)]">Continue to App</button>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE (with navbar) — 2-page carousel */}
          {screen === "profile" && (
            <div className="h-full flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden"><BlueWaveBg id="profile" animated /></div>

              {/* Fixed header */}
              <div className="relative z-[25] safe-top px-5 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-sans text-[28px] font-bold text-white leading-none tracking-tight">Your Profile</h2>
                    <p className="text-[12px] text-white/50 mt-1">{profilePage === 0 ? "OCEAN Personality Assessment" : "Blueprint"}</p>
                  </div>
                  <button onClick={() => { setProfileAnimating(true); setProfileOpen(true); requestAnimationFrame(() => requestAnimationFrame(() => setProfileAnimating(false))); }} className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[13px] font-semibold ring-[1.5px] ring-white/60 shrink-0 relative overflow-hidden mt-1">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none" />
                    {userInitials}
                  </button>
                </div>
                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mt-3">
                  {[0, 1].map((i) => (
                    <button key={i} onClick={() => setProfilePage(i)} className={`rounded-full transition-all duration-300 ${profilePage === i ? "w-[24px] h-[8px] bg-white" : "w-[8px] h-[8px] bg-white/30"}`} />
                  ))}
                </div>
              </div>

              {/* Swipeable pages */}
              <div className="flex-1 relative z-10 overflow-hidden">
                <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${profilePage * 100}%)` }}
                  onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX); }}
                  onTouchEnd={(e) => {
                    const startX = Number((e.currentTarget as HTMLElement).dataset.touchX);
                    const diff = e.changedTouches[0].clientX - startX;
                    if (diff < -50 && profilePage < 1) setProfilePage(1);
                    if (diff > 50 && profilePage > 0) setProfilePage(0);
                  }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.mouseX = String(e.clientX); }}
                  onMouseUp={(e) => {
                    const startX = Number((e.currentTarget as HTMLElement).dataset.mouseX);
                    const diff = e.clientX - startX;
                    if (diff < -50 && profilePage < 1) setProfilePage(1);
                    if (diff > 50 && profilePage > 0) setProfilePage(0);
                  }}
                >
                  {/* Page 1 — OCEAN Personality Assessment */}
                  <div className="w-full h-full shrink-0 overflow-y-auto hide-scrollbar pb-4" style={{ maskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)" }}>
                    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-5 mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                      <h3 className="font-sans text-[15px] font-bold text-text-primary mb-2">What is OCEAN?</h3>
                      <p className="text-[13px] text-text-secondary leading-relaxed">OCEAN is the gold-standard Big Five personality model used by psychologists worldwide. It measures five core traits &mdash; <strong>O</strong>penness, <strong>C</strong>onscientiousness, <strong>E</strong>xtraversion, <strong>A</strong>greeableness, and <strong>N</strong>euroticism &mdash; to understand how your personality shapes your financial decisions.</p>
                    </div>
                    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                      {(["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"] as const).map((trait) => {
                        const key = trait.toLowerCase() as keyof typeof oceanScores;
                        const score = oceanScores?.[key] ?? 50;
                        const c = traitColors[trait];
                        const open = openTraits.has(trait);
                        const desc = traitDescriptions[trait];
                        const isHigh = score >= 60;
                        return (
                          <div key={trait} className="mb-[18px] last:mb-0 cursor-pointer" onClick={() => setOpenTraits((prev) => { const n = new Set(prev); n.has(trait) ? n.delete(trait) : n.add(trait); return n; })}>
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2 font-sans text-[15px] font-semibold text-text-primary">
                                <span className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-white text-[13px] font-bold" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>{trait[0]}</span>
                                {trait}
                              </div>
                              <span className="text-[13px] font-semibold text-primary">{score}th</span>
                            </div>
                            <div className="h-2 bg-surface rounded overflow-hidden"><div className="h-full rounded transition-all duration-700" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} /></div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-primary font-semibold">See more <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} /></div>
                            {open && (
                              <div className="mt-3 p-4 bg-surface rounded-xl text-[13px] text-text-secondary leading-relaxed space-y-2">
                                <p><strong>Score: {score}/100</strong></p>
                                <p>{isHigh ? desc.high : desc.low}</p>
                                <p><strong>Tip:</strong> {desc.tip}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                      <h3 className="font-sans text-[15px] font-bold text-text-primary mb-3">How Faith Will Help You</h3>
                      <div className="p-4 bg-primary-ultra border-l-[3px] border-primary rounded-r-xl text-[13px] text-text-secondary leading-relaxed">
                        {insightsLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-primary/10" />
                            <Skeleton className="h-4 w-full bg-primary/10" />
                            <Skeleton className="h-4 w-3/4 bg-primary/10" />
                          </div>
                        ) : faithInsights ? (
                          faithInsights
                        ) : (
                          "Faith will adapt to your communication style and help you make better financial decisions."
                        )}
                      </div>
                    </div>
                    {/* Financial Health Card */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-white text-[13px] font-bold bg-gradient-to-br from-accent-warm to-accent-red">
                          <BarChart3 size={14} />
                        </div>
                        <h3 className="font-sans text-[15px] font-bold text-text-primary">Financial Health</h3>
                      </div>
                      {emotionalTaxLoading ? (
                        <SkeletonFinancialHealth />
                      ) : emotionalTax && emotionalTax.scan_count > 0 ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[13px] text-text-secondary">Emotional Tax This Month</span>
                            <span className="text-[20px] font-bold text-accent-red">{"£"}{emotionalTax.total_tax.toFixed(2)}</span>
                          </div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-accent-warm to-accent-red rounded-full transition-all duration-700" style={{ width: `${Math.min(emotionalTax.total_tax * 2, 100)}%` }} />
                          </div>
                          <div className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
                            <ShoppingBag size={12} />
                            <span>Based on {emotionalTax.scan_count} scanned product{emotionalTax.scan_count !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[13px] text-text-tertiary">
                          Scan products to see your emotional spending patterns
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Page 2 — Context (blurred + locked) */}
                  <div className="w-full h-full shrink-0 overflow-y-auto hide-scrollbar pb-4 relative">
                    {/* Faux content behind blur */}
                    <div className="mx-4 space-y-3.5">
                      <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <h3 className="font-sans text-[15px] font-bold text-text-primary mb-2">Spending Patterns</h3>
                        <p className="text-[13px] text-text-secondary leading-relaxed">Your personality profile suggests you spend most on social activities and novelty-driven purchases.</p>
                      </div>
                      <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <h3 className="font-sans text-[15px] font-bold text-text-primary mb-3">Monthly Impact</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Weekly spend (impulse)</span><span className="font-semibold text-text-primary">{"\u00A3"}42.60</span></div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-accent-warm rounded-full w-[65%]" /></div>
                          <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Monthly total</span><span className="font-semibold text-text-primary">{"\u00A3"}183.20</span></div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-accent-red rounded-full w-[78%]" /></div>
                          <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Annual projection</span><span className="font-semibold text-text-primary">{"\u00A3"}2,198.40</span></div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full w-[45%]" /></div>
                        </div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <h3 className="font-sans text-[15px] font-bold text-text-primary mb-3">Your Action Plan</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-accent-green" /></div><div><p className="text-[13px] font-semibold text-text-primary">Set weekly spending caps</p><p className="text-[12px] text-text-secondary">Limit impulse spending to {"\u00A3"}25/week</p></div></div>
                          <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-primary" /></div><div><p className="text-[13px] font-semibold text-text-primary">Social spending alerts</p><p className="text-[12px] text-text-secondary">Get notified when social pressure drives purchases</p></div></div>
                          <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-accent-warm/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-accent-warm" /></div><div><p className="text-[13px] font-semibold text-text-primary">Novelty budget</p><p className="text-[12px] text-text-secondary">Channel curiosity into a dedicated exploration fund</p></div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-screen blur overlay — only visible on Context page */}
              {profilePage === 1 && (
                <>
                  <div className="absolute inset-0 backdrop-blur-[6px] z-20" style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.6) 15%, rgba(255,255,255,0.6) 85%, transparent 100%)" }} />
                  <div className="absolute inset-0 z-[21] flex flex-col items-center justify-center text-center px-8">
                    <Lock size={48} className="text-primary mb-3" fill="#005FCC" />
                    <h4 className="text-[20px] font-bold text-text-primary mb-1">Blueprint</h4>
                    <p className="text-[14px] text-text-secondary mb-5 max-w-[260px]">See the full context behind your spending patterns and get a personalised action plan</p>
                    <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="h-[50px] px-8 bg-primary text-white rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)]">Join Waitlist</button>
                  </div>
                </>
              )}

              {/* Navbar — same structure as Faith/Scan */}
              <div className="relative z-30 safe-bottom pt-2 px-5">
                <div className="liquid-glass rounded-[32px] flex items-center justify-between px-2 h-[50px] relative">
                  <button className="flex flex-col items-center justify-center w-[56px]">
                    <Brain size={18} className="text-white" />
                    <span className="text-[9px] text-white mt-0.5 font-semibold">Profile</span>
                  </button>
                  <button onClick={() => goToFaithFromNav()} className="flex flex-col items-center justify-center w-[56px]">
                    {hasOceanScores ? (
                      <MessageCircle size={18} className="text-white/70" />
                    ) : (
                      <Lock size={18} className="text-white/40" />
                    )}
                    <span className="text-[9px] text-white/50 mt-0.5">{hasOceanScores ? "Faith" : "Locked"}</span>
                  </button>
                  <button onClick={() => goFromNav("scan")} className="flex flex-col items-center justify-center w-[56px]">
                    <Camera size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Feels Like</span>
                  </button>
                  <button onClick={() => setComingSoonModal({ open: true, feature: 'banking' })} className="flex flex-col items-center justify-center w-[56px]">
                    <Landmark size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Banking</span>
                  </button>
                  <button onClick={() => setComingSoonModal({ open: true, feature: 'analytics' })} className="flex flex-col items-center justify-center w-[56px]">
                    <BarChart3 size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* USER PROFILE */}
          <div className={`absolute inset-0 z-[1001] flex flex-col bg-[#1a6bc7]`} style={{ transform: profileOpen && !profileAnimating ? "translateX(0)" : "translateX(100%)", transition: profileAnimating ? "none" : "transform 350ms cubic-bezier(0.32, 0.72, 0, 1)", pointerEvents: profileOpen ? "auto" : "none" }}>
              <div className="absolute inset-0 overflow-hidden z-0"><BlueWaveBg id="user-prof" animated /></div>

              {/* Close button - fixed position */}
              <div className="relative z-20 safe-top px-5">
                <button onClick={() => setProfileOpen(false)} className="w-[38px] h-[38px] rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowRight size={16} className="text-white rotate-180" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar">
                {/* Header */}
                <div className="pt-6 pb-6 flex flex-col items-center">
                  <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[32px] font-bold font-sans shadow-[0_4px_20px_rgba(0,95,204,0.3)] ring-[2px] ring-white/80 mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none" />
                    {userInitials}
                  </div>
                  <h2 className="font-sans text-[22px] font-bold text-white tracking-tight">{profile?.name ?? "Guest"}</h2>
                  <p className="text-[14px] text-white/40 mt-0.5">{profile?.email ?? "No email"}</p>
                </div>

                {/* Menu sections */}
                <div className="mx-4 space-y-3 pb-8">
                  {/* Account */}
                  <div className="bg-white/8 rounded-[20px] border border-white/10 overflow-hidden">
                    {[
                      { icon: <User size={18} />, label: "Personal Details", color: "text-primary" },
                      { icon: <Shield size={18} />, label: "Security & Privacy", color: "text-primary" },
                      { icon: <Bell size={18} />, label: "Notifications", color: "text-primary" },
                    ].map((item, i, arr) => (
                      <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors ${i < arr.length - 1 ? "border-b border-white/10" : ""}`}>
                        <div className="w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center text-primary">{item.icon}</div>
                        <span className="flex-1 text-left text-[15px] font-medium text-white/80">{item.label}</span>
                        <ChevronRight size={16} className="text-white/30" />
                      </button>
                    ))}
                  </div>

                  {/* Finance */}
                  <div className="bg-white/8 rounded-[20px] border border-white/10 overflow-hidden">
                    {[
                      { icon: <CreditCard size={18} />, label: "Payment Methods", color: "text-primary" },
                      { icon: <Settings size={18} />, label: "Preferences", color: "text-primary" },
                    ].map((item, i, arr) => (
                      <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors ${i < arr.length - 1 ? "border-b border-white/10" : ""}`}>
                        <div className="w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center text-primary">{item.icon}</div>
                        <span className="flex-1 text-left text-[15px] font-medium text-white/80">{item.label}</span>
                        <ChevronRight size={16} className="text-white/30" />
                      </button>
                    ))}
                  </div>

                  {/* Support */}
                  <div className="bg-white/8 rounded-[20px] border border-white/10 overflow-hidden">
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                      <div className="w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center text-primary"><HelpCircle size={18} /></div>
                      <span className="flex-1 text-left text-[15px] font-medium text-white/80">Help & Support</span>
                      <ChevronRight size={16} className="text-white/30" />
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="bg-white/8 rounded-[20px] border border-white/10 overflow-hidden">
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                      <div className="w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center"><LogOut size={16} className="text-red-400 ml-0.5" /></div>
                      <span className="flex-1 text-left text-[15px] font-medium text-red-300">Sign Out</span>
                      <ChevronRight size={16} className="text-white/30" />
                    </button>
                  </div>
                </div>

                {/* Safe area bottom spacer */}
                <div className="safe-bottom" />
              </div>
          </div>

          {/* FAITH CHAT — live SSE-streamed AI coach */}
          {screen === "faith" && (
            <div className="h-full flex flex-col relative overflow-hidden">
              {/* Animated wave background (preserved from design system) */}
              <div className="absolute inset-0 overflow-hidden"><BlueWaveBg id="faith" animated /></div>
              {/* Live chat component — connects to POST /chat SSE stream */}
              <ChatScreen
                userId={user?.id ?? ""}
                onMenuOpen={() => { setDrawerSource("faith"); setDrawerOpen(true); }}
                onHome={() => go("profile")}
                userInitials={userInitials}
                scanContext={pendingScanContext}
                onNavigateProfile={() => go("profile")}
                onNavigateScan={() => go("scan")}
                onNavigateBanking={() => setComingSoonModal({ open: true, feature: "banking" })}
                onNavigateAnalytics={() => setComingSoonModal({ open: true, feature: "analytics" })}
                hasOceanScores={!!oceanScores}
                activeSessionId={activeSessionId}
                onNewSession={handleChatNewSession}
                onAvatarClick={() => { setProfileAnimating(true); setProfileOpen(true); requestAnimationFrame(() => requestAnimationFrame(() => setProfileAnimating(false))); }}
                onNewChat={() => setActiveSessionId(null)}
              />
            </div>
          )}

          {/* SCAN (HOME) — Camera-ready barcode scanner */}
          {screen === "scan" && (
            <div className="h-full flex flex-col relative overflow-hidden">
              {/* Wave background */}
              <BlueWaveBg id="scan" animated />

              <TopBar title="Feels Like" onMenuClick={() => { setDrawerSource("scan"); setDrawerOpen(true); }} onAvatarClick={() => { setProfileAnimating(true); setProfileOpen(true); requestAnimationFrame(() => requestAnimationFrame(() => setProfileAnimating(false))); }} />


              <div className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
                {/* Scan viewfinder — dark window inside */}
                <div className="relative w-[300px] h-[320px] mb-8">
                  {/* Live camera feed */}
                  <video
                    ref={scan.videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-[10px] rounded-[18px] w-[calc(100%-20px)] h-[calc(100%-20px)] object-cover bg-[#0d1520]"
                  />
                  <canvas ref={scan.canvasRef} className="hidden" />

                  {/* Crosshair — visual only */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[60px] h-[60px] border-2 border-white/20 rounded-xl" />
                  </div>

                  {/* Corner brackets — large and rounded */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 320" fill="none">
                    <path d="M10,60 L10,28 Q10,10 28,10 L60,10" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    <path d="M240,10 L272,10 Q290,10 290,28 L290,60" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    <path d="M10,260 L10,292 Q10,310 28,310 L60,310" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    <path d="M240,310 L272,310 Q290,310 290,292 L290,260" stroke="white" strokeWidth="4" strokeLinecap="round" />
                  </svg>

                  {/* Torch toggle */}
                  <button className="absolute top-[18px] right-[18px] w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
                    <Flashlight size={18} className="text-white" />
                  </button>
                </div>

                {/* Capture button + instructions */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={async () => {
                      Haptics.medium();
                      const result = await scan.captureAndAnalyse();
                      if (result) {
                        setScanAnalysis(result);
                        setScanPreview(scan.getPreviewUrl());
                        const price = result.estimated_price ?? null;
                        setScanPrice(price);
                        setEditingPrice(price !== null ? price.toFixed(2) : "");
                        if (profile?.big_five && price !== null) {
                          fetchPsychologyCost(price);
                        }
                        go("scan-result");
                      }
                    }}
                    disabled={scan.isAnalysing}
                    className="relative w-[72px] h-[72px] rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,95,204,0.35)] flex items-center justify-center transition-transform active:scale-95 disabled:opacity-70"
                  >
                    <div className="absolute inset-[8px] rounded-full bg-primary/10" />
                    {scan.isAnalysing ? (
                      <div className="w-[32px] h-[32px] rounded-full border-[3px] border-primary/30 border-t-primary animate-spin" />
                    ) : (
                      <Camera size={28} className="text-primary relative z-10" />
                    )}
                  </button>
                  <div className="flex items-center gap-3">
                    <p className="text-[13px] text-white/50">Tap to scan</p>
                    <span className="text-white/20 text-[11px]">·</span>
                    <label className="text-[13px] text-white/50 cursor-pointer underline underline-offset-2">
                      upload photo
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const result = await scan.uploadAndAnalyse(file);
                        if (result) {
                          setScanAnalysis(result);
                          setScanPreview(scan.getPreviewUrl());
                          const price = result.estimated_price ?? null;
                          setScanPrice(price);
                          setEditingPrice(price !== null ? price.toFixed(2) : "");
                          if (profile?.big_five && price !== null) {
                            fetchPsychologyCost(price);
                          }
                          go("scan-result");
                        }
                        e.target.value = "";
                      }} />
                    </label>
                  </div>
                </div>

              </div>

              {/* Manual entry input — pinned to bottom */}
              {/* Input bar — GPT style */}
              <div className="relative z-10 safe-bottom pt-2 px-5">
                <div className="relative h-[50px]">
                  {/* Navbar — slides in from left */}
                  <div
                    className={`absolute inset-0 liquid-glass rounded-[32px] flex items-center justify-between px-2 transition-all duration-500 ease-out ${navExpanded ? "translate-x-0 opacity-100 z-20" : "-translate-x-full opacity-0 z-0 pointer-events-none"}`}
                    onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.swipeX = String(e.touches[0].clientX); }}
                    onTouchEnd={(e) => { const diff = e.changedTouches[0].clientX - Number((e.currentTarget as HTMLElement).dataset.swipeX); if (diff < -60) setNavExpanded(false); }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.swipeX = String(e.clientX); }}
                    onMouseUp={(e) => { const diff = e.clientX - Number((e.currentTarget as HTMLElement).dataset.swipeX); if (diff < -60) setNavExpanded(false); }}
                  >
                    <button onClick={() => { goFromNav("profile"); }} className="flex flex-col items-center justify-center w-[56px]">
                      <Brain size={18} className="text-white/70" />
                      <span className="text-[9px] text-white/50 mt-0.5">Profile</span>
                    </button>
                    <button onClick={() => { goToFaithFromNav(); }} className="flex flex-col items-center justify-center w-[56px]">
                      {hasOceanScores ? (
                        <MessageCircle size={18} className="text-white/70" />
                      ) : (
                        <Lock size={18} className="text-white/40" />
                      )}
                      <span className="text-[9px] text-white/50 mt-0.5">{hasOceanScores ? "Faith" : "Locked"}</span>
                    </button>
                    <button onClick={() => { goFromNav("scan"); }} className="flex flex-col items-center justify-center w-[56px]">
                      <Camera size={18} className="text-white" />
                      <span className="text-[9px] text-white mt-0.5 font-semibold">Feels Like</span>
                    </button>
                    <button onClick={() => setComingSoonModal({ open: true, feature: 'banking' })} className="flex flex-col items-center justify-center w-[56px]">
                      <Landmark size={18} className="text-white/70" />
                      <span className="text-[9px] text-white/50 mt-0.5">Banking</span>
                    </button>
                    <button onClick={() => setComingSoonModal({ open: true, feature: 'analytics' })} className="flex flex-col items-center justify-center w-[56px]">
                      <BarChart3 size={18} className="text-white/70" />
                      <span className="text-[9px] text-white/50 mt-0.5">Analytics</span>
                    </button>
                    <button onClick={() => setNavExpanded(false)} className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-[16px]">
                      <ChevronRight size={14} className="text-white/30" />
                    </button>
                  </div>
                  {/* Input bar */}
                  <div className={`absolute inset-0 flex items-center transition-all duration-500 ease-out ${navExpanded ? "translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"} ${scanFocused ? "gap-0" : "gap-2"}`}>
                    {/* Home button — collapses when focused */}
                    <div className={`shrink-0 overflow-hidden transition-all duration-400 ease-out ${scanFocused ? "w-0 opacity-0" : "w-[42px] opacity-100"}`}>
                      <button onClick={() => setNavExpanded(true)} className="w-[42px] h-[42px] rounded-full liquid-glass flex items-center justify-center">
                        <HomeIcon size={18} className="text-white" />
                      </button>
                    </div>
                    <div onClick={() => !scanFocused && setScanFocused(true)} className="flex-1 liquid-glass rounded-[32px] flex items-center pl-2 pr-1.5 py-1.5 h-[50px] cursor-text">
                      {/* Plus inside — only when focused */}
                      <div className={`shrink-0 overflow-hidden transition-all duration-400 ease-out ${scanFocused ? "w-[36px] min-w-[36px] mr-1 opacity-100" : "w-0 min-w-0 mr-0 opacity-0"}`}>
                        <button onClick={(e) => { e.stopPropagation(); setScanFocused(false); }} className="w-[36px] h-[36px] rounded-full bg-white/0 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </button>
                      </div>
                      {!scanFocused && <div className="w-2" />}
                      {scanFocused ? (
                        <input autoFocus onBlur={() => setScanFocused(false)} className="text-[15px] text-white flex-1 leading-snug bg-transparent outline-none placeholder:text-white/50" placeholder="Enter Manually" />
                      ) : (
                        <span className="text-[15px] text-white/50 flex-1 leading-snug">Enter Manually</span>
                      )}
                      <label className="w-[28px] h-[28px] flex items-center justify-center shrink-0 ml-1 cursor-pointer">
                        <Mic size={18} className="text-white/50" fill="rgba(255,255,255,0.5)" />
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const result = await scan.uploadAndAnalyse(file);
                          if (result) {
                            setScanAnalysis(result);
                            setScanPreview(scan.getPreviewUrl());
                            go("scan-result");
                          }
                          e.target.value = "";
                        }} />
                      </label>
                      <button className="w-[36px] h-[36px] rounded-full bg-primary flex items-center justify-center shrink-0 ml-1">
                        <Send size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SCAN RESULT */}
          {screen === "scan-result" && (
            <div className="h-full flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden"><BlueWaveBg id="scan-res" animated /></div>

              {/* Header */}
              <div className="relative z-10 safe-top px-5 pb-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => { scan.clearResult(); setScanAnalysis(null); setScanPreview(null); goFromNav("scan"); }} className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                    <ArrowRight size={20} className="text-white rotate-180" />
                  </button>
                  <h2 className="flex-1 font-sans text-[28px] font-bold text-white leading-none tracking-tight">Feels Like</h2>
                  <button onClick={() => { setProfileAnimating(true); setProfileOpen(true); requestAnimationFrame(() => requestAnimationFrame(() => setProfileAnimating(false))); }} className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[13px] font-semibold ring-[1.5px] ring-white/60 shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none" />
                    {userInitials}
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto hide-scrollbar px-5 safe-bottom relative z-10">

                {/* Product card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-4 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-4">
                  <div className="flex gap-4">
                    <div className="w-[90px] h-[90px] rounded-[14px] bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                      {scanPreview ? (
                        // Local DataURL is always the primary source - instant and reliable
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={scanPreview}
                          alt="Scanned product"
                          className="w-full h-full object-cover"
                        />
                      ) : scan.isAnalysing ? (
                        <Skeleton className="w-full h-full rounded-[14px] bg-gray-200" />
                      ) : (
                        <div className="w-full h-full bg-surface flex items-center justify-center">
                          <Camera size={32} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      {scan.isAnalysing && !scanAnalysis ? (
                        <div className="space-y-2 py-2">
                          <Skeleton className="h-5 w-3/4 bg-gray-200" />
                          <Skeleton className="h-4 w-1/2 bg-gray-200" />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-[17px] font-bold text-text-primary leading-tight">{scanAnalysis?.product_identified ?? "Scanned Product"}</h3>
                          <p className="text-[13px] text-text-tertiary mt-0.5">{scanAnalysis ? `Score ${scanAnalysis.overall_score}/100 · Grade ${scanAnalysis.grade}` : "Analysing..."}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Verdict banner */}
                {scanAnalysis && (
                  <div className={`mb-4 p-4 rounded-[20px] border text-center font-semibold text-[14px] ${
                    scanAnalysis.color === "green" ? "bg-green-50 border-green-200 text-green-800" :
                    scanAnalysis.color === "red" ? "bg-red-50 border-red-200 text-red-800" :
                    "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                    {scanAnalysis.verdict}
                  </div>
                )}

                {/* Price section */}
                <div className="mb-4">
                  {priceEditing ? (
                    <div className="bg-white/95 backdrop-blur-xl rounded-[20px] border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4 flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Actual Price</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[32px] font-bold text-text-primary">{"\u00A3"}</span>
                          <input
                            autoFocus
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value.replace(/[^\d.]/g, ""))}
                            className="text-[32px] font-bold text-text-primary leading-tight w-[90px] bg-transparent outline-none border-b-2 border-primary"
                          />
                        </div>
                        <span className="text-[12px] text-primary font-semibold mt-0.5 block">press Update to save</span>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const newPrice = parseFloat(editingPrice) || scanPrice || 0;
                            setScanPrice(newPrice);
                            setEditingPrice(newPrice.toFixed(2));
                            setPriceEditing(false);
                            if (profile?.big_five) {
                              fetchPsychologyCost(newPrice);
                            }
                          }}
                          className="h-[38px] px-5 rounded-[32px] bg-primary text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,95,204,0.3)]"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => {
                            setEditingPrice((scanPrice ?? 0).toFixed(2));
                            setPriceEditing(false);
                          }}
                          className="h-[38px] px-5 rounded-[32px] bg-surface text-[13px] font-semibold text-text-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div onClick={() => scanPrice !== null && setPriceEditing(true)} className={`flex-1 bg-white/95 backdrop-blur-xl rounded-[20px] border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4 text-center ${scanPrice !== null ? "cursor-pointer" : ""}`}>
                        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Actual Price</span>
                        {scanPrice !== null ? (
                          <>
                            <p className="text-[32px] font-bold text-text-primary leading-tight mt-1">{"\u00A3"}{scanPrice.toFixed(2)}</p>
                            <span className="text-[12px] text-primary font-semibold flex items-center justify-center gap-1">
                              <PenLine size={10} /> tap to edit
                            </span>
                          </>
                        ) : (
                          <>
                            <p className="text-[18px] font-semibold text-text-secondary leading-tight mt-3 animate-pulse">Researching price...</p>
                            <span className="text-[11px] text-text-tertiary mt-1 block">Market data loading</span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-[20px] border border-white/20 p-4 text-center relative overflow-hidden min-h-[140px]">
                        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Feels Like</span>
                        <p className="text-[32px] font-bold text-white leading-tight mt-1">
                          {psychologyCost ? (
                            <>{"\u00A3"}{psychologyCost.psychology_cost.toFixed(2)}</>
                          ) : scanPrice === null ? (
                            <span className="text-[16px] animate-pulse">Awaiting price...</span>
                          ) : (
                            <span className="animate-pulse">Calculating...</span>
                          )}
                        </p>
                        {psychologyCost && (
                          <>
                            <span className="text-[12px] text-accent font-semibold">+{"\u00A3"}{(psychologyCost.psychology_cost - psychologyCost.base_price).toFixed(2)}</span>
                            <p className="text-xs text-text-tertiary">
                              +{psychologyCost.personality_tax_percent}% personality tax
                            </p>
                          </>
                        )}
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[6px] rounded-[20px] flex flex-col items-center justify-center px-3">
                          <Lock size={28} className="text-primary mb-1.5" fill="#005FCC" />
                          <span className="text-[13px] font-bold text-text-primary">Feels Like Price</span>
                          <span className="text-[10px] text-text-secondary mt-0.5 text-center">See the real psychological cost of your purchases</span>
                          <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="mt-2 h-[30px] px-4 bg-primary text-white rounded-full text-[11px] font-semibold">Join Waitlist</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <h4 className="text-[22px] font-bold text-white mb-1 px-1">Reasoning</h4>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mb-3">
                  {[0, 1, 2].map((i) => (
                    <button key={i} onClick={() => setScanTab(i)} className={`rounded-full transition-all duration-300 ${scanTab === i ? "w-[24px] h-[8px] bg-white" : "w-[8px] h-[8px] bg-white/30"}`} />
                  ))}
                </div>

                {/* Psychology carousel */}
                <div className="relative overflow-hidden">
                  <div className="flex gap-3 transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(-${scanTab * 100}% - ${scanTab * 12}px))` }}
                    onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX); }}
                    onTouchEnd={(e) => {
                      const startX = Number((e.currentTarget as HTMLElement).dataset.touchX);
                      const diff = e.changedTouches[0].clientX - startX;
                      if (diff < -50 && scanTab < 2) setScanTab(scanTab + 1);
                      if (diff > 50 && scanTab > 0) setScanTab(scanTab - 1);
                    }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.mouseX = String(e.clientX); }}
                    onMouseUp={(e) => {
                      const startX = Number((e.currentTarget as HTMLElement).dataset.mouseX);
                      const diff = e.clientX - startX;
                      if (diff < -50 && scanTab < 2) setScanTab(scanTab + 1);
                      if (diff > 50 && scanTab > 0) setScanTab(scanTab - 1);
                    }}
                  >
                    {/* Slide 1 — OCEAN */}
                    <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[20px]">
                      <h4 className="text-[15px] font-bold text-text-primary mb-3">Psychological</h4>
                      <div className="space-y-3">
                        {(["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"] as const).map((trait) => {
                          const key = trait.toLowerCase() as "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism";
                          const score = profile?.big_five?.[key] ?? 50;
                          const costFactor = psychologyCost?.breakdown.find(b => b.trait === trait);
                          const colors: Record<string, { from: string; to: string }> = {
                            Openness: { from: "#A855F7", to: "#C084FC" },
                            Conscientiousness: { from: "#3B82F6", to: "#60A5FA" },
                            Extraversion: { from: "#FF6B6B", to: "#FF8E8E" },
                            Agreeableness: { from: "#F97316", to: "#FB923C" },
                            Neuroticism: { from: "#14B8A6", to: "#2DD4BF" },
                          };
                          const { from, to } = colors[trait];
                          const defaultInsights: Record<string, string> = {
                            Openness: "Novelty-seeking makes you grab familiar comforts",
                            Conscientiousness: "Lower planning means more spontaneous purchases",
                            Extraversion: "Social situations trigger impulse buys like this",
                            Agreeableness: "You find it hard to say no to social spending pressure",
                            Neuroticism: "Low stress about money can lead to overlooking small costs",
                          };
                          const insight = costFactor?.reason || defaultInsights[trait];
                          return (
                            <div key={trait}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[13px] font-semibold text-text-primary">{trait}</span>
                                <span className="text-[12px] font-semibold" style={{ color: from }}>{Math.round(score)}th</span>
                              </div>
                              <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-1.5">
                                <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
                              </div>
                              <p className="text-[12px] text-text-secondary">{insight}</p>
                              {costFactor && (
                                <p className="text-[11px] text-primary mt-0.5">Factor: {costFactor.factor.toFixed(2)}x</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-primary-ultra rounded-xl">
                        <p className="text-[13px] text-primary font-medium"><strong>AI says:</strong> {scanAnalysis?.financial_insight ?? "Analysis complete."}</p>
                      </div>
                      {scanAnalysis?.recommendations?.length ? (
                        <div className="mt-3 space-y-2">
                          {scanAnalysis.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 text-[12px] text-text-secondary">
                              <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Slide 2 — Financial (locked) */}
                    <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[20px] relative overflow-hidden">
                      {/* Faux content behind blur */}
                      <div className="space-y-3">
                        <h4 className="text-[15px] font-bold text-text-primary">Monthly Impact</h4>
                        <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Weekly spend (similar items)</span><span className="font-semibold text-text-primary">{"\u00A3"}7.40</span></div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-accent-warm rounded-full w-[65%]" /></div>
                        <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Monthly total</span><span className="font-semibold text-text-primary">{"\u00A3"}31.80</span></div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-accent-red rounded-full w-[78%]" /></div>
                        <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Annual projection</span><span className="font-semibold text-text-primary">{"\u00A3"}381.60</span></div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full w-[45%]" /></div>
                        <div className="p-3 bg-primary-ultra rounded-xl mt-2">
                          <p className="text-[13px] text-primary font-medium">Redirecting this spend could fund 85% of a weekend trip by December.</p>
                        </div>
                      </div>
                      {/* Blur overlay + CTA */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[6px] z-10 rounded-[20px]" />
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-8">
                        <Lock size={44} className="text-primary mb-3" fill="#005FCC" />
                        <h4 className="text-[17px] font-bold text-text-primary mb-1">Financial Analysis</h4>
                        <p className="text-[13px] text-text-secondary mb-4">See how this purchase impacts your budget and savings goals</p>
                        <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="h-[50px] px-8 bg-primary text-white rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)]">Join Waitlist</button>
                      </div>
                    </div>

                    {/* Slide 3 — Blueprint (locked) */}
                    <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[20px] relative overflow-hidden">
                      {/* Faux content behind blur */}
                      <div className="space-y-3">
                        <h4 className="text-[15px] font-bold text-text-primary">Your Action Plan</h4>
                        <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-accent-green" /></div><div><p className="text-[13px] font-semibold text-text-primary">Set a weekly drinks budget</p><p className="text-[12px] text-text-secondary">Cap at {"\u00A3"}5/week for impulse beverages</p></div></div>
                        <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-primary" /></div><div><p className="text-[13px] font-semibold text-text-primary">Try the 24-hour rule</p><p className="text-[12px] text-text-secondary">Wait before non-essential purchases</p></div></div>
                        <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-accent-warm/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-accent-warm" /></div><div><p className="text-[13px] font-semibold text-text-primary">Track social triggers</p><p className="text-[12px] text-text-secondary">Log when you buy out of social pressure</p></div></div>
                        <div className="p-3 bg-primary-ultra rounded-xl mt-2">
                          <p className="text-[13px] text-primary font-medium">Following this blueprint could save you {"\u00A3"}840/year.</p>
                        </div>
                      </div>
                      {/* Blur overlay + CTA */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[6px] z-10 rounded-[20px]" />
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-8">
                        <Lock size={44} className="text-primary mb-3" fill="#005FCC" />
                        <h4 className="text-[17px] font-bold text-text-primary mb-1">Spending Blueprint</h4>
                        <p className="text-[13px] text-text-secondary mb-4">Get a personalised action plan to change this habit</p>
                        <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="h-[50px] px-8 bg-primary text-white rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)]">Join Waitlist</button>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Alternatives based on OCEAN */}
                {/* Alternatives carousel */}
                <div className="mt-4">
                  <h4 className="text-[22px] font-bold text-white mb-1 px-1">Alternatives</h4>
                  {/* Dot indicators */}
                  <div className="flex justify-center gap-2 mb-3">
                    {[0, 1].map((i) => (
                      <button key={i} onClick={() => setAltTab(i)} className={`rounded-full transition-all duration-300 ${altTab === i ? "w-[24px] h-[8px] bg-white" : "w-[8px] h-[8px] bg-white/30"}`} />
                    ))}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex gap-3 transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(-${altTab * 100}% - ${altTab * 12}px))` }}
                      onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX); }}
                      onTouchEnd={(e) => {
                        const startX = Number((e.currentTarget as HTMLElement).dataset.touchX);
                        const diff = e.changedTouches[0].clientX - startX;
                        if (diff < -50 && altTab < 1) setAltTab(altTab + 1);
                        if (diff > 50 && altTab > 0) setAltTab(altTab - 1);
                      }}
                      onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.mouseX = String(e.clientX); }}
                      onMouseUp={(e) => {
                        const startX = Number((e.currentTarget as HTMLElement).dataset.mouseX);
                        const diff = e.clientX - startX;
                        if (diff < -50 && altTab < 1) setAltTab(altTab + 1);
                        if (diff > 50 && altTab > 0) setAltTab(altTab - 1);
                      }}
                    >
                      {/* Slide 1 — Smart alternatives based on category */}
                      <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <h4 className="text-[15px] font-bold text-text-primary mb-1">Smart Choices</h4>
                        <p className="text-[12px] text-text-secondary mb-3">AI-recommended alternatives</p>
                        <div className="space-y-2.5">
                          {(scanAnalysis?.alternatives?.length
                            ? scanAnalysis.alternatives.map((name) => ({ name }))
                            : []
                          ).map((alt, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-[14px]">
                              <div className="w-[42px] h-[42px] rounded-[10px] bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <ShoppingBag size={18} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-semibold text-text-primary">{alt.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Slide 2 — Recommendations */}
                      <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <h4 className="text-[15px] font-bold text-text-primary mb-1">Recommendations</h4>
                        <p className="text-[12px] text-text-secondary mb-3">Tips from Faith</p>
                        <div className="space-y-2.5">
                          {(scanAnalysis?.recommendations?.length
                            ? scanAnalysis.recommendations.map((rec) => ({ name: rec }))
                            : []
                          ).map((rec, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-[14px]">
                              <div className="w-[42px] h-[42px] rounded-[10px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-center shrink-0">
                                <Lightbulb size={18} className="text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-semibold text-text-primary">{rec.name}</span>
                              </div>
                            </div>
                          ))}
                          {!scanAnalysis?.recommendations?.length && (
                            <p className="text-[13px] text-text-tertiary text-center py-4">Complete a scan to see recommendations</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="text-[22px] font-bold text-white mb-1 px-1 mt-4">Review</h4>

                {/* Star review */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mt-2">
                  <h4 className="text-[15px] font-bold text-text-primary mb-1 text-center">Was this helpful?</h4>
                  <p className="text-[12px] text-text-secondary mb-4 text-center">Your feedback helps Faith learn your preferences</p>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => { setRatingStars(s); if (!ratingComment) setTimeout(() => setRatingComment(true), 800); }} className="transition-transform duration-200 hover:scale-110 cursor-pointer">
                          <Star size={32} className={s <= ratingStars ? "text-primary" : "text-primary/20"} fill={s <= ratingStars ? "#005FCC" : "none"} />
                        </button>
                      ))}
                    </div>
                    {ratingStars > 0 && (
                      <p className="text-[13px] text-text-secondary">
                        {ratingStars <= 2 ? "We\u2019ll improve this for you" : ratingStars <= 4 ? "Thanks for the feedback!" : "Glad you found it helpful!"}
                      </p>
                    )}
                    {ratingComment && (
                      <div className="w-full flex flex-col items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
                        <textarea placeholder="Any additional comments? (optional)" className="w-full h-[80px] p-3 bg-surface border border-black/5 rounded-[16px] text-[13px] text-text-primary outline-none resize-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <button className="h-[44px] px-8 bg-primary text-white rounded-[32px] text-[14px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)] cursor-pointer">Submit</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Discuss with Faith CTA */}
                <button
                  onClick={() => {
                    setPendingScanContext({
                      scan_id: scanAnalysis?.scan_id ?? `scan_${Date.now()}`,
                      product_name: scanAnalysis?.product_name ?? scanAnalysis?.product_identified,
                      overall_score: scanAnalysis?.overall_score,
                      estimated_price: scanPrice ?? undefined,
                      psychology_cost: psychologyCost?.psychology_cost,
                      verdict: scanAnalysis?.verdict,
                    });
                    go("faith");
                  }}
                  className="w-full mt-4 h-[56px] rounded-[32px] bg-gradient-to-r from-primary to-accent text-white text-[16px] font-semibold shadow-[0_4px_24px_rgba(0,95,204,0.35)] flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <MessageCircle size={20} />
                  Discuss with Faith
                </button>

              </div>
            </div>
          )}

          {/* SCAN RESULT PRO (unlocked) */}
          {screen === "scan-result-pro" && (
            <div className="h-full flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden"><BlueWaveBg id="scan-res-pro" animated /></div>

              {/* Header */}
              <div className="relative z-10 safe-top px-5 pb-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => goFromNav("scan")} className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                    <ArrowRight size={20} className="text-white rotate-180" />
                  </button>
                  <h2 className="flex-1 font-sans text-[28px] font-bold text-white leading-none tracking-tight">Feels Like</h2>
                  <button onClick={() => { setProfileAnimating(true); setProfileOpen(true); requestAnimationFrame(() => requestAnimationFrame(() => setProfileAnimating(false))); }} className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[13px] font-semibold ring-[1.5px] ring-white/60 shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none" />
                    {userInitials}
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto hide-scrollbar px-5 safe-bottom relative z-10">

                {/* Product card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-4 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-4">
                  <div className="flex gap-4">
                    <div className="w-[90px] h-[90px] rounded-[14px] bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                      {scanPreview ? (
                        // Local DataURL is always the primary source - instant and reliable
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={scanPreview}
                          alt="Scanned product"
                          className="w-full h-full object-cover"
                        />
                      ) : scan.isAnalysing ? (
                        <Skeleton className="w-full h-full rounded-[14px] bg-gray-200" />
                      ) : (
                        <div className="w-full h-full bg-surface flex items-center justify-center">
                          <Camera size={32} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      {scan.isAnalysing && !scanAnalysis ? (
                        <div className="space-y-2 py-2">
                          <Skeleton className="h-5 w-3/4 bg-gray-200" />
                          <Skeleton className="h-4 w-1/2 bg-gray-200" />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-[17px] font-bold text-text-primary leading-tight">{scanAnalysis?.product_name || scanAnalysis?.product_identified || "Product"}</h3>
                          <p className="text-[13px] text-text-tertiary mt-0.5">{scanAnalysis ? `Score ${scanAnalysis.overall_score}/100 • Grade ${scanAnalysis.grade}` : "Scanned product"}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price section — unlocked with edit */}
                <div className="mb-4">
                  {priceEditing ? (
                    <div className="bg-white/95 backdrop-blur-xl rounded-[20px] border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4 flex items-center gap-3">
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Actual Price</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[32px] font-bold text-text-primary">{"\u00A3"}</span>
                          <input
                            autoFocus
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value.replace(/[^\d.]/g, ""))}
                            className="text-[32px] font-bold text-text-primary leading-tight w-[90px] bg-transparent outline-none border-b-2 border-primary"
                          />
                        </div>
                        <span className="text-[12px] text-primary font-semibold mt-0.5 block">press Update to save</span>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const newPrice = parseFloat(editingPrice) || scanPrice || 0;
                            setScanPrice(newPrice);
                            setEditingPrice(newPrice.toFixed(2));
                            setPriceEditing(false);
                            if (profile?.big_five) {
                              fetchPsychologyCost(newPrice);
                            }
                          }}
                          className="h-[38px] px-5 rounded-[32px] bg-primary text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(0,95,204,0.3)] cursor-pointer"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => {
                            setEditingPrice((scanPrice ?? 0).toFixed(2));
                            setPriceEditing(false);
                          }}
                          className="h-[38px] px-5 rounded-[32px] bg-surface text-[13px] font-semibold text-text-secondary cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div onClick={() => scanPrice !== null && setPriceEditing(true)} className={`flex-1 bg-white/95 backdrop-blur-xl rounded-[20px] border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-4 text-center ${scanPrice !== null ? "cursor-pointer" : ""}`}>
                        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Actual Price</span>
                        {scanPrice !== null ? (
                          <>
                            <p className="text-[32px] font-bold text-text-primary leading-tight mt-1">{"\u00A3"}{scanPrice.toFixed(2)}</p>
                            <span className="text-[12px] text-primary font-semibold flex items-center justify-center gap-1">
                              <PenLine size={10} /> tap to edit
                            </span>
                          </>
                        ) : (
                          <>
                            <p className="text-[18px] font-semibold text-text-secondary leading-tight mt-3 animate-pulse">Researching price...</p>
                            <span className="text-[11px] text-text-tertiary mt-1 block">Market data loading</span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-[20px] border border-white/20 p-4 text-center">
                        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Feels Like</span>
                        <p className="text-[32px] font-bold text-white leading-tight mt-1">
                          {psychologyCost ? (
                            <>{"\u00A3"}{psychologyCost.psychology_cost.toFixed(2)}</>
                          ) : scanPrice === null ? (
                            <span className="text-[16px] animate-pulse">Awaiting price...</span>
                          ) : (
                            <span className="animate-pulse">{"\u00A3"}--</span>
                          )}
                        </p>
                        {psychologyCost && (
                          <span className="text-[12px] text-accent font-semibold">+{"\u00A3"}{(psychologyCost.psychology_cost - psychologyCost.base_price).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <h4 className="text-[22px] font-bold text-white mb-1 px-1">Reasoning</h4>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mb-3">
                  {[0, 1, 2].map((i) => (
                    <button key={i} onClick={() => setScanTab(i)} className={`rounded-full transition-all duration-300 ${scanTab === i ? "w-[24px] h-[8px] bg-white" : "w-[8px] h-[8px] bg-white/30"}`} />
                  ))}
                </div>

                {/* Psychology carousel — all unlocked */}
                <div className="relative overflow-hidden">
                  <div className="flex gap-3 transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(-${scanTab * 100}% - ${scanTab * 12}px))` }}
                    onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX); }}
                    onTouchEnd={(e) => {
                      const startX = Number((e.currentTarget as HTMLElement).dataset.touchX);
                      const diff = e.changedTouches[0].clientX - startX;
                      if (diff < -50 && scanTab < 2) setScanTab(scanTab + 1);
                      if (diff > 50 && scanTab > 0) setScanTab(scanTab - 1);
                    }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.mouseX = String(e.clientX); }}
                    onMouseUp={(e) => {
                      const startX = Number((e.currentTarget as HTMLElement).dataset.mouseX);
                      const diff = e.clientX - startX;
                      if (diff < -50 && scanTab < 2) setScanTab(scanTab + 1);
                      if (diff > 50 && scanTab > 0) setScanTab(scanTab - 1);
                    }}
                  >
                    {/* Slide 1 — OCEAN */}
                    <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[20px]">
                      <h4 className="text-[15px] font-bold text-text-primary mb-3">Psychological</h4>
                      <div className="space-y-3">
                        {(["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"] as const).map((trait) => {
                          const key = trait.toLowerCase() as "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism";
                          const score = profile?.big_five?.[key] ?? 50;
                          const costFactor = psychologyCost?.breakdown.find(b => b.trait === trait);
                          const colors: Record<string, { from: string; to: string }> = {
                            Openness: { from: "#A855F7", to: "#C084FC" },
                            Conscientiousness: { from: "#3B82F6", to: "#60A5FA" },
                            Extraversion: { from: "#FF6B6B", to: "#FF8E8E" },
                            Agreeableness: { from: "#F97316", to: "#FB923C" },
                            Neuroticism: { from: "#14B8A6", to: "#2DD4BF" },
                          };
                          const { from, to } = colors[trait];
                          const defaultInsights: Record<string, string> = {
                            Openness: "Novelty-seeking makes you grab familiar comforts",
                            Conscientiousness: "Lower planning means more spontaneous purchases",
                            Extraversion: "Social situations trigger impulse buys like this",
                            Agreeableness: "You find it hard to say no to social spending pressure",
                            Neuroticism: "Low stress about money can lead to overlooking small costs",
                          };
                          const insight = costFactor?.reason || defaultInsights[trait];
                          return (
                            <div key={trait}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[13px] font-semibold text-text-primary">{trait}</span>
                                <span className="text-[12px] font-semibold" style={{ color: from }}>{Math.round(score)}th</span>
                              </div>
                              <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-1.5">
                                <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
                              </div>
                              <p className="text-[12px] text-text-secondary">{insight}</p>
                              {costFactor && (
                                <p className="text-[11px] text-primary mt-0.5">Factor: {costFactor.factor.toFixed(2)}x</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-primary-ultra rounded-xl">
                        <p className="text-[13px] text-primary font-medium"><strong>Faith says:</strong> {psychologyCost ? `This ${"\u00A3"}${psychologyCost.base_price.toFixed(2)} purchase feels like ${"\u00A3"}${psychologyCost.psychology_cost.toFixed(2)} to your personality. Over a year, that adds up to ~${"\u00A3"}${(psychologyCost.psychology_cost * 52).toFixed(0)} in hidden psychological cost.` : "Calculating psychological cost..."}</p>
                      </div>
                    </div>

                    {/* Slide 2 — Financial (locked) */}
                    <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[20px] relative overflow-hidden">
                      {/* Faux content behind blur */}
                      <div className="space-y-3">
                        <h4 className="text-[15px] font-bold text-text-primary">Monthly Impact</h4>
                        <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Weekly spend (similar items)</span><span className="font-semibold text-text-primary">{"\u00A3"}7.40</span></div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-accent-warm rounded-full w-[65%]" /></div>
                        <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Monthly total</span><span className="font-semibold text-text-primary">{"\u00A3"}31.80</span></div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-accent-red rounded-full w-[78%]" /></div>
                        <div className="flex justify-between text-[13px]"><span className="text-text-secondary">Annual projection</span><span className="font-semibold text-text-primary">{"\u00A3"}381.60</span></div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full w-[45%]" /></div>
                        <div className="p-3 bg-primary-ultra rounded-xl mt-2">
                          <p className="text-[13px] text-primary font-medium">Redirecting this spend could fund 85% of a weekend trip by December.</p>
                        </div>
                      </div>
                      {/* Blur overlay + CTA */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[6px] z-10 rounded-[20px]" />
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-8">
                        <Lock size={44} className="text-primary mb-3" fill="#005FCC" />
                        <h4 className="text-[17px] font-bold text-text-primary mb-1">Financial Analysis</h4>
                        <p className="text-[13px] text-text-secondary mb-4">See how this purchase impacts your budget and savings goals</p>
                        <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="h-[50px] px-8 bg-primary text-white rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)]">Join Waitlist</button>
                      </div>
                    </div>

                    {/* Slide 3 — Blueprint (locked) */}
                    <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-[20px] relative overflow-hidden">
                      {/* Faux content behind blur */}
                      <div className="space-y-3">
                        <h4 className="text-[15px] font-bold text-text-primary">Your Action Plan</h4>
                        <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-accent-green" /></div><div><p className="text-[13px] font-semibold text-text-primary">Set a weekly drinks budget</p><p className="text-[12px] text-text-secondary">Cap at {"\u00A3"}5/week for impulse beverages</p></div></div>
                        <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-primary" /></div><div><p className="text-[13px] font-semibold text-text-primary">Try the 24-hour rule</p><p className="text-[12px] text-text-secondary">Wait before non-essential purchases</p></div></div>
                        <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-accent-warm/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-accent-warm" /></div><div><p className="text-[13px] font-semibold text-text-primary">Track social triggers</p><p className="text-[12px] text-text-secondary">Log when you buy out of social pressure</p></div></div>
                        <div className="p-3 bg-primary-ultra rounded-xl mt-2">
                          <p className="text-[13px] text-primary font-medium">Following this blueprint could save you {"\u00A3"}840/year.</p>
                        </div>
                      </div>
                      {/* Blur overlay + CTA */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[6px] z-10 rounded-[20px]" />
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-8">
                        <Lock size={44} className="text-primary mb-3" fill="#005FCC" />
                        <h4 className="text-[17px] font-bold text-text-primary mb-1">Spending Blueprint</h4>
                        <p className="text-[13px] text-text-secondary mb-4">Get a personalised action plan to change this habit</p>
                        <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="h-[50px] px-8 bg-primary text-white rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)]">Join Waitlist</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alternatives */}
                <div className="mt-4">
                  <h4 className="text-[22px] font-bold text-white mb-1 px-1">Alternatives</h4>
                  <div className="flex justify-center gap-2 mb-3">
                    {[0, 1].map((i) => (
                      <button key={i} onClick={() => setAltTab(i)} className={`rounded-full transition-all duration-300 ${altTab === i ? "w-[24px] h-[8px] bg-white" : "w-[8px] h-[8px] bg-white/30"}`} />
                    ))}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex gap-3 transition-transform duration-500 ease-out" style={{ transform: `translateX(calc(-${altTab * 100}% - ${altTab * 12}px))` }}
                      onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX); }}
                      onTouchEnd={(e) => {
                        const startX = Number((e.currentTarget as HTMLElement).dataset.touchX);
                        const diff = e.changedTouches[0].clientX - startX;
                        if (diff < -50 && altTab < 1) setAltTab(altTab + 1);
                        if (diff > 50 && altTab > 0) setAltTab(altTab - 1);
                      }}
                      onMouseDown={(e) => { (e.currentTarget as HTMLElement).dataset.mouseX = String(e.clientX); }}
                      onMouseUp={(e) => {
                        const startX = Number((e.currentTarget as HTMLElement).dataset.mouseX);
                        const diff = e.clientX - startX;
                        if (diff < -50 && altTab < 1) setAltTab(altTab + 1);
                        if (diff > 50 && altTab > 0) setAltTab(altTab - 1);
                      }}
                    >
                      <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <h4 className="text-[15px] font-bold text-text-primary mb-1">Smart Choices</h4>
                        <p className="text-[12px] text-text-secondary mb-3">AI-recommended alternatives</p>
                        <div className="space-y-2.5">
                          {(scanAnalysis?.alternatives?.length
                            ? scanAnalysis.alternatives.map((name) => ({ name }))
                            : []
                          ).map((alt, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-[14px]">
                              <div className="w-[42px] h-[42px] rounded-[10px] bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <ShoppingBag size={18} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-semibold text-text-primary">{alt.name}</span>
                              </div>
                            </div>
                          ))}
                          {!scanAnalysis?.alternatives?.length && (
                            <p className="text-[13px] text-text-tertiary text-center py-4">Complete a scan to see alternatives</p>
                          )}
                        </div>
                      </div>
                      <div className="w-full shrink-0 bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                        <h4 className="text-[15px] font-bold text-text-primary mb-1">Recommendations</h4>
                        <p className="text-[12px] text-text-secondary mb-3">Tips from Faith</p>
                        <div className="space-y-2.5">
                          {(scanAnalysis?.recommendations?.length
                            ? scanAnalysis.recommendations.map((rec) => ({ name: rec }))
                            : []
                          ).map((rec, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-[14px]">
                              <div className="w-[42px] h-[42px] rounded-[10px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-center shrink-0">
                                <Lightbulb size={18} className="text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-semibold text-text-primary">{rec.name}</span>
                              </div>
                            </div>
                          ))}
                          {!scanAnalysis?.recommendations?.length && (
                            <p className="text-[13px] text-text-tertiary text-center py-4">Complete a scan to see recommendations</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Star review */}
                <h4 className="text-[22px] font-bold text-white mb-1 px-1 mt-4">Review</h4>
                <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mt-2">
                  <h4 className="text-[15px] font-bold text-text-primary mb-1 text-center">Was this helpful?</h4>
                  <p className="text-[12px] text-text-secondary mb-4 text-center">Your feedback helps Faith learn your preferences</p>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => { setRatingStars(s); if (!ratingComment) setTimeout(() => setRatingComment(true), 800); }} className="transition-transform duration-200 hover:scale-110 cursor-pointer">
                          <Star size={32} className={s <= ratingStars ? "text-primary" : "text-primary/20"} fill={s <= ratingStars ? "#005FCC" : "none"} />
                        </button>
                      ))}
                    </div>
                    {ratingStars > 0 && (
                      <p className="text-[13px] text-text-secondary">
                        {ratingStars <= 2 ? "We\u2019ll improve this for you" : ratingStars <= 4 ? "Thanks for the feedback!" : "Glad you found it helpful!"}
                      </p>
                    )}
                    {ratingComment && (
                      <div className="w-full flex flex-col items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
                        <textarea placeholder="Any additional comments? (optional)" className="w-full h-[80px] p-3 bg-surface border border-black/5 rounded-[16px] text-[13px] text-text-primary outline-none resize-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        <button className="h-[44px] px-8 bg-primary text-white rounded-[32px] text-[14px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)] cursor-pointer">Submit</button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* BANKING (locked) */}
          {screen === "banking" && (
            <div className="h-full flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden"><BlueWaveBg id="banking" animated /></div>
              <div className="relative z-10 safe-top px-5 pb-4">
                <h2 className="font-sans text-[28px] font-bold text-white leading-none tracking-tight">Banking</h2>
                <p className="text-[12px] text-white/50 mt-1">Manage your accounts and cards</p>
              </div>
              <div className="flex-1 relative z-10 px-5">
                <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[15px] font-bold text-text-primary">Current Account</span>
                    <span className="text-[20px] font-bold text-text-primary">{"\u00A3"}2,450.80</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-2"><div className="h-full bg-gradient-to-r from-primary to-accent rounded-full w-[65%]" /></div>
                  <span className="text-[12px] text-text-secondary">65% of monthly budget remaining</span>
                </div>
                <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-4 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-3">
                  {["Direct Debit — Netflix", "Card Payment — Tesco", "Transfer — J. Smith"].map((t, i) => (
                    <div key={t} className={`flex justify-between py-3 ${i < 2 ? "border-b border-gray-100" : ""}`}>
                      <span className="text-[13px] text-text-primary">{t}</span>
                      <span className="text-[13px] font-semibold text-text-primary">-{"\u00A3"}{(i + 1) * 12}.99</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Blur overlay — covers full screen including header */}
              <div className="absolute inset-0 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center px-10" style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.6) 15%, rgba(255,255,255,0.6) 85%, transparent 100%)" }}>
                <Lock size={44} className="text-primary mb-3" fill="#005FCC" />
                <h4 className="text-[20px] font-bold text-text-primary mb-1">Banking</h4>
                <p className="text-[13px] text-text-secondary mb-5 text-center">Connect your bank accounts and track spending in real time</p>
                <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="h-[50px] px-8 bg-primary text-white rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)]">Join Waitlist</button>
              </div>
              {/* Navbar */}
              <div className="relative z-30 safe-bottom pt-2 px-5">
                <div className="liquid-glass rounded-[32px] flex items-center justify-between px-2 h-[50px] relative">
                  <button onClick={() => goFromNav("profile")} className="flex flex-col items-center justify-center w-[56px]">
                    <Brain size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Profile</span>
                  </button>
                  <button onClick={() => goToFaithFromNav()} className="flex flex-col items-center justify-center w-[56px]">
                    {hasOceanScores ? (
                      <MessageCircle size={18} className="text-white/70" />
                    ) : (
                      <Lock size={18} className="text-white/40" />
                    )}
                    <span className="text-[9px] text-white/50 mt-0.5">{hasOceanScores ? "Faith" : "Locked"}</span>
                  </button>
                  <button onClick={() => goFromNav("scan")} className="flex flex-col items-center justify-center w-[56px]">
                    <Camera size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Feels Like</span>
                  </button>
                  <button className="flex flex-col items-center justify-center w-[56px]">
                    <Landmark size={18} className="text-white" />
                    <span className="text-[9px] text-white mt-0.5 font-semibold">Banking</span>
                  </button>
                  <button onClick={() => setComingSoonModal({ open: true, feature: 'analytics' })} className="flex flex-col items-center justify-center w-[56px]">
                    <BarChart3 size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS (locked) */}
          {screen === "analytics" && (
            <div className="h-full flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden"><BlueWaveBg id="analytics" animated /></div>
              <div className="relative z-10 safe-top px-5 pb-4">
                <h2 className="font-sans text-[28px] font-bold text-white leading-none tracking-tight">Analytics</h2>
                <p className="text-[12px] text-white/50 mt-1">Financial insights and trends</p>
              </div>
              <div className="flex-1 relative z-10 px-5">
                {/* Faux content */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[20px] p-5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-3">
                  <h4 className="text-[15px] font-bold text-text-primary mb-3">Monthly Overview</h4>
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 p-3 bg-surface rounded-xl text-center">
                      <span className="text-[11px] text-text-tertiary block">Income</span>
                      <span className="text-[18px] font-bold text-accent-green">{"\u00A3"}3,200</span>
                    </div>
                    <div className="flex-1 p-3 bg-surface rounded-xl text-center">
                      <span className="text-[11px] text-text-tertiary block">Spent</span>
                      <span className="text-[18px] font-bold text-accent-red">{"\u00A3"}1,840</span>
                    </div>
                    <div className="flex-1 p-3 bg-surface rounded-xl text-center">
                      <span className="text-[11px] text-text-tertiary block">Saved</span>
                      <span className="text-[18px] font-bold text-primary">{"\u00A3"}1,360</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[["Food & Drink", 35], ["Transport", 20], ["Entertainment", 25], ["Bills", 15]].map(([label, pct]) => (
                      <div key={label as string}>
                        <div className="flex justify-between text-[12px] mb-0.5"><span className="text-text-secondary">{label}</span><span className="font-semibold text-text-primary">{pct}%</span></div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Blur overlay — covers full screen including header */}
              <div className="absolute inset-0 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center px-10" style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.6) 15%, rgba(255,255,255,0.6) 85%, transparent 100%)" }}>
                <Lock size={44} className="text-primary mb-3" fill="#005FCC" />
                <h4 className="text-[20px] font-bold text-text-primary mb-1">Analytics</h4>
                <p className="text-[13px] text-text-secondary mb-5 text-center">Track spending patterns, set budgets, and visualise your financial health</p>
                <button onClick={() => setComingSoonModal({ open: true, feature: 'blueprint' })} className="h-[50px] px-8 bg-primary text-white rounded-[32px] text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,95,204,0.3)]">Join Waitlist</button>
              </div>
              {/* Navbar */}
              <div className="relative z-30 safe-bottom pt-2 px-5">
                <div className="liquid-glass rounded-[32px] flex items-center justify-between px-2 h-[50px] relative">
                  <button onClick={() => goFromNav("profile")} className="flex flex-col items-center justify-center w-[56px]">
                    <Brain size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Profile</span>
                  </button>
                  <button onClick={() => goToFaithFromNav()} className="flex flex-col items-center justify-center w-[56px]">
                    {hasOceanScores ? (
                      <MessageCircle size={18} className="text-white/70" />
                    ) : (
                      <Lock size={18} className="text-white/40" />
                    )}
                    <span className="text-[9px] text-white/50 mt-0.5">{hasOceanScores ? "Faith" : "Locked"}</span>
                  </button>
                  <button onClick={() => goFromNav("scan")} className="flex flex-col items-center justify-center w-[56px]">
                    <Camera size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Feels Like</span>
                  </button>
                  <button onClick={() => setComingSoonModal({ open: true, feature: 'banking' })} className="flex flex-col items-center justify-center w-[56px]">
                    <Landmark size={18} className="text-white/70" />
                    <span className="text-[9px] text-white/50 mt-0.5">Banking</span>
                  </button>
                  <button className="flex flex-col items-center justify-center w-[56px]">
                    <BarChart3 size={18} className="text-white" />
                    <span className="text-[9px] text-white mt-0.5 font-semibold">Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History drawer — full screen, GPT style */}
          <div
            className="absolute inset-0 z-[1000] flex flex-col overflow-hidden"
            style={{
              transform: drawerOpen ? `translateX(${Math.min(0, drawerX)}px)` : "translateX(-100%)",
              transition: touchStart !== null ? "none" : "transform 350ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
            onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
            onTouchMove={(e) => {
              if (touchStart === null) return;
              const diff = e.touches[0].clientX - touchStart;
              if (diff < 0) setDrawerX(diff);
            }}
            onTouchEnd={() => {
              if (drawerX < -80) setDrawerOpen(false);
              setDrawerX(0);
              setTouchStart(null);
            }}
            onMouseDown={(e) => setTouchStart(e.clientX)}
            onMouseMove={(e) => {
              if (touchStart === null || e.buttons !== 1) return;
              const diff = e.clientX - touchStart;
              if (diff < 0) setDrawerX(diff);
            }}
            onMouseUp={() => {
              if (drawerX < -80) setDrawerOpen(false);
              setDrawerX(0);
              setTouchStart(null);
            }}
            onMouseLeave={() => {
              if (touchStart !== null) {
                if (drawerX < -80) setDrawerOpen(false);
                setDrawerX(0);
                setTouchStart(null);
              }
            }}
          >
            <div className="absolute inset-0 overflow-hidden z-0"><BlueWaveBg id="drawer" animated /></div>
            {/* Header — matches app header positioning */}
            <div className="relative z-10 safe-top px-5 pb-2">
              <div className="flex items-center gap-3 h-[50px]">
                {drawerSearchOpen ? (
                  <div className="flex-1 h-[50px] rounded-[32px] bg-white/10 border border-white/15 flex items-center pl-2 pr-5 gap-2">
                    <button onClick={() => { setDrawerSearchOpen(false); setDrawerSearchQuery(""); }} className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                      <ArrowRight size={18} className="text-white/50 rotate-180" />
                    </button>
                    <input
                      autoFocus
                      value={drawerSearchQuery}
                      onChange={(e) => setDrawerSearchQuery(e.target.value)}
                      className="text-[15px] text-white flex-1 bg-transparent outline-none placeholder:text-white/30"
                      placeholder="Search conversations..."
                    />
                    {drawerSearchQuery && (
                      <button onClick={() => setDrawerSearchQuery("")} className="w-[24px] h-[24px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <X size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button onClick={() => setDrawerOpen(false)} className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                      <X size={20} className="text-white" />
                    </button>
                    <h3 className="text-[22px] font-bold text-white tracking-tight flex-1"></h3>
                    <button onClick={() => setDrawerSearchOpen(true)} className="w-[38px] h-[38px] rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Drawer subtitle */}
            <div className="relative z-10 px-5 pb-3">
              <h2 className="font-sans text-[34px] font-bold text-white leading-none tracking-tight">{drawerSource === "faith" ? "History — Faith" : "History — Feels Like"}</h2>
            </div>

            {/* History items */}
            <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-5 space-y-3">
              {drawerSource === "faith" ? (
                // Faith chat history - real data from backend
                chatHistory.loading ? (
                  // Loading skeleton
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <div className="h-5 w-20 bg-white/10 rounded mb-2 animate-pulse" />
                        <div className="bg-white/8 rounded-[16px] border border-white/10 overflow-hidden">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className={`px-4 py-3 ${j < 3 ? "border-b border-white/10" : ""}`}>
                              <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : groupedSessions.length === 0 && drawerSearchQuery ? (
                  // No search results
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </div>
                    <h3 className="text-[16px] font-semibold text-white/80 mb-1">No results found</h3>
                    <p className="text-[13px] text-white/50 max-w-[200px]">Try a different search term</p>
                  </div>
                ) : groupedSessions.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                      <MessageCircle size={28} className="text-white/40" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-white/80 mb-1">No conversations yet</h3>
                    <p className="text-[13px] text-white/50 max-w-[200px]">Start a new chat with Faith to see your history here</p>
                  </div>
                ) : (
                  // Grouped sessions
                  groupedSessions.map((group) => (
                    <div key={group.label}>
                      <span className="text-[18px] font-bold text-white drop-shadow-sm px-1 block mb-2">{group.label}</span>
                      <div className="bg-white/8 rounded-[16px] border border-white/10 overflow-hidden">
                        {group.items.map((session, i) => (
                          <button
                            key={session.session_id}
                            onClick={() => handleSelectSession(session)}
                            className={`w-full px-4 py-3 hover:bg-white/5 transition-colors text-left ${i < group.items.length - 1 ? "border-b border-white/10" : ""} ${activeSessionId === session.session_id ? "bg-white/10" : ""}`}
                          >
                            <span className="text-[14px] text-white/70 line-clamp-1">{session.title || session.first_message_preview || "Untitled conversation"}</span>
                            <span className="text-[11px] text-white/40 mt-0.5 block">
                              {session.message_count} message{session.message_count !== 1 ? "s" : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )
              ) : (
                // Scan history - still using mock data for now
                [
                  { label: "Today", items: ["Tesco barcode scan", "Amazon impulse buy check"] },
                  { label: "Yesterday", items: ["Sainsbury\u2019s grocery scan", "Zara price scan", "Costa coffee scan"] },
                  { label: "Last 7 days", items: ["Energy bill comparison", "Car insurance renewal", "Gym membership scan", "Takeaway receipt scan"] },
                ].map((group) => (
                  <div key={group.label}>
                    <span className="text-[18px] font-bold text-white drop-shadow-sm px-1 block mb-2">{group.label}</span>
                    <div className="bg-white/8 rounded-[16px] border border-white/10 overflow-hidden">
                      {group.items.map((t, i) => (
                        <button key={t} className={`w-full px-4 py-3 hover:bg-white/5 transition-colors text-left ${i < group.items.length - 1 ? "border-b border-white/10" : ""}`}>
                          <span className="text-[14px] text-white/70">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* New chat FAB */}
            <div className="absolute bottom-8 right-5 z-10">
              <button onClick={drawerSource === "faith" ? handleNewChat : () => setDrawerOpen(false)} className="group h-[50px] rounded-full bg-white/10 border border-white/15 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:bg-primary hover:border-primary transition-all duration-300 px-3.5 gap-0 hover:gap-2 hover:px-5 hover:shadow-[0_4px_24px_rgba(0,95,204,0.4)]">
                {drawerSource === "faith" ? <MessageCircle size={20} className="text-white shrink-0" /> : <Camera size={20} className="text-white shrink-0" />}
                <span className="text-[15px] font-semibold text-white max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap">{drawerSource === "faith" ? "New Chat" : "New Scan"}</span>
              </button>
            </div>

          </div>

      {/* Coming Soon Modal for Banking/Analytics/Blueprint */}
      <ComingSoonModal
        isOpen={comingSoonModal.open}
        onClose={() => setComingSoonModal({ open: false, feature: null })}
        feature={
          comingSoonModal.feature === 'banking' ? 'Open Banking' :
          comingSoonModal.feature === 'blueprint' ? 'Spending Blueprint' :
          'Financial Analytics'
        }
        featureKey={comingSoonModal.feature ?? 'banking'}
        description={
          comingSoonModal.feature === 'banking'
            ? 'Connect your accounts to see how your personality shapes your real spending patterns.'
            : comingSoonModal.feature === 'blueprint'
            ? 'Get a personalised action plan based on your OCEAN profile and spending patterns.'
            : 'Track your emotional spending over time and see the impact of your psychology on your wallet.'
        }
        icon={
          comingSoonModal.feature === 'banking' ? <Landmark size={28} className="text-accent" /> :
          comingSoonModal.feature === 'blueprint' ? <Lock size={28} className="text-accent" /> :
          <BarChart3 size={28} className="text-accent" />
        }
      />
    </div>
  );
}

/* OCEAN standalone header */
function OceanHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative z-[100] safe-top px-5 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h2 className="flex-1 font-sans text-[28px] font-bold text-white leading-none tracking-tight">Your Profile</h2>
      </div>
      <p className="text-[12px] text-white/50 ml-[55px] -mt-0.5">OCEAN Personality Assessment</p>
    </div>
  );
}

/* Reusable blue wave background */
function BlueWaveBg({ id, animated = false }: { id: string; animated?: boolean }) {
  const bands = [
    "M443,-50 C460,250 100,350 -50,550 C-80,650 50,800 -50,902 L443,902 Z",
    "M443,-150 C450,150 50,250 -100,420 C-130,530 30,700 -50,902 L443,902 Z",
    "M443,-250 C440,80 20,170 -150,300 C-180,400 10,580 -50,902 L443,902 Z",
    "M443,400 C350,550 200,750 100,820 C50,860 0,840 -50,902 L443,902 Z",
  ];
  const driftClasses = ["wave-drift-1", "wave-drift-2", "wave-drift-3", "wave-drift-4"];
  const gradIds = [`${id}-arc1`, `${id}-arc2`, `${id}-arc3`, `${id}-arc4`];

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 393 852" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-base`} x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#3CB8F0" />
          <stop offset="50%" stopColor="#0A6FE8" />
          <stop offset="100%" stopColor="#0035A0" />
        </linearGradient>
        <linearGradient id={`${id}-arc1`} x1="0.8" y1="0" x2="0.2" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#A8EAFF" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#70D8FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#5ED4FF" stopOpacity="0.05" />
          {animated && <animateTransform attributeName="gradientTransform" type="translate" values="0 -0.3; 0 0.3; 0 -0.3" dur="6s" repeatCount="indefinite" />}
        </linearGradient>
        <linearGradient id={`${id}-arc2`} x1="0.7" y1="0" x2="0.3" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#6DDDFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#44BBFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1A90FF" stopOpacity="0.05" />
          {animated && <animateTransform attributeName="gradientTransform" type="translate" values="0 0.3; 0 -0.3; 0 0.3" dur="7s" repeatCount="indefinite" />}
        </linearGradient>
        <linearGradient id={`${id}-arc3`} x1="0.6" y1="0" x2="0.4" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#50C8FF" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#2AA0F0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0A6FE8" stopOpacity="0.05" />
          {animated && <animateTransform attributeName="gradientTransform" type="translate" values="0 -0.2; 0 0.4; 0 -0.2" dur="8s" repeatCount="indefinite" />}
        </linearGradient>
        <linearGradient id={`${id}-arc4`} x1="0.5" y1="0" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#1A5FAA" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#0D4080" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#003070" stopOpacity="0.05" />
          {animated && <animateTransform attributeName="gradientTransform" type="translate" values="0 0.2; 0 -0.3; 0 0.2" dur="5s" repeatCount="indefinite" />}
        </linearGradient>
      </defs>
      <rect width="393" height="852" fill={`url(#${id}-base)`} />
      {bands.map((d, i) => (
        <path key={i} className={animated ? driftClasses[i] : undefined} d={d} fill={`url(#${gradIds[i]})`} />
      ))}
    </svg>
  );
}

