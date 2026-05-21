"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  /** True while the assistant is still streaming this bubble */
  streaming?: boolean;
}

export interface ScanContext {
  scan_id: string;
  product_name?: string;
  overall_score?: number;
  estimated_price?: number;
  psychology_cost?: number;
  verdict?: string;
}

export interface UseChatOptions {
  /** API base URL — defaults to /api (Next.js API routes) */
  baseUrl?: string;
  /** Fincore user ID sent with every request */
  userId?: string;
  /** Optional scan context to inject into first message */
  scanContext?: ScanContext | null;
  /** Optional session ID for tracing continuity */
  sessionId?: string;
  /** If true, start with a fresh session (no history load) */
  freshSession?: boolean;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  isTyping: boolean;
  error: string | null;
  sendMessage: (text?: string) => Promise<void>;
  clearError: () => void;
  clearHistory: () => void;
  setScanContext: (ctx: ScanContext | null) => void;
  historyLoaded: boolean;
  /** Current session ID */
  sessionId: string;
  /** Load messages from a specific session */
  loadSession: (sessionId: string) => Promise<void>;
  /** Start a new fresh session, returns the new session ID */
  startNewSession: () => string;
  /** Send message with a specific session ID (for starting new chats) */
  sendMessageWithSession: (text: string, sessionId: string) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatSseChunk(raw: string): string {
  // Each SSE line looks like:  data: <JSON-encoded string>\n\n
  // The server JSON-encodes every chunk so embedded newlines can't break the
  // single-line SSE format.  We JSON.parse each payload here to recover the
  // original text (including paragraph breaks).
  // A single fetch-stream read may contain multiple SSE events.
  return raw
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6))                 // strip "data: "
    .filter((payload) => payload !== "[DONE]")    // terminal sentinel
    .map((payload) => {
      try {
        return JSON.parse(payload) as string;
      } catch {
        // Fallback: treat as raw text if somehow not JSON (e.g. old server)
        return payload;
      }
    })
    .join("");
}

// ─── Hook ────────────────────────────────────────────────────────────────────

// Helper to generate a unique session ID
function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat({
  baseUrl = "/api",
  userId,
  scanContext: initialScanContext = null,
  sessionId: initialSessionId,
  freshSession = false,
}: UseChatOptions = {}): UseChatReturn {
  const { user } = useAuth();
  const effectiveUserId = userId ?? user?.id ?? "";

  // Session ID state - can change when loading different sessions
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    initialSessionId ?? generateSessionId()
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanContext, setScanContext] = useState<ScanContext | null>(initialScanContext);
  const [historyLoaded, setHistoryLoaded] = useState(freshSession);

  // Keep a ref so we can abort in-flight streams if needed
  const abortRef = useRef<AbortController | null>(null);
  // Track if scan context has been sent (only send once per scan)
  const scanContextSentRef = useRef<string | null>(null);

  // Load conversation history on mount (for current session only)
  useEffect(() => {
    if (!effectiveUserId || historyLoaded) return;

    async function loadHistory() {
      try {
        // Always filter by current session ID to avoid loading all history
        const response = await fetch(
          `${baseUrl}/chat/history?user_id=${effectiveUserId}&session_id=${currentSessionId}`
        );
        if (!response.ok) return;

        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          // Convert backend messages to ChatMessage format
          const loadedMessages: ChatMessage[] = data.messages.map((msg: { role: string; content: string; timestamp: string }, index: number) => ({
            id: `history_${index}`,
            role: msg.role as MessageRole,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            streaming: false,
          }));
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.warn('[useChat] Failed to load history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    }

    loadHistory();
  }, [effectiveUserId, baseUrl, historyLoaded, currentSessionId]);

  const sendMessage = useCallback(
    async (text?: string, overrideSessionId?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isTyping) return;

      // Use override session ID if provided (for starting new chats)
      const sessionToUse = overrideSessionId ?? currentSessionId;

      // Clear previous error, reset input
      setError(null);
      setInput("");

      // 1. Append user bubble immediately (or replace all if starting new session)
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      // If overrideSessionId is set, this is a new session - start fresh
      if (overrideSessionId) {
        setMessages([userMsg]);
        setCurrentSessionId(overrideSessionId);
      } else {
        setMessages((prev) => [...prev, userMsg]);
      }

      // 2. Show typing indicator and open the stream immediately
      setIsTyping(true);

      const assistantId = uid();
      let firstChunk = true;

      // 3. Open the SSE stream right away — typing indicator stays visible
      //    until the first real token arrives
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // Set 90-second timeout for SSE stream
      const timeoutId = setTimeout(() => {
        abortRef.current?.abort();
      }, 90000);

      try {
        const response = await fetch(`${baseUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: effectiveUserId,
            message: trimmed,
            session_id: sessionToUse,
            // Include scan context if present and not yet sent
            ...(scanContext && scanContextSentRef.current !== scanContext.scan_id
              ? {
                  scan_id: scanContext.scan_id,
                  scan_data: {
                    product_name: scanContext.product_name,
                    overall_score: scanContext.overall_score,
                    estimated_price: scanContext.estimated_price,
                    psychology_cost: scanContext.psychology_cost,
                    verdict: scanContext.verdict,
                  },
                }
              : {}),
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "Unknown error");
          throw new Error(`${response.status}: ${detail}`);
        }

        // Mark scan context as sent so we don't re-send it
        if (scanContext) {
          scanContextSentRef.current = scanContext.scan_id;
        }

        if (!response.body) throw new Error("No response body from /chat");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // 4. Read chunks — on first real text, swap indicator for bubble
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          const newText = parts.map((part) => formatSseChunk(part)).join("");

          if (newText) {
            if (firstChunk) {
              // Hide typing indicator and inject the assistant bubble
              firstChunk = false;
              setIsTyping(false);
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant" as const,
                  content: newText,
                  timestamp: new Date(),
                  streaming: true,
                },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + newText }
                    : m
                )
              );
            }
          }
        }

        // Flush any remaining buffer
        if (buffer) {
          const tail = formatSseChunk(buffer);
          if (tail) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + tail }
                  : m
              )
            );
          }
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        // Check if this was a timeout abort
        const isTimeout = (err as Error)?.name === "AbortError";
        if (isTimeout) {
          setError("Request timed out. Please check your connection and try again.");
          // Show timeout message in chat
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "Sorry, the request timed out. Please check your connection and try again.",
                    streaming: false,
                  }
                : m
            )
          );
          return;
        }

        const msg =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(msg);

        // Replace the empty assistant bubble with an error notice
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, I couldn't reach the server right now. Please try again.",
                  streaming: false,
                }
              : m
          )
        );
      } finally {
        clearTimeout(timeoutId);
        // Mark streaming done
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        setIsTyping(false);
      }
    },
    [baseUrl, effectiveUserId, input, isTyping, scanContext, currentSessionId]
  );

  const clearError = useCallback(() => setError(null), []);
  const clearHistory = useCallback(() => setMessages([]), []);

  // Load messages from a specific session
  const loadSession = useCallback(
    async (sessionId: string) => {
      if (!effectiveUserId) return;

      // Update current session
      setCurrentSessionId(sessionId);
      setMessages([]);
      setHistoryLoaded(false);

      try {
        const response = await fetch(
          `${baseUrl}/chat/history?user_id=${effectiveUserId}&session_id=${sessionId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setHistoryLoaded(true);
            return;
          }
          throw new Error(`Failed to load session: ${response.status}`);
        }

        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
          const loadedMessages: ChatMessage[] = data.messages.map(
            (
              msg: { role: string; content: string; timestamp: string },
              index: number
            ) => ({
              id: `session_${sessionId}_${index}`,
              role: msg.role as MessageRole,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              streaming: false,
            })
          );
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error("[useChat] Failed to load session:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load conversation"
        );
      } finally {
        setHistoryLoaded(true);
      }
    },
    [baseUrl, effectiveUserId]
  );

  // Start a fresh new session, returns the new session ID
  const startNewSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setHistoryLoaded(true);
    scanContextSentRef.current = null;
    return newSessionId;
  }, []);

  // Convenience wrapper to send message with a specific session ID
  const sendMessageWithSession = useCallback(
    async (text: string, sessionId: string) => {
      await sendMessage(text, sessionId);
    },
    [sendMessage]
  );

  return {
    messages,
    input,
    setInput,
    isTyping,
    error,
    sendMessage,
    clearError,
    clearHistory,
    setScanContext,
    historyLoaded,
    sessionId: currentSessionId,
    loadSession,
    startNewSession,
    sendMessageWithSession,
  };
}
