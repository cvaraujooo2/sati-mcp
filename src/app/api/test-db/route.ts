import { supabase } from '@/lib/supabase/client';

export async function GET() {
  const { data, error } = await supabase
    .from('hyperfocus')
    .select('*')
    .limit(1);

  if (error) {
    return Response.json({ data: null, error }, { status: 500 });
  }

  return Response.json({ data, error: null });
}

