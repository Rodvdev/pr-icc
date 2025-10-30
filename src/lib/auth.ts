import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
// import { PrismaAdapter } from "@next-auth/prisma-adapter" // Not needed with JWT strategy
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  // Don't use PrismaAdapter with JWT strategy and credentials provider
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    // Provider para usuarios del sistema (ADMIN/AGENT)
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user || !user.isActive) {
            return null
          }

          // Verify password using bcrypt
          const isValid = await bcrypt.compare(credentials.password, user.password || "")
          
          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            userType: "USER" as const,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }),
    // Provider para clientes
    CredentialsProvider({
      id: "client-credentials",
      name: "Client Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        dni: { label: "DNI", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if ((!credentials?.email && !credentials?.dni) || !credentials?.password) {
          return null
        }

        try {
          // Find client by email or DNI
          const client = await prisma.client.findUnique({
            where: credentials.email
              ? { email: credentials.email }
              : { dni: credentials.dni! }
          })

          if (!client) {
            return null
          }

          if (client.status !== 'ACTIVE') {
            return null
          }

          if (!client.hashedPassword) {
            return null
          }

          // Verify password using bcrypt
          const isValid = await bcrypt.compare(credentials.password, client.hashedPassword)
          
          if (!isValid) {
            return null
          }

          return {
            id: client.id,
            email: client.email,
            name: client.name,
            role: "CLIENT",
            image: null,
            userType: "CLIENT" as const,
          }
        } catch (error) {
          console.error('[Auth] Client auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.userType = user.userType
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.userType = token.userType as "USER" | "CLIENT" | undefined
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signOut({ token, session }) {
      // Clean up any custom session data if needed
      console.log('User signed out:', token?.email || session?.user?.email)
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
