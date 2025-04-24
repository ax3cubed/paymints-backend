import type { FastifyRequest, FastifyReply } from "fastify"
import { createRequestLogger, generateRequestId } from "../core/logger"

/**
 * Request logger middleware
 */
export const requestLogger = (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
  const requestId = generateRequestId()
  const logger = createRequestLogger(requestId, request.url, request.method)

  // Attach logger and requestId to request object
  request.log = logger
  request.requestId = requestId

  // Add requestId to response headers
  reply.header("X-Request-ID", requestId)

  // Log request
  logger.info(
    {
      url: request.url,
      method: request.method,
      headers: request.headers,
      query: request.query,
      params: request.params,
      ip: request.ip,
    },
    "Incoming request",
  )

  // Log response
  request.raw.on('close', () => {
    logger.info(
      {
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      "Outgoing response",
    )
  })

  done()
}

