/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";

const historyData = [
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Pending" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Pending" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 2", point: "Medical", status: "Completed" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Pending" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 3", point: "Student", status: "Cancelled" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Completed" },
];

const filterOptions = ["All Queues", "Admin", "Medical", "Student", "Payment", "Sports"];

export default function UserHistoryPage() {
  const [filter, setFilter] = useState("All Queues");

  const filtered = filter === "All Queues"
    ? historyData
    : historyData.filter((r) => r.point === filter);

  return (
    <div className="flex flex-col gap-8 font-manrope">

      {/* ── My Queue Status ── */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">My Queue Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QueueStatusCard title="My Ticket (s)"  description="Your digital description in the queue."    value={0} valueColor="bg-[#3DBFA0]" />
          <QueueStatusCard title="My Position"     description="Your digital place in the queue."          value={0} valueColor="bg-[#2347C5]" />
          <QueueStatusCard title="ETA to Turn"     description="Your Estimated Time to be attended to"    value={0} valueColor="bg-[#F5A623]" />
        </div>
      </section>

      {/* ── Filter + Report ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 whitespace-nowrap">Filter by:</span>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-gray-700 outline-none focus:border-[#3DBFA0] cursor-pointer min-w-[160px]"
            >
              {filterOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        <button className="sm:ml-auto flex items-center gap-2 bg-[#3DBFA0] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2eaa8d] transition-colors">
          Queue Reports
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </button>
      </div>

      {/* ── Recent Queue ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Recent Queue</h3>
          <Link href="#" className="text-sm text-[#2347C5] font-medium hover:underline">See all</Link>
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#3DBFA0]">
                    {["Full Name", "Phone", "Reason for visit", "Queue Point", "Status", ""].map((col) => (
                      <th key={col} className="text-left text-white text-xs font-semibold px-5 py-3.5 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                      <td className="px-5 py-4 text-gray-800 font-medium whitespace-nowrap">{row.name}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.phone}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.reason}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.point}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#2347C5] transition-colors">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function QueueStatusCard({ title, description, value, valueColor }: {
  title: string; description: string; value: number; valueColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[60%]">{description}</p>
      </div>
      <div className={`${valueColor} text-white text-sm font-bold w-10 h-10 rounded-xl flex items-center justify-center mt-4`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending:   "bg-orange-50 text-orange-500 border border-orange-200",
    Completed: "bg-green-50 text-green-600 border border-green-200",
    Cancelled: "bg-red-50 text-red-500 border border-red-200",
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${styles[status] ?? styles.Pending}`}>
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 gap-4">
      <img
        src="/images/empty-queue.jpg"
        alt="No queue"
        className="w-32 h-32 object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <p className="text-sm text-gray-400 font-medium">No queue has been made yet</p>
    </div>
  );
}