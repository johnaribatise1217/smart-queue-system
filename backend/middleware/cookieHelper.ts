import { cookies} from "next/headers"

export const getAuthCookieName = () : string =>{
  const cookieName = process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
  return cookieName
}

export const getAuthHeader = async () => {
  //get Cookie from chrome browser
  const cookieName : string = getAuthCookieName()
  const cookieStore = await cookies()

  const nextAuthSessionToken = cookieStore.get(cookieName) 

  return {
    headers : {
      Cookie : `${nextAuthSessionToken?.name}=${nextAuthSessionToken?.value}`
    }
  }
}