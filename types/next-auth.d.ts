import type { DefaultSession } from "next-auth"
import type { UserRole } from "@/types/enums"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole
  }
}
