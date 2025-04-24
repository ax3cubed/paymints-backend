import pino from "pino"
import { randomUUID } from "crypto"
import config from "../config"

// Create a custom serializer for error objects
const errorSerializer = (error: Error) => {
  return {
    type: error.constructor.name,
    message: error.message,
    stack: error.stack,
  }
}

// Create a request ID generator for tracking requests
export const generateRequestId = () => {
  return randomUUID()
}

// Create a child logger with request context
export const createRequestLogger = (requestId: string, route?: string, method?: string) => {
  return logger.child({
    requestId,
    route,
    method,
  })
}

// Configure pino logger with appropriate settings for different environments
const pinoConfig = {
  level: config?.logging?.level || process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
  serializers: {
    err: errorSerializer,
    error: errorSerializer,
  },
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}

// Create the logger instance
export const logger = pino(pinoConfig)

