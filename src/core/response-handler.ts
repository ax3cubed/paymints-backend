import type { FastifyReply } from "fastify"
import { ZodError } from "zod"
import { logger } from "./logger"
import { AppError, ErrorCodes } from "./errors"

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: any
  meta?: {
    timestamp: string
    requestId?: string
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export class ResponseHandler {
  /**
   * Send a success response
   */
  static success<T>(
    reply: FastifyReply,
    data?: T,
    message = "Operation successful",
    statusCode = 200,
    meta?: Partial<ApiResponse["meta"]>,
  ): FastifyReply {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    }

    return reply.code(statusCode).send(response)
  }

  /**
   * Send an error response
   */
  static error(
    reply: FastifyReply,
    error: Error | ZodError | AppError | string,
    statusCode = 500,
    requestId?: string,
  ): FastifyReply {
    let errorMessage = "Internal server error"
    let errorData: any = null
    let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR

    // Handle different error types
    if (error instanceof ZodError) {
      statusCode = 400
      errorMessage = "Validation error"
      errorData = error.errors
      errorCode = ErrorCodes.VALIDATION_ERROR
    } else if (error instanceof AppError) {
      statusCode = error.statusCode
      errorMessage = error.message
      errorData = error.data
      errorCode = error.code
    } else if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }

    // Log the error
    logger.error(
      {
        err: error instanceof Error ? error : new Error(errorMessage),
        statusCode,
        errorCode,
        requestId,
      },
      "API Error Response",
    )

    const response: ApiResponse = {
      success: false,
      message: errorMessage,
      errors: errorData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    }

    return reply.code(statusCode).send(response)
  }

  /**
   * Send a paginated response
   */
  static paginated<T>(
    reply: FastifyReply,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = "Data retrieved successfully",
    requestId?: string,
  ): FastifyReply {
    const pages = Math.ceil(total / limit)

    return this.success(reply, data, message, 200, {
      requestId,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    })
  }
}

