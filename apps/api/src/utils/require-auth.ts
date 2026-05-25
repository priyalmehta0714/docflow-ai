import { FastifyRequest, FastifyReply } from "fastify";

/**
 * Use in preHandler — stops request if JWT is missing/invalid.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply
      .code(401)
      .send({ error: "Unauthorized — send Authorization: Bearer <token>" });
  }
}