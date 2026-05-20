import { getUserActiveQueue } from "backend/controller/QueueHistory";
import { authorizeRoles, isAuthenticatedUser } from "backend/middleware/auth";
import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()

router.use(isAuthenticatedUser, authorizeRoles('user')).get(getUserActiveQueue)

export const GET = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}