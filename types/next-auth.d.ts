import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: string
      sessionToken?: string
    }
    error?: string
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role?: string
    sessionToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
    sessionToken?: string
  }
}
