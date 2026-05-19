"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MdOutlineAdd,
  MdOutlineDelete,
  MdOutlineLocationOn,
  MdOutlineDescription,
  MdOutlineUploadFile,
  MdOutlineContentCopy,
  MdOutlineDragIndicator,
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsArrowDown } from "react-icons/bs";
import { successToast } from "@/utils/toast";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
type Day = typeof DAYS[number];

interface ScheduleDay {
  day: Day;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: "hardcopy" | "uploadable";
  required: boolean;
  acceptedFormats: string[];
}

interface QueueItem {
  id: string;       // local id for UI
  name: string;
  description: string;
  location: string;
  maxUsers: number;
  deliverables: Deliverable[];
}

const defaultSchedule: ScheduleDay[] = DAYS.map((day) => ({
  day,
  isActive: ["Monday","Tuesday","Wednesday"].includes(day),
  startTime: "09:00",
  endTime: "15:00",
}));

const emptyQueue = (): QueueItem => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  location: "",
  maxUsers: 20,
  deliverables: [],
});

const emptyDeliverable = (): Deliverable => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  type: "hardcopy",
  required: true,
  acceptedFormats: [],
});

export default function CreateCyclePage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Cycle form state
  const [cycleName, setCycleName] = useState("");
  const [cycleDesc, setCycleDesc] = useState("");
  const [maxUsers, setMaxUsers] = useState(100);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(defaultSchedule);

  // Queue state
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);

  // UI state
  const [step, setStep] = useState<"cycle" | "queues">("cycle");
  const [createdCycleId, setCreatedCycleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Schedule helpers

  const toggleDay = (day: Day) => {
    setSchedule((prev) =>
      prev.map((s) => s.day === day ? { ...s, isActive: !s.isActive } : s)
    );
  };

  const updateScheduleTime = (day: Day, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) =>
      prev.map((s) => s.day === day ? { ...s, [field]: value } : s)
    );
  };

  // Queue helpers

  const addQueue = () => {
    const q = emptyQueue();
    setQueues((prev) => [...prev, q]);
    setActiveQueueId(q.id);
  };

  const removeQueue = (id: string) => {
    setQueues((prev) => prev.filter((q) => q.id !== id));
    setActiveQueueId(null);
  };

  const updateQueue = (id: string, field: keyof QueueItem, value: any) => {
    setQueues((prev) =>
      prev.map((q) => q.id === id ? { ...q, [field]: value } : q)
    );
  };

  const addDeliverable = (queueId: string) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? { ...q, deliverables: [...q.deliverables, emptyDeliverable()] }
          : q
      )
    );
  };

  const updateDeliverable = (queueId: string, delivId: string, field: keyof Deliverable, value: any) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? {
              ...q,
              deliverables: q.deliverables.map((d) =>
                d.id === delivId ? { ...d, [field]: value } : d
              ),
            }
          : q
      )
    );
  };

  const removeDeliverable = (queueId: string, delivId: string) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? { ...q, deliverables: q.deliverables.filter((d) => d.id !== delivId) }
          : q
      )
    );
  };

  // Submit Cycle

  const handleCreateCycle = async () => {
    if (!cycleName.trim()) { setError("Cycle name is required"); return; }
    if (!cycleDesc.trim()) { setError("Cycle description is required"); return; }
    if (!schedule.some((s) => s.isActive)) { setError("Select at least one schedule day"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/cycle/create-cycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cycleName,
        description: cycleDesc,
        adminId: session?.user?._id,
        schedule: schedule.filter((s) => s.isActive),
        maxUsers,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      successToast(data.message || "Cycle created successfully");
      setCreatedCycleId(data.data._id);
      setStep("queues");
    } else {
      setError(data.message ?? "Failed to create cycle");
    }
  };

  // Submit Queues

  const handleSaveQueues = async () => {
    if (!createdCycleId) return;
    if (queues.length === 0) { router.push("/admin/cycles"); return; }

    const invalid = queues.find((q) => !q.name.trim() || !q.location.trim());
    if (invalid) { setError("Each queue needs a name and location"); return; }

    setLoading(true);
    setError("");

    for (const q of queues) {
      await fetch("/api/cycle/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: createdCycleId,
          name: q.name,
          description: q.description,
          location: q.location,
          maxUsers: q.maxUsers,
          deliverables: q.deliverables.map(({ id, ...rest }) => rest),
        }),
      });
    }

    setLoading(false);
    router.push("/admin/cycles");
  };

  const activeQueue = queues.find((q) => q.id === activeQueueId) ?? null;

  // Render

  return (
    <div className="font-manrope flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {step === "cycle" ? "Create a Cycle" : "Build Queue Flow"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {step === "cycle"
              ? "Set up your cycle details and schedule"
              : "Define the queue steps users will follow in this cycle"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <StepPill number={1} label="Cycle" active={step === "cycle"} done={step === "queues"} />
          <div className="w-6 h-px bg-gray-300" />
          <StepPill number={2} label="Queues" active={step === "queues"} done={false} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── STEP 1: Cycle Form ── */}
      {step === "cycle" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — form */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-gray-700">Cycle Details</h2>

            <FormField label="Cycle Name">
              <input
                type="text"
                placeholder="e.g. Student Clearance Cycle"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors placeholder:text-gray-300"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                placeholder="Describe what this cycle is about..."
                value={cycleDesc}
                onChange={(e) => setCycleDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors placeholder:text-gray-300 resize-none"
              />
            </FormField>

            <FormField label="Max Users per Cycle">
              <input
                type="number"
                min={1}
                value={maxUsers}
                onChange={(e) => setMaxUsers(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors"
              />
            </FormField>

            <button
              onClick={handleCreateCycle}
              disabled={loading}
              className="mt-2 w-full bg-[#2347C5] text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-[#1a38a8] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Cycle & Add Queues →"}
            </button>
          </div>

          {/* Right — schedule */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-700">Available Schedule</h2>
            <p className="text-xs text-gray-400 -mt-2">Select days and set time windows for this cycle.</p>

            <div className="flex flex-col gap-2.5">
              {schedule.map((s) => (
                <div key={s.day} className={`rounded-xl border p-3 transition-all ${s.isActive ? "border-[#2347C5] bg-[#f5f7ff]" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => toggleDay(s.day)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      {s.isActive
                        ? <MdOutlineCheckBox size={18} className="text-[#2347C5]" />
                        : <MdOutlineCheckBoxOutlineBlank size={18} className="text-gray-400" />}
                      {s.day}
                    </button>
                    {s.isActive && (
                      <span className="text-xs text-[#2347C5] font-medium bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                        Active
                      </span>
                    )}
                  </div>
                  {s.isActive && (
                    <div className="flex items-center gap-2 mt-1">
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

        </div>
      )}

      {/* ── STEP 2: Queue Builder ── */}
      {step === "queues" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — linked list UI */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Queue Flow</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{queues.length} queue{queues.length !== 1 ? "s" : ""} added</p>
                </div>
                <button
                  onClick={addQueue}
                  className="flex items-center gap-1.5 bg-[#3DBFA0] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#2eaa8d] transition-colors"
                >
                  <MdOutlineAdd size={16} />
                  Add Queue
                </button>
              </div>

              {/* Linked list */}
              {queues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-gray-200 rounded-xl">
                  <HiOutlineQueueList size={32} className="text-gray-300" />
                  <p className="text-xs text-gray-400 text-center">
                    No queues yet. Click &quot;Add Queue&quot; to build your flow.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {queues.map((q, i) => (
                    <div key={q.id} className="flex flex-col items-center">
                      {/* Queue node */}
                      <button
                        onClick={() => setActiveQueueId(q.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left
                          ${activeQueueId === q.id
                            ? "border-[#2347C5] bg-[#f5f7ff] shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                          ${activeQueueId === q.id ? "bg-[#2347C5] text-white" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${activeQueueId === q.id ? "text-[#2347C5]" : "text-gray-800"}`}>
                            {q.name || `Queue ${i + 1}`}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{q.location || "No location set"}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeQueue(q.id); }}
                          className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                        >
                          <MdOutlineDelete size={16} />
                        </button>
                      </button>

                      {/* Arrow connector */}
                      {i < queues.length - 1 && (
                        <div className="flex flex-col items-center py-1">
                          <div className="w-px h-3 bg-gray-300" />
                          <BsArrowDown size={14} className="text-gray-300" />
                          <div className="w-px h-3 bg-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* What is a queue — info card */}
            <div className="bg-[#EEF2FF] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#2347C5] mb-1.5">What is a Queue?</p>
              <p className="text-xs text-[#2347C5]/70 leading-relaxed">
                A queue is a step in your cycle flow. Users move through each queue in order — from Queue 1 to the last. Each queue can have its own location, capacity, and required documents.
              </p>
            </div>
          </div>

          {/* Right — queue detail form */}
          <div className="lg:col-span-3">
            {activeQueue ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Editing: {activeQueue.name || `Queue ${queues.findIndex(q => q.id === activeQueueId) + 1}`}
                  </h2>
                  <span className="text-xs text-gray-400">
                    Step {queues.findIndex(q => q.id === activeQueueId) + 1} of {queues.length}
                  </span>
                </div>

                <FormField label="Queue Name">
                  <input
                    type="text"
                    placeholder="e.g. Document Verification"
                    value={activeQueue.name}
                    onChange={(e) => updateQueue(activeQueue.id, "name", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors placeholder:text-gray-300"
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    placeholder="What happens at this queue point?"
                    value={activeQueue.description}
                    onChange={(e) => updateQueue(activeQueue.id, "description", e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2347C5] transition-colors placeholder:text-gray-300 resize-none"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Location / Queue Point">
                    <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-[#2347C5] transition-colors">
                      <MdOutlineLocationOn size={16} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="e.g. Room 204"
                        value={activeQueue.location}
                        onChange={(e) => updateQueue(activeQueue.id, "location", e.target.value)}
                        className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-gray-300"
                      />
                    </div>
                  </FormField>

                  <FormField label="Max Users at this Point">
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
                      <MdOutlineAdd size={14} /> Add Document
                    </button>
                  </div>

                  {activeQueue.deliverables.length === 0 ? (
                    <div className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4">
                      <MdOutlineDescription size={18} className="text-gray-300" />
                      <p className="text-xs text-gray-400">No documents required yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {activeQueue.deliverables.map((d) => (
                        <div key={d.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateDeliverable(activeQueue.id, d.id, "type", "hardcopy")}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${d.type === "hardcopy" ? "bg-[#2347C5] text-white" : "bg-white border border-gray-200 text-gray-500"}`}
                              >
                                Hardcopy
                              </button>
                              <button
                                onClick={() => updateDeliverable(activeQueue.id, d.id, "type", "uploadable")}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${d.type === "uploadable" ? "bg-[#2347C5] text-white" : "bg-white border border-gray-200 text-gray-500"}`}
                              >
                                <MdOutlineUploadFile size={13} /> Uploadable
                              </button>
                            </div>
                            <button
                              onClick={() => removeDeliverable(activeQueue.id, d.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <MdOutlineDelete size={15} />
                            </button>
                          </div>

                          <input
                            type="text"
                            placeholder="Document name (e.g. School ID)"
                            value={d.name}
                            onChange={(e) => updateDeliverable(activeQueue.id, d.id, "name", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2347C5] bg-white placeholder:text-gray-300"
                          />
                          <input
                            type="text"
                            placeholder="Short description"
                            value={d.description}
                            onChange={(e) => updateDeliverable(activeQueue.id, d.id, "description", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2347C5] bg-white placeholder:text-gray-300"
                          />

                          {d.type === "uploadable" && (
                            <input
                              type="text"
                              placeholder="Accepted formats: pdf, jpg, png"
                              value={d.acceptedFormats.join(", ")}
                              onChange={(e) =>
                                updateDeliverable(activeQueue.id, d.id, "acceptedFormats",
                                  e.target.value.split(",").map((f) => f.trim()).filter(Boolean)
                                )
                              }
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2347C5] bg-white placeholder:text-gray-300"
                            />
                          )}

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={d.required}
                              onChange={(e) => updateDeliverable(activeQueue.id, d.id, "required", e.target.checked)}
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
              // Empty state when no queue selected
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center gap-4 h-full min-h-[300px]">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
                  <HiOutlineQueueList size={28} className="text-[#2347C5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">Select or add a queue</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Click a queue on the left to edit it, or add a new queue to start building your flow.
                  </p>
                </div>
                <button
                  onClick={addQueue}
                  className="flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a38a8] transition-colors"
                >
                  <MdOutlineAdd size={16} />
                  Add First Queue
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Bottom actions for step 2 */}
      {step === "queues" && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">
            You can always edit queues later from the Cycles page.
          </p>
          <button
            onClick={handleSaveQueues}
            disabled={loading}
            className="flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a38a8] transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : queues.length === 0 ? "Skip for now →" : "Save & Finish →"}
          </button>
        </div>
      )}

    </div>
  );
}

// Shared sub-components

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      {children}
    </div>
  );
}

function StepPill({ number, label, active, done }: {
  number: number; label: string; active: boolean; done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
        ${done ? "bg-[#3DBFA0] text-white" : active ? "bg-[#2347C5] text-white" : "bg-gray-200 text-gray-400"}`}>
        {done ? "✓" : number}
      </div>
      <span className={`text-xs font-medium ${active ? "text-[#2347C5]" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}