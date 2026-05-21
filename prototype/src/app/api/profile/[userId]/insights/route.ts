import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const response = await fetch(API_ENDPOINTS.profileInsights(userId));
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 503 });
  }
}
