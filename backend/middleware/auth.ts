import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import type { IUser } from "../model/user";

export const isAuthenticatedUser = async (
  req : NextRequest,
  event : any,
  next : any
) => {
  //get session from the jwt token
  const session = await getToken({req})

  if(!session){
    return NextResponse.json(
      {
        message : "Login first to access this route",
      },
      {status : 401}
    ) 
  }

  req.user = session.user as IUser
  return next()
}

export const authorizeRoles = (...roles : string[]) => {
  return (req : NextRequest, event : any, next : any) => {
    if(!roles.includes(req.user.role)){
      return NextResponse.json(
        {
          errMessage : `Role (${req.user.role}) is not allowed to access this resource`
        },
        {status : 403}
      )
    }

    return next()
  }
}