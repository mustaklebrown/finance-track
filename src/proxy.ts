import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
    // We check for the session via the API route to avoid importing Node.js-only modules (like Prisma) 
    // into the Edge runtime, which causes the 'crypto' module error.
    let session = null;
    try {
        const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
        });
        if (res.ok) {
            session = await res.json();
        }
    } catch (error) {
        console.error("Auth check failed in middleware:", error);
    }

	if (!session) {
		const url = new URL("/login", request.url);
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}

export const config = {
	matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - login (login page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
    ],
};
