import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Login and auth routes — always pass through immediately (no network call)
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  // For protected routes: use getSession() — reads cookie locally, no network round-trip
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirectToLogin(request);
  }

  // Role-based redirect only from root "/" — students render "/" directly (it's their home page)
  if (pathname === "/") {
    return redirectByRole(request, session.user.id, supabase, supabaseResponse);
  }

  return supabaseResponse;
}

/**
 * Redireciona para o login descartando os cookies de sessão do Supabase.
 *
 * Sem isso, um refresh token já consumido (rotacionado, revogado ou de um
 * projeto recriado) fica no navegador indefinidamente: cada request tenta
 * renovar, falha com "Invalid Refresh Token: Refresh Token Not Found" e
 * repete. Limpar aqui encerra o ciclo no primeiro redirect.
 */
function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  // O @supabase/ssr grava em `sb-<ref>-auth-token`, podendo fatiar em
  // `.0`, `.1`, ... — por isso limpamos por prefixo, não por nome exato.
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}

async function redirectByRole(
  request: NextRequest,
  userId: string,
  supabase: ReturnType<typeof createServerClient>,
  supabaseResponse: NextResponse
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (profile?.role === "mentor") {
    return NextResponse.redirect(new URL("/mentor/projeto", request.url));
  }
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
