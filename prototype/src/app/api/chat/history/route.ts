import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-config';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id');
  const wantSessions = request.nextUrl.searchParams.get('sessions') === 'true';
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  try {
    const apiBaseUrl = getApiBaseUrl();

    // If requesting session list
    if (wantSessions) {
      const response = await fetch(
        `${apiBaseUrl}/users/${userId}/conversations?sessions=true`,
        { method: 'GET' }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ sessions: [] });
        }
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // If requesting messages for a specific session
    if (sessionId) {
      const response = await fetch(
        `${apiBaseUrl}/users/${userId}/conversations/${sessionId}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ messages: [] });
        }
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Default: fetch most recent conversation history
    const response = await fetch(
      `${apiBaseUrl}/users/${userId}/conversations`,
      { method: 'GET' }
    );

    if (!response.ok) {
      // No history yet is fine
      if (response.status === 404) {
        return NextResponse.json({ messages: [] });
      }
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[chat/history] Error:', error);
    // Return appropriate empty response based on request type
    if (wantSessions) {
      return NextResponse.json({ sessions: [] });
    }
    return NextResponse.json({ messages: [] });
  }
}
