"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlineAdd, MdOutlineDelete, MdOutlineLocationOn,
  MdOutlineUploadFile, MdOutlineArrowBack, MdOutlineSave,
  MdOutlineCheckBox, MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsArrowDown } from "react-icons/bs";
import type { AdminInfo, QueueStep } from "./CycleDetailsClient";
import { errorToast, successToast } from "@/utils/toast";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
type Day = typeof DAYS[number];

interface Cycle {
  cycleCode: string;
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  queues: QueueItem[];
  schedule: ScheduleDay[];
  maxUsers: number;
  enrolledUsers: string[];
  waitingList: string[];
  adminId: AdminInfo;
  createdAt: string;
}

interface Deliverable {
  id?: string;
  name: string;
  description: string;
  type: "hardcopy" | "uploadable";
  required: boolean;
  acceptedFormats: string[];
}

interface QueueItem {
  _id?: string;
  id: string;
  name: string;
  description: string;
  location: string;
  maxUsers: number;
  deliverables: Deliverable[];
  order: number;
  isNew?: boolean;
  isModified?: boolean;
}

interface ScheduleDay {
  day: Day;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

interface Props {
  cycle: Cycle;
  adminId: any;
}

export default function EditCycleClient({ cycle, adminId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [cycleName, setCycleName]   = useState(cycle.name)
  const [cycleDesc, setCycleDesc]   = useState(cycle.description)
  const [maxUsers, setMaxUsers]     = useState(cycle.maxUsers)
  const [schedule, setSchedule]     = useState<ScheduleDay[]>(
    DAYS.map((day) => {
      const existing = cycle.schedule.find((s: any) => s.day === day)
      return existing ?? { day, isActive: false, startTime: "09:00", endTime: "15:00" }
    })
  )
  const [queues, setQueues] = useState<QueueItem[]>(
    cycle.queues.map((q: QueueItem) => ({
      _id: q._id,
      id: q._id  ?? crypto.randomUUID(),
      name: q.name,
      description: q.description,
      location: q.location,
      maxUsers: q.maxUsers,
      deliverables: q.deliverables ?? [],
      order: q.order,
      isNew: false,
      isModified: false,
    }))
  )
  const [activeQueueId, setActiveQueueId] = useState<string | null>(
    queues[0]?.id ?? null
  )
  const [deletedQueueIds, setDeletedQueueIds] = useState<string[]>([])
  const [error, setError]           = useState("")
  const [saving, setSaving]         = useState(false)

  const toggleDay = (day: Day) => {
    setSchedule((prev) =>
      prev.map((s) => s.day === day ? { ...s, isActive: !s.isActive } : s)
    )
  }

  const updateScheduleTime = (day: Day, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) =>
      prev.map((s) => s.day === day ? { ...s, [field]: value } : s)
    )
  }

  const addQueue = () => {
    const newQ: QueueItem = {
      id: crypto.randomUUID(),
      name: "", description: "", location: "",
      maxUsers: 20, deliverables: [], order: queues.length + 1,
      isNew: true, isModified: false,
    }
    setQueues((prev) => [...prev, newQ])
    setActiveQueueId(newQ.id)
  }

  const removeQueue = (id: string) => {
    const q = queues.find((q) => q.id === id)
    if (q?._id) setDeletedQueueIds((prev) => [...prev, q._id!])
    setQueues((prev) => prev.filter((q) => q.id !== id))
    setActiveQueueId(queues.filter((q) => q.id !== id)[0]?.id ?? null)
  }

  const updateQueue = (id: string, field: keyof QueueItem, value: any) => {
    setQueues((prev) =>
      prev.map((q) => q.id === id ? { ...q, [field]: value, isModified: true } : q)
    )
  }

  const addDeliverable = (queueId: string) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? {
              ...q,
              isModified: true,
              deliverables: [...q.deliverables, {
                id: crypto.randomUUID(),
                name: "", description: "", type: "hardcopy", required: true, acceptedFormats: [],
              }],
            }
          : q
      )
    )
  }

  const updateDeliverable = (queueId: string, dIdx: number, field: keyof Deliverable, value: any) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? {
              ...q,
              isModified: true,
              deliverables: q.deliverables.map((d, i) =>
                i === dIdx ? { ...d, [field]: value } : d
              ),
            }
          : q
      )
    )
  }

  const removeDeliverable = (queueId: string, dIdx: number) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? { ...q, isModified: true, deliverables: q.deliverables.filter((_, i) => i !== dIdx) }
          : q
      )
    )
  }

  const handleSave = async () => {
    if (!cycleName.trim()) { setError("Cycle name is required"); return }
    setSaving(true)
    setError("")

    try {
      // 1. update cycle
      const cycleRes = await fetch(
        `/api/cycle/admin/${cycle._id}/edit?adminId=${adminId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cycleName,
            description: cycleDesc,
            maxUsers,
            schedule: schedule.filter((s) => s.isActive),
          }),
        }
      )
      const cycleData = await cycleRes.json()
      if (!cycleRes.ok){
        errorToast("Failed to update cycle: " + (cycleData.message || "Unknown error"))
        throw new Error(cycleData.message)
      }
      successToast(cycleData.message || "Cycle updated successfully")

      // 2. delete removed queues
      await Promise.all(
        deletedQueueIds.map((queueId) =>
          fetch(`/api/cycle/queue/${queueId}?adminId=${adminId}`, { method: "DELETE" })
        )
      )

      // 3. update modified queues + create new ones — all in parallel
      await Promise.all(
        queues.map((q) => {
          const payload = {
            name: q.name, description: q.description,
            location: q.location, maxUsers: q.maxUsers,
            deliverables: q.deliverables.map(({ id, ...rest }) => rest),
          }
          if (q.isNew) {
            return fetch("/api/cycle/queue", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cycleId: cycle._id, ...payload }),
            })
          }
          if (q.isModified && q._id) {
            return fetch(`/api/cycle/queue/${q._id}?adminId=${adminId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          }
          return Promise.resolve()
        })
      )

      successToast("All changes saved successfully")

      queryClient.invalidateQueries({ queryKey: ["admin-cycles", adminId] })
      router.push(`/admin/cycles/${cycle._id}`)
    } catch (err: any) {
      setError(err.message ?? "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const activeQueue = queues.find((q) => q.id === activeQueueId) ?? null

  return (
    <div className="font-manrope flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <MdOutlineArrowBack size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Cycle</h1>
            <p className="text-xs text-gray-400 mt-0.5">Changes are saved all at once</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a38a8] transition-colors disabled:opacity-60"
        >
          <MdOutlineSave size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — cycle form + schedule */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-700">Cycle Details</h2>

            <FormField label="Cycle Name">
              <input
                type="text"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={cycleDesc}
                onChange={(e) => setCycleDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors resize-none"
              />
            </FormField>

            <FormField label="Max Users">
              <input
                type="number"
                min={1}
                value={maxUsers}
                onChange={(e) => setMaxUsers(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors"
              />
            </FormField>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Schedule</h2>
            {schedule.map((s) => (
              <div key={s.day} className={`rounded-xl border p-3 transition-all ${s.isActive ? "border-[#2347C5] bg-[#f5f7ff]" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleDay(s.day)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    {s.isActive
                      ? <MdOutlineCheckBox size={18} className="text-[#2347C5]" />
                      : <MdOutlineCheckBoxOutlineBlank size={18} className="text-gray-400" />
                    }
                    {s.day}
                  </button>
                </div>
                {s.isActive && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => updateScheduleTime(s.day, "startTime", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#2347C5]"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => updateScheduleTime(s.day, "endTime", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#2347C5]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right — queue linked list + editor */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* Queue flow */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Queue Flow</h2>
                <p className="text-xs text-gray-400 mt-0.5">{queues.length} queue{queues.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={addQueue}
                className="flex items-center gap-1.5 bg-[#3DBFA0] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#2eaa8d] transition-colors"
              >
                <MdOutlineAdd size={16} /> Add Queue
              </button>
            </div>

            {queues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 border-2 border-dashed border-gray-200 rounded-xl">
                <HiOutlineQueueList size={28} className="text-gray-300" />
                <p className="text-xs text-gray-400">No queues yet</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {queues.map((q, i) => {
                  const isSelected = q.id === activeQueueId
                  return (
                    <div key={q.id} className="flex flex-col items-center">
                      <button
                        onClick={() => setActiveQueueId(q.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left
                          ${isSelected ? "border-[#2347C5] bg-[#f5f7ff]" : "border-gray-200 bg-white hover:border-gray-300"}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0
                          ${isSelected ? "bg-[#2347C5] text-white" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? "text-[#2347C5]" : "text-gray-800"}`}>
                            {q.name || `Queue ${i + 1}`}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{q.location || "No location"}</p>
                        </div>
                        {q.isNew && (
                          <span className="text-xs bg-[#f0faf7] text-[#3DBFA0] border border-[#a7f3d0] px-2 py-0.5 rounded-full font-medium shrink-0">
                            New
                          </span>
                        )}
                        {q.isModified && !q.isNew && (
                          <span className="text-xs bg-orange-50 text-orange-500 border border-orange-200 px-2 py-0.5 rounded-full font-medium shrink-0">
                            Edited
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeQueue(q.id) }}
                          className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                        >
                          <MdOutlineDelete size={16} />
                        </button>
                      </button>
                      {i < queues.length - 1 && (
                        <div className="flex flex-col items-center py-0.5">
                          <div className="w-px h-3 bg-gray-200" />
                          <BsArrowDown size={12} className="text-gray-300" />
                          <div className="w-px h-3 bg-gray-200" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Queue editor */}
          {activeQueue ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
              <h2 className="text-sm font-semibold text-gray-800">
                Editing: {activeQueue.name || `Queue ${queues.findIndex(q => q.id === activeQueueId) + 1}`}
              </h2>

              <FormField label="Queue Name">
                <input
                  type="text"
                  value={activeQueue.name}
                  onChange={(e) => updateQueue(activeQueue.id, "name", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={activeQueue.description}
                  onChange={(e) => updateQueue(activeQueue.id, "description", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors resize-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Location">
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-[#2347C5] transition-colors">
                    <MdOutlineLocationOn size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={activeQueue.location}
                      onChange={(e) => updateQueue(activeQueue.id, "location", e.target.value)}
                      className="flex-1 py-3 text-sm outline-none bg-transparent"
                    />
                  </div>
                </FormField>

                <FormField label="Max Users">
                  <input
                    type="number"
                    min={1}
                    value={activeQueue.maxUsers}
                    onChange={(e) => updateQueue(activeQueue.id, "maxUsers", Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors"
                  />
                </FormField>
              </div>

              {/* Deliverables */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">Required Documents</p>
                  <button
                    onClick={() => addDeliverable(activeQueue.id)}
                    className="flex items-center gap-1 text-xs text-[#3DBFA0] font-semibold hover:underline"
                  >
                    <MdOutlineAdd size={14} /> Add
                  </button>
                </div>
                {activeQueue.deliverables.length === 0 ? (
                  <div className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4">
                    <p className="text-xs text-gray-400">No documents required.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeQueue.deliverables.map((d, dIdx) => (
                      <div key={dIdx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateDeliverable(activeQueue.id, dIdx, "type", "hardcopy")}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${d.type === "hardcopy" ? "bg-[#2347C5] text-white" : "bg-white border border-gray-200 text-gray-500"}`}
                            >
                              Hardcopy
                            </button>
                            <button
                              onClick={() => updateDeliverable(activeQueue.id, dIdx, "type", "uploadable")}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${d.type === "uploadable" ? "bg-[#2347C5] text-white" : "bg-white border border-gray-200 text-gray-500"}`}
                            >
                              <MdOutlineUploadFile size={13} /> Uploadable
                            </button>
                          </div>
                          <button
                            onClick={() => removeDeliverable(activeQueue.id, dIdx)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <MdOutlineDelete size={15} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Document name"
                          value={d.name}
                          onChange={(e) => updateDeliverable(activeQueue.id, dIdx, "name", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2347C5] bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Short description"
                          value={d.description}
                          onChange={(e) => updateDeliverable(activeQueue.id, dIdx, "description", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2347C5] bg-white"
                        />
                        {d.type === "uploadable" && (
                          <input
                            type="text"
                            placeholder="Accepted formats: pdf, jpg, png"
                            value={d.acceptedFormats.join(", ")}
                            onChange={(e) =>
                              updateDeliverable(activeQueue.id, dIdx, "acceptedFormats",
                                e.target.value.split(",").map((f) => f.trim()).filter(Boolean)
                              )
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2347C5] bg-white"
                          />
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={d.required}
                            onChange={(e) => updateDeliverable(activeQueue.id, dIdx, "required", e.target.checked)}
                            className="accent-[#2347C5] w-3.5 h-3.5"
                          />
                          <span className="text-xs text-gray-500">Required</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-14 gap-3 min-h-[200px]">
              <HiOutlineQueueList size={28} className="text-gray-300" />
              <p className="text-xs text-gray-400">Select a queue to edit it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      {children}
    </div>
  )
}