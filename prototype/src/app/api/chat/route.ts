import { NextRequest } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for SSE

  try {
    const body = await request.json();

    const response = await fetch(API_ENDPOINTS.chat, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(await response.text(), { status: response.status });
    }

    // Stream the SSE response through
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      return new Response("Request timed out", { status: 504 });
    }
    return new Response("Failed to connect to chat service", { status: 503 });
  }
}
