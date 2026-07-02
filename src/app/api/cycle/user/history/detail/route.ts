import { getCycleDetailForUserHistory } from "backend/controller/CycleController";
import { isAuthenticatedUser, authorizeRoles } from "backend/middleware/auth";
import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()
router.use(isAuthenticatedUser, authorizeRoles('user')).get(getCycleDetailForUserHistory)

export const GET = async (request: NextRequest, context: RequestContext) => {
  return router.run(request, context)
}