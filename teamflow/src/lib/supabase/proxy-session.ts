import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types";

// Rafraîchit la session Supabase et protège le groupe (app).
// Le client Supabase reste instancié dans src/lib/supabase/* (frontière AR10) ;
// src/proxy.ts ne fait qu'appeler ce helper.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Ne rien exécuter entre createServerClient et getUser() (refresh de session).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ⚠️ TEMPORAIRE — DEV ONLY (à RETIRER quand la Story 1.2 « Authentification & rôles » sera mergée).
  // Tant que le flux de login (1.2) n'existe pas, on ouvre automatiquement une session
  // pour un compte de seed afin de pouvoir naviguer dans le groupe (app) et voir les
  // données réelles. Gaté par env (DEV_AUTOLOGIN, défini dans .env.local non versionné) :
  // sans le flag, comportement de prod normal (redirection /login). Sécurité DB inchangée.
  if (!user && process.env.DEV_AUTOLOGIN === "true") {
    await supabase.auth.signInWithPassword({
      email: process.env.DEV_AUTOLOGIN_EMAIL ?? "manager@teamflow.dev",
      password: process.env.DEV_AUTOLOGIN_PASSWORD ?? "Password123!",
    });
    // signInWithPassword a écrit les cookies de session (request + supabaseResponse) :
    // on laisse passer la requête, la session est désormais établie.
    return supabaseResponse;
  }
  // ⚠️ FIN DU BLOC TEMPORAIRE — DEV ONLY.

  const path = request.nextUrl.pathname;
  const isPublic = path === "/" || path.startsWith("/login");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Toujours retourner supabaseResponse pour préserver les cookies de session.
  return supabaseResponse;
}
