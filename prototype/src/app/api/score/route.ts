import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(API_ENDPOINTS.score, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let data;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid response from scoring service" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Scoring service timeout" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Failed to connect to scoring service" },
      { status: 503 }
    );
  }
}
