import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

const PUBLIC_PATHS = ["/login"];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "[middleware] Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
    );
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (!user && !isPublic) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }

    if (user && pathname === "/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (err) {
    console.error("[middleware] Unexpected error:", err);
    return NextResponse.next({ request });
  }
}
