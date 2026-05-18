import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Welcome from "./_components/welcome/welcome";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function Home() {
  const session = await getServerSession(authOptions(
    {} as NextApiRequest, 
    {} as NextApiResponse
  ));

  if (!session) redirect("/login");

  if(session.user?.role == "admin") redirect("/admin/dashboard");
  if(session.user?.role == "user") redirect("/user/dashboard");

  return <Welcome />;
}