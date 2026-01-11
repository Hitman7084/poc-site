import { withAuth } from 'next-auth/middleware'

// Protect all routes except /login and /api/auth
export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (login page)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!login|api/auth|_next|favicon.ico|sitemap.xml).*)',
  ],
}
