import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// In-memory store for rate limiting
// In production, use Redis or another distributed cache
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const MAX_REQUESTS = process.env.NEXT_PUBLIC_API_RATE_LIMIT ? parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT) : 100;
const WINDOW_MS = process.env.NEXT_PUBLIC_API_RATE_LIMIT_WINDOW ? parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT_WINDOW) : 60000; // 1 minute

/**
 * Middleware for ML API endpoints
 * - Authenticates user
 * - Implements rate limiting
 * - Validates API key for external services
 */
export async function mlApiMiddleware(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const identifier = `${user.id}:${ip}`;
    
    const now = Date.now();
    const userRateLimit = rateLimit.get(identifier);

    // Reset rate limit if window has passed
    if (userRateLimit && now > userRateLimit.resetTime) {
      rateLimit.delete(identifier);
    }

    // Check if user has exceeded rate limit
    if (userRateLimit && userRateLimit.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Update rate limit counter
    if (userRateLimit) {
      userRateLimit.count += 1;
    } else {
      rateLimit.set(identifier, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
    }

    // 3. Validate required API keys are set
    // For OpenAI endpoints
    if (req.nextUrl.pathname.includes('/chatbot') && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Continue to the actual API handler
    return null;
  } catch (error) {
    console.error('ML API middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error in middleware' },
      { status: 500 }
    );
  }
}