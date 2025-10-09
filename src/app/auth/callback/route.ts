import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { authLogger } from '@/lib/utils/logger';

const log = authLogger;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Tratar erro do OAuth provider
    if (error) {
      log.error({ error }, 'OAuth provider returned error');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}?error=oauth_${error}`
      );
    }
    
    if (!code) {
      log.warn('No code provided in OAuth callback');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}?error=no_code`
      );
    }
    
    // Trocar code por session
    log.info('Exchanging code for session');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      log.error({ error: exchangeError }, 'Failed to exchange code for session');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}?error=auth_failed`
      );
    }
    
    if (!data.session) {
      log.error('No session returned after code exchange');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}?error=no_session`
      );
    }
    
    // Criar response com cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}?success=authenticated`
    );
    
    // Configurar cookie com token
    response.cookies.set('sati-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });
    
    log.info(
      { userId: data.session.user.id },
      'User authenticated successfully'
    );
    
    return response;
    
  } catch (error) {
    log.error({ error }, 'Unexpected error in OAuth callback');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}?error=internal_error`
    );
  }
}

