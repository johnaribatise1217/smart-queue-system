import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";
import { verifyOtp } from "backend/controller/AuthController";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()

router.put(verifyOtp)

export const PUT = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}