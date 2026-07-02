import { deleteQueue, updateQueue } from "backend/controller/CycleController"
import { authorizeRoles, isAuthenticatedUser } from "backend/middleware/auth"
import { createEdgeRouter } from "next-connect"
import type { NextRequest } from "next/server"

interface RequestContext {
  params : {
    queueId : string
  }
}

const router = createEdgeRouter<NextRequest, RequestContext>()
router.use(isAuthenticatedUser, authorizeRoles('admin')).patch(updateQueue)
router.use(isAuthenticatedUser, authorizeRoles('admin')).delete(deleteQueue)

export const PATCH = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}

export const DELETE = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}