import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Identificación Bancaria",
  description: "Sistema automatizado de identificación de clientes para agentes bancarios",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Handle session errors gracefully (e.g., missing NEXTAUTH_SECRET or corrupted cookies)
  let session = null
  
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error('[Layout] Session error:', error)
    
    // If it's a JWT decryption error, clear the corrupted cookies
    if (error instanceof Error && error.message.includes('decryption operation failed')) {
      console.log('[Layout] Clearing corrupted JWT cookies...')
      const cookieStore = await cookies()
      
      // Clear all NextAuth related cookies
      const nextAuthCookies = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token'
      ]
      
      nextAuthCookies.forEach(async (cookieName) => {
        try {
          (await cookieStore).delete(cookieName)
        } catch {
          // Ignore deletion errors for cookies that don't exist
        }
      })
    }
    
    // Session will be null, user will need to login again
  }

  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}