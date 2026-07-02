import { NextRequest, NextResponse } from "next/server"
import { cloudinary } from "backend/config/cloudinary"
import { DeliverableSubmission } from "backend/model/deliverableSubmission"
import { catchAsyncErrors } from "backend/middleware/catchAsyncErrors"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const POST = catchAsyncErrors(async (req: NextRequest) => {

  const formData = await req.formData()
  const file            = formData.get("file") as File
  const userId          = formData.get("userId") as string
  const cycleId         = formData.get("cycleId") as string
  const queueId         = formData.get("queueId") as string
  const deliverableName = formData.get("deliverableName") as string
  const deliverableDesc = formData.get("deliverableDesc") as string

  if (!file || !userId || !cycleId || !queueId || !deliverableName) {
    return NextResponse.json(
      { success: false, message: "Missing required fields" },
      { status: 400 }
    )
  }

  // convert file to buffer for cloudinary
  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // upload to cloudinary
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder:    `queue/deliverables/${cycleId}/${queueId}`,
        resource_type: "auto",
        public_id: `${userId}_${deliverableName.replace(/\s+/g, "_")}_${Date.now()}`,
      },
      (err, result) => err ? reject(err) : resolve(result)
    ).end(buffer)
  })

  // AI verification — check if document matches deliverable requirement
  let aiVerified = false
  let aiNotes    = ""

  if (process.env.OPENAI_API_KEY && file.type.startsWith("image/")) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a document verification assistant for a queue management system.
                The user was required to submit: "${deliverableName}" — ${deliverableDesc}.
                Look at this uploaded document/image and determine:
                1. Does it appear to be the correct type of document?
                2. Is it legible and complete?
                Respond with JSON only: { "verified": true/false, "notes": "brief reason" }`,
              },
              {
                type: "image_url",
                image_url: { url: uploadResult.secure_url, detail: "low" },
              },
            ],
          },
        ],
        max_tokens: 100,
      })

      const raw = response.choices[0]?.message?.content ?? ""
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      aiVerified = parsed.verified ?? false
      aiNotes    = parsed.notes ?? ""
    } catch {
      // AI check failed — don't block upload, queue point user reviews manually
      aiNotes = "AI verification unavailable"
    }
  }

  const submission = await DeliverableSubmission.create({
    userId,
    cycleId,
    queueId,
    deliverableName,
    type:       "uploadable",
    fileUrl:    uploadResult.secure_url,
    publicId:   uploadResult.public_id,
    status:     "pending",
    aiVerified,
    aiNotes,
  })

  return NextResponse.json({
    success: true,
    message: "Document uploaded successfully",
    data: {
      _id:        submission._id,
      fileUrl:    submission.fileUrl,
      aiVerified: submission.aiVerified,
      aiNotes:    submission.aiNotes,
      status:     submission.status,
    },
  }, { status: 201 })
})