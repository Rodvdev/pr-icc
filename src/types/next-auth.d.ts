import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      userType?: "USER" | "CLIENT" // Distinguir entre usuario del sistema y cliente
    }
  }

  interface User {
    role: string
    userType?: "USER" | "CLIENT"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    userType?: "USER" | "CLIENT"
  }
}
