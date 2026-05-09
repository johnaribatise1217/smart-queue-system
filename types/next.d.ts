import { IUser } from "../backend/model/user"
import { NextRequest } from "next/server"

declare module "next/server" {
  interface NextRequest {
    user : IUser
  }
}