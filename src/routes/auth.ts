import type { FastifyInstance } from "fastify"
import { AuthController } from "../controllers/auth.controller"
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  getMeSchema,
} from "../schemas/auth.schema"

export async function authRoutes(fastify: FastifyInstance) {
  const authController = new AuthController(fastify)

  // Register a new user
  fastify.post("/register", { schema: registerSchema }, (request, reply) => authController.register(request, reply))

  // Login user
  fastify.post("/login", { schema: loginSchema }, (request, reply) => authController.login(request, reply))

  // Forgot password
  fastify.post("/forgot-password", { schema: forgotPasswordSchema }, (request, reply) =>
    authController.forgotPassword(request, reply),
  )

  // Reset password
  fastify.post("/reset-password", { schema: resetPasswordSchema }, (request, reply) =>
    authController.resetPassword(request, reply),
  )

  // Get current user
  fastify.get("/me", { schema: getMeSchema }, (request, reply) => authController.getCurrentUser(request, reply))
}

