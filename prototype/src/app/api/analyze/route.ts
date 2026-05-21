import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for Bedrock

  try {
    const body = await request.json();

    const response = await fetch(API_ENDPOINTS.analyze, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to analyze image" },
      { status: 503 }
    );
  }
}
