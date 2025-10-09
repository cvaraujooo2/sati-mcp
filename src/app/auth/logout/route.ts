import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { authLogger } from '@/lib/utils/logger';

const log = authLogger;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('sati-auth-token')?.value;
    
    if (token) {
      // Invalidar sessão no Supabase
      await supabase.auth.signOut();
      log.info('User signed out');
    }
    
    // Remover cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' }
    );
    
    response.cookies.delete('sati-auth-token');
    
    return response;
    
  } catch (error) {
    log.error({ error }, 'Error during logout');
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

