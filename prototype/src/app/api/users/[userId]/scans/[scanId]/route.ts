import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; scanId: string }> }
) {
  const { userId, scanId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(
      API_ENDPOINTS.userScanById(userId, scanId),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update scan" },
      { status: 503 }
    );
  }
}
