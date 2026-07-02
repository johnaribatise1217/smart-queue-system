import { getQueueDeliverables } from "backend/controller/deliverableController";
import { isAuthenticatedUser, authorizeRoles } from "backend/middleware/auth";
import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()

router.use(isAuthenticatedUser, authorizeRoles('queue_point')).get(getQueueDeliverables)

export const GET = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}