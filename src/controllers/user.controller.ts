import type { FastifyRequest, FastifyReply } from "fastify"
import { UserService } from "../services/user.service"
import { BaseController } from "./base.controller"
import { z } from "zod"

// Validation schemas
const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  profileImage: z.string().optional(),
})

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
})

const updatePinSchema = z.object({
  pin: z.string().length(4).regex(/^\d+$/),
})

const addBankAccountSchema = z.object({
  bankCode: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
})

export class UserController extends BaseController {
  private userService: UserService

  constructor() {
    super()
    this.userService = new UserService()
  }

  /**
   * Get user profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.userService.getAuthenticatedUser(request)

      return this.sendSuccess(
        reply,
        {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
          
       
      
            emailVerified: user.emailVerified,
            profileImage: user.profileImage,
            address: user.address,
     
          },
        },
        "User profile retrieved successfully",
      )
    } catch (error) {
      return this.handleError(error as Error, reply, request.requestId)
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const profileData = updateProfileSchema.parse(request.body)

      const user = await this.userService.updateProfile(request, profileData)

      return this.sendSuccess(
        reply,
        {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            address: user.address,
            profileImage: user.profileImage,
          },
        },
        "Profile updated successfully",
      )
    } catch (error) {
      return this.handleError(error as Error, reply, request.requestId)
    }
  }

  /**
   * Update password
   */
  async updatePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { currentPassword, newPassword } = updatePasswordSchema.parse(request.body)

      await this.userService.updatePassword(request, currentPassword, newPassword)

      return this.sendSuccess(reply, null, "Password updated successfully")
    } catch (error) {
      return this.handleError(error as Error, reply, request.requestId)
    }
  }

 
  /**
   * Update notification settings
   */
  async updateNotificationSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { allowPushNotification, allowEmailNotification, allowBiometricsLogin } = request.body as any

      const user = await this.userService.updateNotificationSettings(request, {
        allowPushNotification,
        allowEmailNotification,
        allowBiometricsLogin,
      })

      return this.sendSuccess(
        reply,
        {
          allowPushNotification: user.allowPushNotification,
          allowEmailNotification: user.allowEmailNotification,
          allowBiometricsLogin: user.allowBiometricsLogin,
        },
        "Notification settings updated successfully",
      )
    } catch (error) {
      return this.handleError(error as Error, reply, request.requestId)
    }
  }
}

