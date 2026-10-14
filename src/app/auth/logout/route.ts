import { NextRequest, NextResponse } from "next/server";

import { requestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${requestOrigin(request)}/`);
}
