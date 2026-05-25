import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, Role } from "@docflow/db";

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    tenantId: z.string().min(3).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
    // POST /auth/register — dev only convenience
    app.post("/auth/register", async (request, reply) => {
        const body = registerSchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(400).send({ error: body.error.flatten() });
        }

        const { email, password, tenantId } = body.data;
        const passwordHash = await bcrypt.hash(password, 10);

        try {
            const user = await prisma.user.create({
                data: {
                    email,
                    password: passwordHash,
                    tenantId: tenantId ?? "tenant_demo",
                    role: Role.USER,
                },
            });

            return reply.code(201).send({
                id: user.id,
                email: user.email,
                tenantId: user.tenantId,
            });
        } catch {
            return reply.code(409).send({ error: "Email already exists" });
        }
    });

    // POST /auth/login
    app.post("/auth/login", async (request, reply) => {
        const body = loginSchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(400).send({ error: body.error.flatten() });
        }

        const { email, password } = body.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return reply.code(401).send({ error: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return reply.code(401).send({ error: "Invalid email or password" });
        }

        const token = app.jwt.sign(
            {
                sub: user.id,
                email: user.email,
                tenantId: user.tenantId,
            },
            { expiresIn: "7d" }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                tenantId: user.tenantId,
                role: user.role,
            },
        };
    });

    // GET /me — protected route
    // GET /me — protected route
    app.get(
        "/me",
        {
            preHandler: async (request, reply) => {
                try {
                    await request.jwtVerify();
                } catch {
                    return reply
                        .code(401)
                        .send({ error: "Unauthorized — invalid or missing token" });
                }
            },
        },
        async (request) => {
            return { user: request.user };
        }
    );
};