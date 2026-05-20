"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlineEdit,
  MdOutlineLocationOn,
  MdOutlinePeople,
  MdOutlineCalendarMonth,
  MdOutlineAccessTime,
  MdOutlineUploadFile,
  MdOutlineArticle,
  MdOutlineArrowBack,
  MdOutlineToggleOn,
  MdOutlineToggleOff,
  MdOutlineGroup,
  MdOutlineHourglassTop,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsArrowDown } from "react-icons/bs";
import { MdOutlineQrCode } from "react-icons/md"
import QRCode from "react-qr-code"

interface Deliverable {
  name: string;
  description: string;
  type: "hardcopy" | "uploadable";
  required: boolean;
  acceptedFormats?: string[];
}

interface QueueStep {
  _id: string;
  name: string;
  description: string;
  location: string;
  maxUsers: number;
  inProgressUsers: string[];
  waitingList: string[];
  deliverables: Deliverable[];
  order: number;
  isActive: boolean;
}

interface ScheduleDay {
  day: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface AdminInfo {
  _id: string;
  name: string;
  businessName?: string;
  email: string;
}

interface Cycle {
  cycleCode: string;
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  queues: QueueStep[];
  schedule: ScheduleDay[];
  maxUsers: number;
  enrolledUsers: string[];
  waitingList: string[];
  adminId: AdminInfo;
  createdAt: string;
}

interface Props {
  cycle: Cycle;
  adminId: any;
}

export default function CycleDetailsClient({ cycle, adminId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedQueueId, setSelectedQueueId] = useState<string>(
    cycle.queues[0]?._id ?? ""
  );
  const [showQR, setShowQR] = useState(false)
  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join-cycle?adminId=${cycle.adminId._id}&cycleId=${cycle._id}`

  const selectedQueue = cycle.queues.find((q) => q._id === selectedQueueId) ?? null;
  const activeSchedule = cycle.schedule.filter((s) => s.isActive);
  const enrolledCount = cycle.enrolledUsers.length;
  const capacityPct = Math.round((enrolledCount / cycle.maxUsers) * 100);

  const { mutate: toggleStatus, isPending: toggling } = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await fetch(`/api/cycle/admin/${cycle._id}?adminId=${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to update");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cycles", adminId] });
      router.refresh();
    },
  });

  return (
    <div className="font-manrope flex flex-col gap-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/cycles"
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <MdOutlineArrowBack size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{cycle.name}</h1>
              <CycleStatusBadge isActive={cycle.isActive} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Created {new Date(cycle.createdAt).toLocaleDateString("en-US", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            <MdOutlineQrCode size={15} /> QR Code
          </button>
          <button
            onClick={() => toggleStatus(!cycle.isActive)}
            disabled={toggling}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all disabled:opacity-60
              ${cycle.isActive
                ? "border-orange-200 text-orange-500 bg-orange-50 hover:bg-orange-100"
                : "border-green-200 text-green-600 bg-green-50 hover:bg-green-100"
              }`}
          >
            {cycle.isActive
              ? <><MdOutlineToggleOff size={16} /> Deactivate</>
              : <><MdOutlineToggleOn size={16} /> Activate</>
            }
          </button>
          <Link
            href={`/admin/create-cycle?edit=${cycle._id}`}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#2347C5] text-white hover:bg-[#1a38a8] transition-colors"
          >
            <MdOutlineEdit size={14} /> Edit Cycle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard
          label="Total Queues"
          value={cycle.queues.length}
          icon={<HiOutlineQueueList size={18} className="text-[#2347C5]" />}
          accent="bg-[#EEF2FF]"
        />
        <MiniStatCard
          label="Enrolled Users"
          value={`${enrolledCount}/${cycle.maxUsers}`}
          icon={<MdOutlinePeople size={18} className="text-[#3DBFA0]" />}
          accent="bg-[#f0faf7]"
        />
        <MiniStatCard
          label="Waiting List"
          value={cycle.waitingList.length}
          icon={<MdOutlineHourglassTop size={18} className="text-orange-400" />}
          accent="bg-orange-50"
        />
        <MiniStatCard
          label="Active Days"
          value={activeSchedule.length}
          icon={<MdOutlineCalendarMonth size={18} className="text-blue-500" />}
          accent="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — linked list queue flow */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Queue Flow</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Users move through these steps in order
                </p>
              </div>
              <span className="text-xs bg-[#EEF2FF] text-[#2347C5] font-semibold px-2.5 py-1 rounded-lg">
                {cycle.queues.length} step{cycle.queues.length !== 1 ? "s" : ""}
              </span>
            </div>

            {cycle.queues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 border-2 border-dashed border-gray-200 rounded-xl">
                <HiOutlineQueueList size={28} className="text-gray-300" />
                <p className="text-xs text-gray-400">No queues in this cycle yet</p>
                <Link
                  href={`/admin/create-cycle?edit=${cycle._id}`}
                  className="text-xs text-[#2347C5] font-semibold hover:underline"
                >
                  + Add queues
                </Link>
              </div>
            ) : (
              <div className="flex flex-col">
                {cycle.queues.map((q, i) => {
                  const isSelected = q._id === selectedQueueId;
                  const qCapacityPct = Math.round(
                    (q.inProgressUsers.length / q.maxUsers) * 100
                  );

                  return (
                    <div key={q._id} className="flex flex-col items-center">
                      <button
                        onClick={() => setSelectedQueueId(q._id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left
                          ${isSelected
                            ? "border-[#2347C5] bg-[#f5f7ff] shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                          ${isSelected ? "bg-[#2347C5] text-white" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? "text-[#2347C5]" : "text-gray-800"}`}>
                            {q.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MdOutlineLocationOn size={11} className="text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-400 truncate">{q.location}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-gray-400">
                            {q.inProgressUsers.length}/{q.maxUsers}
                          </span>
                          <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                qCapacityPct > 80 ? "bg-red-400" :
                                qCapacityPct > 50 ? "bg-orange-400" : "bg-[#3DBFA0]"
                              }`}
                              style={{ width: `${Math.min(qCapacityPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Arrow connector between nodes */}
                      {i < cycle.queues.length - 1 && (
                        <div className="flex flex-col items-center py-0.5">
                          <div className="w-px h-3 bg-gray-200" />
                          <BsArrowDown size={12} className="text-gray-300" />
                          <div className="w-px h-3 bg-gray-200" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Schedule card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-800">Schedule</h2>
            {activeSchedule.length === 0 ? (
              <p className="text-xs text-gray-400">No active schedule days</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeSchedule.map((s) => (
                  <div
                    key={s.day}
                    className="flex items-center justify-between bg-[#f5f7ff] border border-[#e0e7ff] rounded-xl px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <MdOutlineCalendarMonth size={14} className="text-[#2347C5]" />
                      <span className="text-sm font-medium text-gray-700">{s.day}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MdOutlineAccessTime size={13} className="text-gray-400" />
                      {s.startTime} — {s.endTime}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cycle capacity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Cycle Capacity</h2>
              <span className="text-xs font-semibold text-gray-600">{capacityPct}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPct > 80 ? "bg-red-400" :
                  capacityPct > 50 ? "bg-orange-400" : "bg-[#3DBFA0]"
                }`}
                style={{ width: `${Math.min(capacityPct, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{enrolledCount} enrolled</span>
              <span>{cycle.maxUsers - enrolledCount} slots remaining</span>
            </div>
            {cycle.waitingList.length > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                <MdOutlineGroup size={14} className="text-orange-400 shrink-0" />
                <p className="text-xs text-orange-600">
                  <span className="font-semibold">{cycle.waitingList.length}</span> user{cycle.waitingList.length !== 1 ? "s" : ""} on the waiting list
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right — selected queue detail panel */}
        <div className="lg:col-span-3">
          {selectedQueue ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6 sticky top-6">

              {/* Queue header */}
              <div className="flex items-start justify-between gap-3 pb-5 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-lg bg-[#2347C5] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {selectedQueue.order}
                    </span>
                    <h2 className="text-base font-bold text-gray-900">{selectedQueue.name}</h2>
                    <QueueActiveBadge isActive={selectedQueue.isActive} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {selectedQueue.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Queue meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <div className="flex items-center gap-1.5">
                    <MdOutlineLocationOn size={14} className="text-[#2347C5] shrink-0" />
                    <p className="text-sm font-semibold text-gray-800">{selectedQueue.location}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Max Users</p>
                  <div className="flex items-center gap-1.5">
                    <MdOutlinePeople size={14} className="text-[#3DBFA0] shrink-0" />
                    <p className="text-sm font-semibold text-gray-800">{selectedQueue.maxUsers}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">In Progress</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedQueue.inProgressUsers.length} user{selectedQueue.inProgressUsers.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Waiting</p>
                  <p className={`text-sm font-semibold ${selectedQueue.waitingList.length > 0 ? "text-orange-500" : "text-gray-800"}`}>
                    {selectedQueue.waitingList.length} user{selectedQueue.waitingList.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Queue capacity bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">Queue Capacity</p>
                  <span className="text-xs font-semibold text-gray-600">
                    {Math.round((selectedQueue.inProgressUsers.length / selectedQueue.maxUsers) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedQueue.inProgressUsers.length / selectedQueue.maxUsers > 0.8 ? "bg-red-400" :
                      selectedQueue.inProgressUsers.length / selectedQueue.maxUsers > 0.5 ? "bg-orange-400" : "bg-[#3DBFA0]"
                    }`}
                    style={{
                      width: `${Math.min(
                        (selectedQueue.inProgressUsers.length / selectedQueue.maxUsers) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Required Documents
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({selectedQueue.deliverables.length})
                  </span>
                </h3>

                {selectedQueue.deliverables.length === 0 ? (
                  <div className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4">
                    <MdOutlineArticle size={18} className="text-gray-300" />
                    <p className="text-xs text-gray-400">No documents required at this queue point.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {selectedQueue.deliverables.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 border border-gray-100 rounded-xl p-4 bg-gray-50"
                      >
                        {/* Type icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          d.type === "uploadable" ? "bg-[#EEF2FF]" : "bg-[#f0faf7]"
                        }`}>
                          {d.type === "uploadable"
                            ? <MdOutlineUploadFile size={16} className="text-[#2347C5]" />
                            : <MdOutlineArticle size={16} className="text-[#3DBFA0]" />
                          }
                        </div>

                        {/* Doc info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                            {d.required && (
                              <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                                Required
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${
                              d.type === "uploadable"
                                ? "bg-[#EEF2FF] text-[#2347C5] border-[#c7d2fe]"
                                : "bg-[#f0faf7] text-[#3DBFA0] border-[#a7f3d0]"
                            }`}>
                              {d.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{d.description}</p>
                          {d.type === "uploadable" && d.acceptedFormats && d.acceptedFormats.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              <span className="text-xs text-gray-400">Accepted:</span>
                              {d.acceptedFormats.map((fmt) => (
                                <span key={fmt} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                  .{fmt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-4 h-full min-h-[300px]">
              <HiOutlineQueueList size={32} className="text-gray-300" />
              <p className="text-sm text-gray-400">Select a queue to view details</p>
            </div>
          )}
        </div>
      </div>
      {showQR && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">{cycle.name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Scan to join this cycle · Code: <span className="font-mono font-bold text-[#2347C5]">{cycle.cycleCode}</span>
              </p>
            </div>

            <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl">
              <QRCode
                value={qrUrl}
                size={180}
                fgColor="#2347C5"
              />
            </div>

            <div className="w-full bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
              <p className="text-xs text-gray-400 flex-1 break-all">{qrUrl}</p>
              <button
                onClick={() => navigator.clipboard.writeText(qrUrl)}
                className="text-xs text-[#2347C5] font-semibold shrink-0 hover:underline"
              >
                Copy
              </button>
            </div>

            <button
              onClick={() => setShowQR(false)}
              className="w-full border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}    
    </div>
  );
}

function MiniStatCard({ label, value, icon, accent }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function CycleStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isActive
        ? "bg-green-50 text-green-600 border border-green-200"
        : "bg-orange-50 text-orange-500 border border-orange-200"
    }`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function QueueActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive
        ? "bg-[#f0faf7] text-[#3DBFA0] border border-[#a7f3d0]"
        : "bg-gray-100 text-gray-400 border border-gray-200"
    }`}>
      {isActive ? "Open" : "Closed"}
    </span>
  );
}