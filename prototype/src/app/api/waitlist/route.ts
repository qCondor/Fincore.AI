import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-config';

/**
 * POST /api/waitlist
 * Adds an email to the feature waitlist stored in S3.
 *
 * Body: { email: string, feature: 'banking' | 'analytics' }
 * Response: { success: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, feature } = body;

    if (!email || !feature) {
      return NextResponse.json(
        { error: 'email and feature required' },
        { status: 400 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, feature }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[waitlist] Error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
