import { getCycleDetails, toggleCycleStatus } from "backend/controller/CycleController"
import { authorizeRoles, isAuthenticatedUser } from "backend/middleware/auth"
import { createEdgeRouter } from "next-connect"
import type { NextRequest } from "next/server"

interface RequestContext {
  params : {
    cycleId : string
  }
}

const router = createEdgeRouter<NextRequest, RequestContext>()
router.use(isAuthenticatedUser, authorizeRoles('admin')).patch(toggleCycleStatus)
router.use(isAuthenticatedUser, authorizeRoles('admin')).get(getCycleDetails)

export const PATCH = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}

export const GET = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}