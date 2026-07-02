"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MdOutlineUploadFile, MdOutlineArticle, MdOutlineCheckCircle,
  MdOutlineCancel, MdOutlineHourglassTop, MdOutlineCloudUpload,
} from "react-icons/md";
import { errorToast } from "@/utils/toast";

interface Deliverable {
  name: string;
  description: string;
  type: "hardcopy" | "uploadable";
  required: boolean;
  acceptedFormats?: string[];
}

interface Props {
  userId: any;
  cycleId: string;
  queueId: string;
  deliverables: Deliverable[];
}

const statusConfig = {
  pending:  { label: "Pending Review", color: "bg-orange-50 text-orange-500 border-orange-200", icon: <MdOutlineHourglassTop size={14} /> },
  approved: { label: "Approved",       color: "bg-green-50 text-green-600 border-green-200",    icon: <MdOutlineCheckCircle size={14} /> },
  rejected: { label: "Rejected",       color: "bg-red-50 text-red-500 border-red-200",          icon: <MdOutlineCancel size={14} /> },
}

export default function DeliverableUpload({ userId, cycleId, queueId, deliverables }: Props) {
  const queryClient = useQueryClient()
  const fileRefs    = useRef<Record<string, HTMLInputElement | null>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [errors, setErrors]       = useState<Record<string, string>>({})

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["user-deliverables", userId, queueId],
    queryFn: async () => {
      const res = await fetch(`/api/deliverables?userId=${userId}&queueId=${queueId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      return json.data
    },
    enabled: !!userId && !!queueId,
    refetchInterval: 15000,
  })

  const getSubmission = (name: string) =>
    submissions.find((s: any) => s.deliverableName === name) ?? null

  const handleUpload = async (deliverable: Deliverable, file: File) => {
    const key = deliverable.name
    setUploading((prev) => ({ ...prev, [key]: true }))
    setErrors((prev) => ({ ...prev, [key]: "" }))

    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("cycleId", cycleId)
    formData.append("queueId", queueId)
    formData.append("deliverableName", deliverable.name)
    formData.append("deliverableDesc", deliverable.description)

    try {
      const res  = await fetch("/api/deliverables/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        errorToast(json.message ?? "Upload failed")
        throw new Error(json.message ?? "Upload failed")
      }
      queryClient.invalidateQueries({ queryKey: ["user-deliverables", userId, queueId] })
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [key]: err.message ?? "Upload failed" }))
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (deliverables.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">Required Documents</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Submit the documents required for this queue point
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {deliverables.map((d) => {
          const submission  = getSubmission(d.name)
          const isUploading = uploading[d.name]
          const error       = errors[d.name]
          const statusInfo  = submission ? statusConfig[submission.status as keyof typeof statusConfig] : null

          return (
            <div
              key={d.name}
              className={`rounded-xl border p-4 flex flex-col gap-3 transition-all
                ${submission?.status === "approved" ? "border-green-200 bg-green-50/30" :
                  submission?.status === "rejected" ? "border-red-200 bg-red-50/30" :
                  "border-gray-100 bg-gray-50"}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    d.type === "uploadable" ? "bg-[#EEF2FF]" : "bg-[#f0faf7]"
                  }`}>
                    {d.type === "uploadable"
                      ? <MdOutlineUploadFile size={16} className="text-[#2347C5]" />
                      : <MdOutlineArticle size={16} className="text-[#3DBFA0]" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                      {d.required && (
                        <span className="text-xs text-red-400 font-medium">Required</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${
                        d.type === "uploadable"
                          ? "bg-[#EEF2FF] text-[#2347C5] border-[#c7d2fe]"
                          : "bg-[#f0faf7] text-[#3DBFA0] border-[#a7f3d0]"
                      }`}>
                        {d.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{d.description}</p>
                    {d.acceptedFormats && d.acceptedFormats.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">Accepted:</span>
                        {d.acceptedFormats.map((f) => (
                          <span key={f} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                            .{f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                {statusInfo && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                )}
              </div>

              {/* AI verification note */}
              {submission?.aiNotes && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                  submission.aiVerified
                    ? "bg-[#f0faf7] text-[#3DBFA0]"
                    : "bg-orange-50 text-orange-600"
                }`}>
                  <span className="font-semibold shrink-0">AI:</span>
                  <span>{submission.aiNotes}</span>
                </div>
              )}

              {/* Rejection reason */}
              {submission?.status === "rejected" && submission.rejectionReason && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <MdOutlineCancel size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">
                    <span className="font-semibold">Rejected:</span> {submission.rejectionReason}
                  </p>
                </div>
              )}

              {/* Uploaded file preview */}
              {submission?.fileUrl && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <MdOutlineUploadFile size={14} className="text-gray-400 shrink-0" />
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2347C5] hover:underline truncate flex-1"
                  >
                    View uploaded file
                  </a>
                </div>
              )}

              {/* Upload action — only for uploadable type, and allow re-upload if rejected */}
              {d.type === "uploadable" && submission?.status !== "approved" && (
                <div className="flex flex-col gap-2">
                  <input
                    ref={(el) => { fileRefs.current[d.name] = el }}
                    type="file"
                    accept={d.acceptedFormats?.map((f) => `.${f}`).join(",") || "*"}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(d, file)
                    }}
                  />
                  <button
                    onClick={() => fileRefs.current[d.name]?.click()}
                    disabled={isUploading}
                    className={`flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl border transition-all disabled:opacity-60
                      ${submission?.status === "rejected"
                        ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                        : "bg-[#EEF2FF] border-[#c7d2fe] text-[#2347C5] hover:bg-[#dbe4ff]"
                      }`}
                  >
                    <MdOutlineCloudUpload size={18} />
                    {isUploading
                      ? "Uploading..."
                      : submission?.status === "rejected"
                      ? "Re-upload Document"
                      : "Upload Document"
                    }
                  </button>
                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                </div>
              )}

              {/* Hardcopy — just shows instructions */}
              {d.type === "hardcopy" && (
                <div className="flex items-center gap-2 bg-[#f0faf7] border border-[#a7f3d0] rounded-lg px-3 py-2">
                  <MdOutlineArticle size={14} className="text-[#3DBFA0] shrink-0" />
                  <p className="text-xs text-[#3DBFA0]">
                    Bring this physical document when you reach the queue point.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}