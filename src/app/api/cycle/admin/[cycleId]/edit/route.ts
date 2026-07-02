import { updateCycle } from "backend/controller/CycleController"
import { authorizeRoles, isAuthenticatedUser } from "backend/middleware/auth"
import { createEdgeRouter } from "next-connect"
import type { NextRequest } from "next/server"

interface RequestContext {
  params : {
    cycleId : string
  }
}

const router = createEdgeRouter<NextRequest, RequestContext>()
router.use(isAuthenticatedUser, authorizeRoles('admin')).patch(updateCycle)

export const PATCH = async(req: NextRequest, ctx: RequestContext) => {
  return router.run(req, ctx)
}