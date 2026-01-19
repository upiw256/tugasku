import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "@/lib/db"
import { User } from "@/models"
import md5 from "md5"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // 1. WAJIB: Definisikan Secret & Strategy
  secret: process.env.NEXTAUTH_SECRET, 
  session: { strategy: "jwt" },
  
  // 2. WAJIB: Beri tahu NextAuth lokasi halaman login kita
  pages: {
    signIn: "/login",
    error: "/api/auth/error", // Halaman error jika login gagal
  },

  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          await connectDB()
          
          const user = await User.findOne({ user: credentials.username })

          if (!user) {
            throw new Error("User not found.")
          }

          if (user.password !== md5(credentials.password as string)) {
            throw new Error("Invalid password.")
          }

          return {
            id: user._id.toString(),
            name: user.role,
            email: user.user, 
            role: user.role,
          }
        } catch (error) {
          console.error("Login Error:", error);
          return null; // Return null jika gagal agar NextAuth tahu
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.email = token.email as string
      }
      return session
    },
  },
})
