import { getQueuePointDashboard } from "backend/controller/QueuePointController";
import { isAuthenticatedUser, authorizeRoles } from "backend/middleware/auth";
import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()
router.use(isAuthenticatedUser, authorizeRoles('queue-point')).get(getQueuePointDashboard)

export const GET = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}