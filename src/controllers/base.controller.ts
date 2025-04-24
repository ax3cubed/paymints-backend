import type { FastifyReply } from "fastify"
import { ResponseHandler } from "../core/response-handler"
import { ValidationError } from "../core/errors"
import { ZodError } from "zod"

export abstract class BaseController {
  /**
   * Handle controller errors consistently
   */
  protected handleError(error: Error, reply: FastifyReply, requestId?: string): FastifyReply {
    if (error instanceof ZodError) {
      return ResponseHandler.error(reply, new ValidationError("Validation error", error.errors), 400, requestId)
    }
    return ResponseHandler.error(reply, error, undefined, requestId)
  }

  /**
   * Send a success response
   */
  protected sendSuccess<T>(
    reply: FastifyReply,
    data?: T,
    message = "Operation successful",
    statusCode = 200,
    requestId?: string,
  ): FastifyReply {
    return ResponseHandler.success(reply, data, message, statusCode, { requestId })
  }

  /**
   * Send a paginated response
   */
  protected sendPaginated<T>(
    reply: FastifyReply,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = "Data retrieved successfully",
    requestId?: string,
  ): FastifyReply {
    return ResponseHandler.paginated(reply, data, page, limit, total, message, requestId)
  }
}

