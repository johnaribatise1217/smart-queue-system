import JoinCycleClient from "@/app/_components/user/JoinCycleClient"
import { Suspense } from "react"

export default function JoinCyclePage() {
  return (
    <Suspense fallback={<JoinCycleLoading />}>
      <JoinCycleClient />
    </Suspense>
  )
}

function JoinCycleLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#2347C5] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}