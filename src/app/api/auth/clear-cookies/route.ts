import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear all NextAuth related cookies
    const nextAuthCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token', 
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.csrf-token'
    ]
    
    const response = NextResponse.json({ success: true, message: 'Cookies cleared' })
    
    nextAuthCookies.forEach(cookieName => {
      // Delete cookie for current domain
      response.cookies.delete(cookieName)
      // Also try to delete with different paths
      response.cookies.delete({
        name: cookieName,
        path: '/',
      })
    })
    
    return response
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cookies' },
      { status: 500 }
    )
  }
}
