import Link from 'next/link'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import type { NextApiRequest, NextApiResponse } from "next"
import Image from 'next/image'
import { AdminStatCard } from '@/app/_components/admin/AdminStatCard'
import { Cycle } from "backend/model/cycle"
import dbConnect from "backend/config/dbConnect"
import {
  MdOutlineCyclone,
  MdOutlineCheckCircle,
  MdOutlinePauseCircle,
  MdOutlinePeople
} from 'react-icons/md'

interface ScheduleDay {
  day: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface CycleRow {
  _id: string;
  name: string;
  isActive: boolean;
  queues: string[];
  enrolledUsers: string[];
  schedule: ScheduleDay[];
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(
    authOptions({} as NextApiRequest, {} as NextApiResponse)
  )
  const adminId = session?.user?._id
  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin"

  await dbConnect()

  const cycles: CycleRow[] = await Cycle.find({ adminId })
    .select("name isActive queues enrolledUsers waitingList schedule createdAt")
    .sort({ createdAt: -1 })
    .lean()
    .then((docs) => JSON.parse(JSON.stringify(docs)))

  const totalCycles    = cycles.length
  const activeCycles   = cycles.filter((c) => c.isActive).length
  const inactiveCycles = cycles.filter((c) => !c.isActive).length
  const totalUsers     = cycles.reduce((sum, c) => sum + c.enrolledUsers.length, 0)

  const recentCycles = cycles.slice(0, 4)

  return (
    <div className='flex flex-col gap-8 font-manrope'>

      {/* ── Hero ── */}
      <div className="relative w-full rounded-2xl bg-[#EAF6FE] overflow-hidden min-h-55 flex flex-row-reverse items-center">
        <div className="relative z-10 px-8 py-12 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Monitor Your{" "}
            <span className="text-[#2347C5]">Cycles</span>{" "}
            Anywhere, Anytime
          </h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Create Cycles and manage queues with ease, ensuring a seamless experience for your users.
          </p>
          <Link
            href="/admin/create-cycle"
            className="mt-6 inline-flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a38a8] transition-colors"
          >
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="absolute left-0 bottom-0 top-0 w-[45%] hidden sm:flex items-end justify-end">
          <Image
            src="/images/queue-hero.png"
            alt="Queue illustration"
            className="h-full object-contain object-bottom-right"
            fill
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard
            label="Total Cycles"
            value={totalCycles}
            accent="bg-[#EEF2FF]"
            icon={<MdOutlineCyclone size={22} className="text-[#2347C5]" />}
            sub="All time"
          />
          <AdminStatCard
            label="Active Cycles"
            value={activeCycles}
            accent="bg-[#f0faf7]"
            icon={<MdOutlineCheckCircle size={22} className="text-[#3DBFA0]" />}
            sub="Currently running"
          />
          <AdminStatCard
            label="Inactive Cycles"
            value={inactiveCycles}
            accent="bg-orange-50"
            icon={<MdOutlinePauseCircle size={22} className="text-orange-400" />}
            sub="Paused or closed"
          />
          <AdminStatCard
            label="Users Joined"
            value={totalUsers}
            accent="bg-blue-50"
            icon={<MdOutlinePeople size={22} className="text-blue-500" />}
            sub="Across all cycles"
          />
        </div>
      </section>

      {/* ── Recent Cycles ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Recent Cycles</h3>
          <Link href="/admin/cycles" className="text-sm text-[#2347C5] font-medium hover:underline">
            See all
          </Link>
        </div>

        {recentCycles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-14 gap-3">
            <p className="text-sm text-gray-400">No cycles created yet</p>
            <Link
              href="/admin/create-cycle"
              className="text-sm text-[#2347C5] font-semibold hover:underline"
            >
              + Create your first cycle
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#2347C5]">
                    {["Cycle Name", "Queues", "Enrolled", "Schedule", "Status", ""].map((col) => (
                      <th
                        key={col}
                        className="text-left text-white text-xs font-semibold px-5 py-3.5 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentCycles.map((cycle) => {
                    const activeDays = cycle.schedule
                      .filter((s) => s.isActive)
                      .map((s) => s.day.slice(0, 3))

                    return (
                      <tr
                        key={cycle._id}
                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {cycle.name}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {cycle.queues.length} queue{cycle.queues.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {cycle.enrolledUsers.length} user{cycle.enrolledUsers.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1 flex-wrap">
                            {activeDays.length > 0 ? activeDays.map((d) => (
                              <span
                                key={d}
                                className="text-xs bg-[#EEF2FF] text-[#2347C5] font-medium px-2 py-0.5 rounded-md"
                              >
                                {d}
                              </span>
                            )) : (
                              <span className="text-xs text-gray-400">No schedule</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <CycleStatusBadge isActive={cycle.isActive} />
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/admin/cycles/${cycle._id}`}>
                            <svg
                              width="16" height="16" viewBox="0 0 24 24" fill="none"
                              stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"
                              strokeLinejoin="round"
                              className="group-hover:stroke-[#2347C5] transition-colors"
                            >
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}

function CycleStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
      isActive
        ? "bg-green-50 text-green-600 border-green-200"
        : "bg-orange-50 text-orange-500 border-orange-200"
    }`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  )
}