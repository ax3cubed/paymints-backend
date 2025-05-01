import type { FastifyInstance } from "fastify"
import { AuthController } from "../controllers/auth.controller"
import {
  registerSchema,
  loginSchema,
  getMeSchema,
  initializeUserSchema,
} from "../schemas/auth.schema"

export async function authRoutes(fastify: FastifyInstance) {
  const authController = new AuthController(fastify)

  // Register a new user
  fastify.post("/connectuser", { schema: initializeUserSchema }, (request, reply) => authController.initializeUser(request, reply))
  
  fastify.post("/register", { schema: registerSchema }, (request, reply) => authController.register(request, reply))

  // Login user
  fastify.post("/login", { schema: loginSchema }, (request, reply) => authController.login(request, reply))

  // Get current user
  fastify.get("/me", { schema: getMeSchema }, (request, reply) => authController.getCurrentUser(request, reply))
}

