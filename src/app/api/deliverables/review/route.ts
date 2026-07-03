import { NextRequest} from "next/server"
import { createEdgeRouter } from "next-connect"
import { reviewDeliverable } from "backend/controller/deliverableController"
import { isAuthenticatedUser, authorizeRoles } from "backend/middleware/auth"

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()

router.use(isAuthenticatedUser, authorizeRoles('queue_point')).patch(reviewDeliverable)

export const PATCH = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}