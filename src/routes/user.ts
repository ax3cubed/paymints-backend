import type { FastifyInstance } from "fastify"
import { UserController } from "../controllers/user.controller"
import {
  getProfileSchema,
  updateProfileSchema,
  updatePasswordSchema,
} from "../schemas/user.schema"

export async function userRoutes(fastify: FastifyInstance) {
  const userController = new UserController()

  // Get user profile
  fastify.get("/profile", { schema: getProfileSchema }, (request, reply) => userController.getProfile(request, reply))

  // Update user profile
  fastify.put("/profile", { schema: updateProfileSchema }, (request, reply) =>
    userController.updateProfile(request, reply),
  )

  // Update password
  fastify.put("/password", { schema: updatePasswordSchema }, (request, reply) =>
    userController.updatePassword(request, reply),
  )





  // Update notification settings
  fastify.put("/notification-settings", (request, reply) => userController.updateNotificationSettings(request, reply))
}

