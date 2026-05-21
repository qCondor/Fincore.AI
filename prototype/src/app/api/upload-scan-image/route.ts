import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(API_ENDPOINTS.uploadScanImage, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to upload scan image" },
      { status: 503 }
    );
  }
}
