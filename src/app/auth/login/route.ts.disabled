import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { authLogger } from '@/lib/utils/logger';

const log = authLogger;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'google';
    
    log.info({ provider }, 'Initiating OAuth login');
    
    if (!['google', 'github'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid OAuth provider. Use google or github.' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
        scopes: provider === 'google' ? 'email profile' : 'user:email'
      }
    });
    
    if (error) {
      log.error({ error, provider }, 'OAuth login failed');
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    if (!data.url) {
      log.error({ provider }, 'No OAuth URL returned');
      return NextResponse.json(
        { error: 'Failed to generate OAuth URL' },
        { status: 500 }
      );
    }
    
    log.info({ provider }, 'Redirecting to OAuth provider');
    return NextResponse.redirect(data.url);
    
  } catch (error) {
    log.error({ error }, 'Unexpected error in OAuth login');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

