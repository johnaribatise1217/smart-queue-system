import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAuthHeader } from "backend/middleware/cookieHelper";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import notFound from "./not-found";
import EditCycleClient from "@/app/_components/admin/EditCycleClient";

interface PageProps {
  params: { cycleId: string };
}

async function fetchCycle(cycleId: string) {
  const authHeader = await getAuthHeader()
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/cycle/admin/${cycleId}`,
    { 
      method: "GET",
      cache: "no-store",
      ...authHeader
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export default async function EditCyclePage({ params }: PageProps){
  const session = await getServerSession(
    authOptions({} as NextApiRequest, {} as NextApiResponse)
  );

  const cycle = await fetchCycle(params.cycleId);
  console.log("Fetched cycle:", cycle);
  if (!cycle) notFound();

  return (
    <EditCycleClient
      cycle={cycle}
      adminId={session?.user?._id}
    />
  )
}