import { redirect } from 'next/navigation'

/**
 * Home page - proxy handles redirect based on auth status
 * This page should rarely be seen as proxy redirects:
 * - Authenticated users -> /dashboard
 * - Unauthenticated users -> /login
 */
export default function HomePage() {
  // Fallback redirect in case proxy doesn't catch it
  redirect('/login')
}

