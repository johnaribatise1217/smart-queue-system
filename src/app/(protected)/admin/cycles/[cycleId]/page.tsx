import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { NextApiRequest, NextApiResponse } from "next";
import CycleDetailsClient from "@/app/_components/admin/CycleDetailsClient";
import { getAuthHeader } from "backend/middleware/cookieHelper";

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

export default async function CycleDetailPage({ params }: PageProps) {
  const session = await getServerSession(
    authOptions({} as NextApiRequest, {} as NextApiResponse)
  );

  const cycle = await fetchCycle(params.cycleId);
  console.log("Fetched cycle:", cycle);
  if (!cycle) notFound();

  return (
    <CycleDetailsClient
      cycle={cycle}
      adminId={session?.user?._id}
    />
  );
}