import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api");

  // Prevent infinite loop by not intercepting /api/auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  try {
    const sessionResponse = await fetch(new URL("/api/auth/get-session", request.url), {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    const sessionData = await sessionResponse.json().catch(() => null);
    const isAuthenticated = !!sessionData?.session;

    // Si non authentifié et essaie d'accéder à une route protégée
    if (!isAuthenticated) {
      if (!isPublicRoute && !isApiRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    // Si authentifié et essaie d'accéder à une route publique (ex: /login)
    if (isPublicRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch (error) {
    // En cas d'erreur de vérification, on redirige vers le login par sécurité
    if (!isPublicRoute && !isApiRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
