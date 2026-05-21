"use client";

/**
 * ChatScreen.tsx
 * Full iOS-native chat UI for the Fincore.AI "Faith" financial coach.
 *
 * Design system tokens (from globals.css / tailwind theme):
 *   primary   #005FCC   accent    #00C2FF
 *   surface   #F5F7FA   text-primary #1D1D1F
 *   Glassmorphism via .liquid-glass / .glass-dark utility classes
 *   SF Pro font stack via --font-sans / --font-body
 */

import {
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  useState,
} from "react";
import {
  Send,
  Mic,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Home,
  Brain,
  MessageCircle,
  Camera,
  Landmark,
  BarChart3,
  Lock,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { Haptics } from "@/lib/haptics";
import type { ChatMessage, ScanContext } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated three-dot typing indicator */
function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      {/* Faith avatar */}
      <FaithAvatar />
      <div className="bg-white/95 backdrop-blur-xl rounded-[18px] rounded-bl-[4px] px-4 py-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-white/80">
        <div className="flex items-center gap-1.5 h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[6px] h-[6px] rounded-full bg-white"
              style={{
                animation: "typing-bounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Faith's gradient avatar badge */
function FaithAvatar() {
  return (
    <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-[#00C2FF] to-[#005FCC] flex items-center justify-center shrink-0 shadow-sm">
      <span className="text-white text-[13px] font-bold leading-none select-none">
        F
      </span>
    </div>
  );
}

/** Streaming cursor blink appended while a bubble is still receiving chunks */
function StreamCursor() {
  return (
    <span
      className="inline-block w-[2px] h-[14px] bg-[#005FCC] ml-[2px] align-middle rounded-full"
      style={{ animation: "cursor-blink 0.8s step-end infinite" }}
    />
  );
}

/** Individual chat bubble */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  const time = message.timestamp.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div
            className="rounded-[18px] rounded-br-[4px] px-4 py-3 shadow-[0_1px_6px_rgba(0,95,204,0.25)]"
            style={{
              background: "linear-gradient(135deg, #005FCC 0%, #0070EE 100%)",
            }}
          >
            <p className="text-[14px] text-white leading-relaxed font-body whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <span className="text-[10px] text-white/35 mt-1 mr-2 block text-right select-none">
            {time}
          </span>
        </div>
      </div>
    );
  }

  // Assistant bubble
  return (
    <div className="flex gap-2.5 items-end">
      <FaithAvatar />
      <div className="max-w-[78%]">
        <div className="bg-white/95 backdrop-blur-xl rounded-[18px] rounded-bl-[4px] px-4 py-3 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-white/80">
          <p className="text-[14px] text-[#1D1D1F] leading-relaxed font-body whitespace-pre-wrap break-words">
            {message.content || <span className="opacity-0">​</span>}
            {message.streaming && message.content && <StreamCursor />}
          </p>
        </div>
        <span className="text-[10px] text-white/35 mt-1 ml-2 block select-none">
          {time}
        </span>
      </div>
    </div>
  );
}

/** Empty-state prompt shown before first message */
function EmptyState({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  const suggestions = [
    "Why do I overspend at weekends?",
    "Help me build an emergency fund",
    "Should I invest or pay off debt?",
    "How can I stop impulse buying?",
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pb-8 gap-6">
      {/* Hero badge */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center shadow-[0_8px_32px_rgba(0,95,204,0.35)]"
          style={{
            background:
              "linear-gradient(145deg, #00C2FF 0%, #005FCC 60%, #004AAD 100%)",
          }}
        >
          <Sparkles size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h3 className="font-sans text-[20px] font-bold text-white leading-tight">
            Hi, I&apos;m Faith
          </h3>
          <p className="text-[13px] text-white/60 mt-1 leading-snug">
            Your personality-aware financial coach
          </p>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="w-full flex flex-col gap-2">
        <p className="text-[11px] font-semibold text-white/40 text-center uppercase tracking-widest mb-1">
          Try asking
        </p>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="w-full text-left px-4 py-3 rounded-2xl liquid-glass text-[13px] text-white/80 font-body leading-snug active:scale-[0.98] transition-transform"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Inline error banner */
function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-4 mb-2 flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-[#FF3B30]/15 border border-[#FF3B30]/25 backdrop-blur-sm">
      <AlertCircle size={15} className="text-[#FF3B30] shrink-0 mt-0.5" />
      <p className="text-[12px] text-white/80 leading-snug flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="text-[10px] font-semibold text-[#FF3B30]/80 shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChatScreenProps {
  /** User's Fincore ID — forwarded to /chat as user_id */
  userId?: string;
  /** API base URL — defaults to /api (Next.js API routes) */
  apiBaseUrl?: string;
  /** Optional back-arrow handler for parent navigation */
  onBack?: () => void;
  /** Optional menu / drawer handler */
  onMenuOpen?: () => void;
  /** Optional home navigation handler */
  onHome?: () => void;
  /** Navigation handlers for bottom nav */
  onNavigateProfile?: () => void;
  onNavigateScan?: () => void;
  onNavigateBanking?: () => void;
  onNavigateAnalytics?: () => void;
  /** Whether user has OCEAN scores (to show/hide Faith lock) */
  hasOceanScores?: boolean;
  /** Avatar initials shown in the top-right */
  userInitials?: string;
  /** Optional scan context from Feels Like results */
  scanContext?: ScanContext | null;
  /** Session ID to load (when selecting from history) */
  activeSessionId?: string | null;
  /** Callback when a new session is started */
  onNewSession?: (sessionId: string) => void;
  /** Callback when avatar is clicked (navigate to profile) */
  onAvatarClick?: () => void;
  /** Callback to start a new chat */
  onNewChat?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatScreen({
  userId,
  apiBaseUrl = "/api",
  onBack,
  onMenuOpen,
  onHome,
  onNavigateProfile,
  onNavigateScan,
  onNavigateBanking,
  onNavigateAnalytics,
  hasOceanScores = true,
  userInitials,
  scanContext = null,
  activeSessionId = null,
  onNewSession,
  onAvatarClick,
  onNewChat,
}: ChatScreenProps) {
  const { user } = useAuth();
  const effectiveUserId = userId ?? user?.id ?? "";
  const effectiveInitials = userInitials ?? "?";

  const {
    messages,
    input,
    setInput,
    isTyping,
    error,
    sendMessage,
    clearError,
    setScanContext,
    historyLoaded,
    sessionId,
    loadSession,
    startNewSession,
    sendMessageWithSession,
  } = useChat({ baseUrl: apiBaseUrl, userId: effectiveUserId, scanContext });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);
  const prevActiveSessionRef = useRef<string | null>(null);

  // Auto-scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load session when activeSessionId changes
  useEffect(() => {
    if (activeSessionId && activeSessionId !== prevActiveSessionRef.current) {
      prevActiveSessionRef.current = activeSessionId;
      loadSession(activeSessionId);
    } else if (activeSessionId === null && prevActiveSessionRef.current !== null) {
      // Parent requested a new session (cleared activeSessionId)
      prevActiveSessionRef.current = null;
      startNewSession();
    }
  }, [activeSessionId, loadSession, startNewSession]);

  // Notify parent when session ID changes (for history refresh)
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      onNewSession?.(sessionId);
    }
  }, [sessionId, messages.length, onNewSession]);

  // Update scan context when prop changes (e.g., navigating from scan results)
  useEffect(() => {
    if (scanContext) {
      setScanContext(scanContext);
    }
  }, [scanContext, setScanContext]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    await sendMessage();
  }, [input, sendMessage]);

  const handleSuggestion = useCallback(
    async (text: string) => {
      const newSessionId = startNewSession();
      await sendMessageWithSession(text, newSessionId);
    },
    [sendMessageWithSession, startNewSession]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (not Shift+Enter)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const showEmpty = messages.length === 0 && !isTyping && historyLoaded;
  const showLoading = !historyLoaded && messages.length === 0;

  return (
    <>
      {/* Inject keyframe animations into the document once */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes faith-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .faith-msg-enter {
          animation: faith-slide-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      <div className="h-full flex flex-col relative overflow-hidden">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="relative z-10 safe-top px-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Back / menu button */}
            {onBack ? (
              <button
                onClick={onBack}
                className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors shrink-0"
                aria-label="Go back"
              >
                <ChevronLeft size={26} className="text-white" strokeWidth={2.2} />
              </button>
            ) : (
              <button
                onClick={onMenuOpen}
                className="w-[42px] h-[42px] rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors shrink-0"
                aria-label="Open menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            )}

            {/* Title block */}
            <div className="flex-1 min-w-0">
              <h2 className="font-sans text-[28px] font-bold text-white leading-none tracking-tight">
                Faith
              </h2>
              <p className="text-[12px] text-white/50 leading-none mt-0.5">
                Your financial AI companion
              </p>
            </div>

            {/* New chat button */}
            <button
              onClick={onNewChat}
              className="w-[38px] h-[38px] rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors"
              aria-label="New chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* User avatar */}
            <button
              onClick={onAvatarClick}
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[13px] font-semibold ring-[1.5px] ring-white/60 shrink-0 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #005FCC 0%, #00C2FF 100%)",
              }}
              aria-label="View profile"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full pointer-events-none" />
              {effectiveInitials}
            </button>
          </div>
        </div>

        {/* ── Messages area ─────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-4 relative z-10 hide-scrollbar"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 0%, black calc(100% - 48px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black calc(100% - 48px), transparent 100%)",
          }}
        >
          {showLoading ? (
            <div className="flex items-center justify-center py-8 flex-1">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : showEmpty ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <div className="flex flex-col gap-4 pb-4 pt-2">
              {/* Date pill */}
              <div className="flex items-center justify-center py-1">
                <span className="text-[11px] font-medium text-white/80 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full select-none">
                  Today
                </span>
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className="faith-msg-enter">
                  <MessageBubble message={msg} />
                </div>
              ))}

              {/* Typing indicator — shown while waiting for first chunk */}
              {isTyping && (
                <div className="faith-msg-enter">
                  <TypingIndicator />
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </div>

        {/* ── Error banner ──────────────────────────────────────────────── */}
        {error && (
          <div className="relative z-10 shrink-0">
            <ErrorBanner message={error} onDismiss={clearError} />
          </div>
        )}

        {/* ── Input bar with slide-in nav ─────────────────────────────────── */}
        <div className="relative z-10 safe-bottom pt-2 px-4 shrink-0">
          <div className="relative h-[50px]">
            {/* Navbar — slides in from left */}
            <div
              className={`absolute inset-0 liquid-glass rounded-[32px] flex items-center justify-between px-2 transition-all duration-500 ease-out ${navExpanded ? "translate-x-0 opacity-100 z-20" : "-translate-x-full opacity-0 z-0 pointer-events-none"}`}
              onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.swipeX = String(e.touches[0].clientX); }}
              onTouchEnd={(e) => { const diff = e.changedTouches[0].clientX - Number((e.currentTarget as HTMLElement).dataset.swipeX); if (diff < -60) setNavExpanded(false); }}
            >
              <button onClick={() => { setNavExpanded(false); onNavigateProfile?.(); }} className="flex flex-col items-center justify-center w-[56px]">
                <Brain size={18} className="text-white/70" />
                <span className="text-[9px] text-white/50 mt-0.5">Profile</span>
              </button>
              <button className="flex flex-col items-center justify-center w-[56px]">
                <MessageCircle size={18} className="text-white" />
                <span className="text-[9px] text-white mt-0.5 font-semibold">Faith</span>
              </button>
              <button onClick={() => { setNavExpanded(false); onNavigateScan?.(); }} className="flex flex-col items-center justify-center w-[56px]">
                <Camera size={18} className="text-white/70" />
                <span className="text-[9px] text-white/50 mt-0.5">Feels Like</span>
              </button>
              <button onClick={() => { setNavExpanded(false); onNavigateBanking?.(); }} className="flex flex-col items-center justify-center w-[56px]">
                <Landmark size={18} className="text-white/70" />
                <span className="text-[9px] text-white/50 mt-0.5">Banking</span>
              </button>
              <button onClick={() => { setNavExpanded(false); onNavigateAnalytics?.(); }} className="flex flex-col items-center justify-center w-[56px]">
                <BarChart3 size={18} className="text-white/70" />
                <span className="text-[9px] text-white/50 mt-0.5">Analytics</span>
              </button>
              <button onClick={() => setNavExpanded(false)} className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-[16px]">
                <ChevronRight size={14} className="text-white/30" />
              </button>
            </div>

            {/* Input bar — slides out to right when nav expanded */}
            <div className={`absolute inset-0 flex items-center gap-2 transition-all duration-500 ease-out ${navExpanded ? "translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"}`}>
              {/* Home button */}
              <button
                onClick={() => setNavExpanded(true)}
                className="w-[42px] h-[42px] rounded-full liquid-glass flex items-center justify-center shrink-0"
                aria-label="Open navigation"
              >
                <Home size={18} className="text-white" />
              </button>

              {/* Input field */}
              <div
                className={`flex-1 min-w-0 liquid-glass rounded-[32px] flex items-center gap-1 px-2 h-[50px] transition-all duration-300 ${
                  inputFocused
                    ? "shadow-[0_0_0_2px_rgba(0,95,204,0.35),0_4px_24px_rgba(0,0,0,0.1)]"
                    : ""
                }`}
              >
                {/* Plus button */}
                <button
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 hover:bg-white/10 active:bg-white/20 transition-colors"
                  aria-label="Attach"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  rows={1}
                  placeholder="Ask Faith anything…"
                  className="flex-1 bg-transparent outline-none resize-none text-[15px] text-white placeholder:text-white/45 leading-snug font-body py-[7px] max-h-[50px] overflow-hidden"
                  style={{ lineHeight: "1.45" }}
                />

                {/* Mic — visible only when input is empty */}
                {!input.trim() && (
                  <button
                    className="w-[36px] h-[36px] flex items-center justify-center shrink-0 hover:bg-white/10 active:bg-white/20 transition-colors rounded-full"
                    aria-label="Voice input"
                  >
                    <Mic size={18} className="text-white/50" fill="rgba(255,255,255,0.5)" />
                  </button>
                )}

                {/* Send button */}
                <button
                  onClick={() => {
                    Haptics.light();
                    handleSend();
                  }}
                  disabled={!input.trim() || isTyping}
                  className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                    input.trim() && !isTyping
                      ? "bg-[#005FCC] shadow-[0_2px_8px_rgba(0,95,204,0.45)] active:scale-95 hover:bg-[#0070EE]"
                      : "bg-white/15 cursor-default"
                  }`}
                  aria-label="Send message"
                >
                  {isTyping ? (
                    <span
                      className="w-[10px] h-[10px] rounded-[2px] bg-white/60"
                      style={{ animation: "cursor-blink 0.9s step-end infinite" }}
                    />
                  ) : (
                    <Send size={14} className={input.trim() ? "text-white" : "text-white/40"} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Clear history button (appears after conversation starts) ─── */}
        {messages.length > 0 && (
          <button
            onClick={() => {
              /* Expose clearHistory via prop in a real app */
            }}
            className="absolute right-[64px] z-20 opacity-0 pointer-events-none"
            style={{ top: 'calc(60px + env(safe-area-inset-top, 0px))' }}
            aria-hidden
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </>
  );
}
