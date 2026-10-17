import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Arrivée depuis le lien de l'e-mail : ?token_hash=...&type=email
// (fonctionne même si le lien s'ouvre dans un autre navigateur que celui de la demande).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  if (token_hash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "Lien invalide ou expiré. Redemandez un e-mail.");
  return NextResponse.redirect(url);
}
