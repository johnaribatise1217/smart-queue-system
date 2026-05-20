import { getCycleByAdminIdForUser, joinCycle } from "backend/controller/CycleController";
import { authorizeRoles, isAuthenticatedUser } from "backend/middleware/auth";
import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()

router.use(isAuthenticatedUser, authorizeRoles('user')).post(joinCycle)
router.use(isAuthenticatedUser, authorizeRoles('user')).get(getCycleByAdminIdForUser)

export const POST = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}

export const GET = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}