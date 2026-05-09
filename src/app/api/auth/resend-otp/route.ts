import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";
import { resendOtp } from "backend/controller/AuthController";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()

router.post(resendOtp)

export const POST = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}