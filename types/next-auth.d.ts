import "next-auth"
import "next-auth/jwt"
import { IUser } from "backend/model/user"

declare module "next-auth" {
  interface Session {
    user: IUser
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: IUser
  }
}