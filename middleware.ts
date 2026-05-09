import { withAuth } from "next-auth/middleware"
import { type IUser } from "backend/model/user"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    const user = req.nextauth.token?.user as IUser | undefined
    const url = req?.nextUrl?.pathname

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if(url?.startsWith("/admin") &&  user?.role !== "admin"){
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if(url?.startsWith("/user") &&  user?.role !== "user"){
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
}

