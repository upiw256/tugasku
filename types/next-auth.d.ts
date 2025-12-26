import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** Role user (admin/siswa) */
      role?: string
      /** ID Member dari database */
      member_id?: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    member_id?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    member_id?: string
  }
}