// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    unitId?: string | null
  }
  interface Session {
    user: User & {
      role?: string
      unitId?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    unitId?: string | null
  }
}