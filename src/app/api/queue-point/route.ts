import { createQueuePointAccount, getQueuePointAccounts } from "backend/controller/QueuePointController";
import { isAuthenticatedUser, authorizeRoles } from "backend/middleware/auth";
import { createEdgeRouter } from "next-connect";
import type { NextRequest } from "next/server";

interface RequestContext {}

const router = createEdgeRouter<NextRequest, RequestContext>()
router.use(isAuthenticatedUser, authorizeRoles('admin')).post(createQueuePointAccount)
router.use(isAuthenticatedUser, authorizeRoles('admin')).get(getQueuePointAccounts)

export const POST = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}

export const GET = async(request : NextRequest, ctx : RequestContext) => {
  return router.run(request, ctx)
}